import httpx
import structlog
from typing import Optional

from app.config import get_settings
from app.services.cache.redis_client import CacheService
from app.services.intelligence.domain_reputation import ReputationProvider, ReputationResult
from app.services.intelligence.models import ScoreSignal

logger = structlog.get_logger(__name__)


class GoogleSafeBrowsingProvider(ReputationProvider):
    PROVIDER_NAME = "Google Safe Browsing"
    API_URL = "https://safebrowsing.googleapis.com/v4/threatMatches:find"

    def __init__(self):
        settings = get_settings()
        self.api_key = settings.google_safe_browsing_api_key
        # Debug: confirm key loaded at init time
        if self.api_key:
            print(f"[GSB] Provider initialized — API key loaded (length={len(self.api_key)})")
        else:
            print("[GSB] Provider initialized — NO API KEY FOUND. Set GOOGLE_SAFE_BROWSING_API_KEY in .env")

    async def lookup(self, url: str, cache: Optional[CacheService] = None) -> Optional[ReputationResult]:
        print(f"[GSB] lookup() called for: {url}")

        if not self.api_key:
            print("[GSB] Aborting — no API key configured")
            logger.warning("gsb_disabled", reason="no_api_key")
            return None

        # Normalize: ensure URL has a scheme
        url_to_check = url if url.startswith("http") else f"https://{url}"

        # Cache key is based on exact URL (not domain) — domain-keyed lookups
        # caused permanent cache misses that stored non-malicious results for the
        # domain, then served them back for specific malicious paths.
        cache_key = f"rep:gsb:v2:{url_to_check}"

        if cache:
            try:
                cached_data = await cache.get_json(cache_key)
                if cached_data is not None:
                    print(f"[GSB] Cache HIT for {url_to_check}")
                    return ReputationResult(**cached_data)
                else:
                    print(f"[GSB] Cache MISS for {url_to_check}")
            except Exception as e:
                print(f"[GSB] Cache read error: {e}")
                logger.warning("gsb_cache_read_error", url=url_to_check, error=str(e))

        payload = {
            "client": {
                "clientId": "security-copilot-api",
                "clientVersion": "1.0.0"
            },
            "threatInfo": {
                "threatTypes": [
                    "MALWARE",
                    "SOCIAL_ENGINEERING",
                    "UNWANTED_SOFTWARE",
                    "POTENTIALLY_HARMFUL_APPLICATION",
                    "THREAT_TYPE_UNSPECIFIED",
                ],
                "platformTypes": ["ANY_PLATFORM"],
                "threatEntryTypes": ["URL"],
                "threatEntries": [
                    {"url": url_to_check}
                ]
            }
        }

        print(f"[GSB] Sending request to Safe Browsing API for: {url_to_check}")

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.post(
                    f"{self.API_URL}?key={self.api_key}",
                    json=payload
                )

            print(f"[GSB] Response status: {resp.status_code}")

            if resp.status_code == 400:
                print(f"[GSB] 400 Bad Request — malformed payload. Body: {resp.text[:500]}")
                logger.error("gsb_bad_request", body=resp.text[:500])
                return None

            if resp.status_code == 403:
                print(
                    f"[GSB] 403 Forbidden — API key invalid or Safe Browsing API "
                    f"not enabled in Google Cloud Console. Body: {resp.text[:500]}"
                )
                logger.error("gsb_forbidden", body=resp.text[:200])
                return None

            if resp.status_code == 429:
                print("[GSB] 429 Rate limited — quota exceeded.")
                logger.warning("gsb_rate_limited")
                return None

            if not resp.is_success:
                print(f"[GSB] Unexpected status {resp.status_code}. Body: {resp.text[:500]}")
                logger.error("gsb_unexpected_status", status=resp.status_code)
                return None

            data = resp.json()
            print(f"[GSB] Raw response JSON: {data}")

        except httpx.TimeoutException:
            print("[GSB] Request timed out")
            logger.warning("gsb_timeout", url=url_to_check)
            return None
        except Exception as e:
            print(f"[GSB] Request failed: {e}")
            logger.warning("gsb_request_error", url=url_to_check, error=str(e))
            return None

        matches = data.get("matches", [])
        print(f"[GSB] Matches found: {len(matches)} — {matches}")

        is_malicious = len(matches) > 0
        categories: list[str] = []
        details = "No malicious records found by Google Safe Browsing."
        confidence = 0.5

        if is_malicious:
            categories = list({m.get("threatType") for m in matches if m.get("threatType")})
            confidence = 0.95
            details = f"Google Safe Browsing detected: {', '.join(categories)}"
            print(f"[GSB] MALICIOUS — categories: {categories}")
        else:
            print("[GSB] Clean — no matches returned")

        result = ReputationResult(
            is_malicious=is_malicious,
            confidence=confidence,
            provider_name=self.PROVIDER_NAME,
            details=details,
            categories=categories,
        )

        if cache:
            try:
                await cache.set_json(cache_key, result.model_dump(), 3600 * 6)
                print(f"[GSB] Result cached for 6h under key: {cache_key}")
            except Exception as e:
                print(f"[GSB] Cache write error: {e}")
                logger.warning("gsb_cache_write_error", url=url_to_check, error=str(e))

        return result

    def generate_signals(self, result: ReputationResult) -> list[ScoreSignal]:
        signals: list[ScoreSignal] = []
        if not result.is_malicious:
            return signals

        for cat in result.categories:
            if cat == "SOCIAL_ENGINEERING":
                signals.append(ScoreSignal(
                    name="google_flagged_phishing",
                    weight=80,
                    severity="critical",
                    reason="Google Safe Browsing flagged this URL for phishing activity",
                ))
            elif cat == "MALWARE":
                signals.append(ScoreSignal(
                    name="google_flagged_malware",
                    weight=80,
                    severity="critical",
                    reason="Google Safe Browsing detected malware-related threats",
                ))
            elif cat in ("UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"):
                signals.append(ScoreSignal(
                    name="google_flagged_unwanted_software",
                    weight=50,
                    severity="high",
                    reason="Google Safe Browsing detected potentially unwanted software",
                ))
            elif cat == "THREAT_TYPE_UNSPECIFIED":
                signals.append(ScoreSignal(
                    name="google_flagged_threat",
                    weight=50,
                    severity="high",
                    reason="Google Safe Browsing detected an unspecified threat",
                ))

        print(f"[GSB] Generated {len(signals)} signal(s): {[s.name for s in signals]}")
        return signals
