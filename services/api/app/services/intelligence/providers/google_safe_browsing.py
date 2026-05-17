"""
Google Safe Browsing v4 reputation provider.

Checks URLs against Google's threat database (SOCIAL_ENGINEERING, MALWARE,
UNWANTED_SOFTWARE, etc.) and translates matches into explainable ScoreSignals.

Redis caching uses URL-level keys with a 6-hour TTL to avoid repeated API hits
on the same URL.
"""
import logging
from typing import Optional

import httpx
import structlog

from app.config import get_settings
from app.services.cache.redis_client import CacheService
from app.services.intelligence.domain_reputation import ReputationProvider, ReputationResult
from app.services.intelligence.models import ScoreSignal

logger = structlog.get_logger(__name__)
_std_logger = logging.getLogger(__name__)


class GoogleSafeBrowsingProvider(ReputationProvider):
    PROVIDER_NAME = "Google Safe Browsing"
    API_URL = "https://safebrowsing.googleapis.com/v4/threatMatches:find"
    CACHE_TTL = 3600 * 6  # 6 hours

    def __init__(self):
        settings = get_settings()
        self.api_key = settings.google_safe_browsing_api_key
        if self.api_key:
            _std_logger.debug("[GSB] Provider ready (key length=%d)", len(self.api_key))
        else:
            _std_logger.warning("[GSB] GOOGLE_SAFE_BROWSING_API_KEY not set — provider disabled")

    async def lookup(self, url: str, cache: Optional[CacheService] = None) -> Optional[ReputationResult]:
        if not self.api_key:
            return None

        url_to_check = url if url.startswith("http") else f"https://{url}"
        cache_key = f"rep:gsb:v2:{url_to_check}"

        # Cache read
        if cache:
            try:
                cached_data = await cache.get_json(cache_key)
                if cached_data is not None:
                    _std_logger.debug("[GSB] Cache HIT %s", url_to_check)
                    return ReputationResult(**cached_data)
                _std_logger.debug("[GSB] Cache MISS %s", url_to_check)
            except Exception as exc:
                logger.warning("gsb_cache_read_error", url=url_to_check, error=str(exc))

        payload = {
            "client": {"clientId": "security-copilot-api", "clientVersion": "1.0.0"},
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
                "threatEntries": [{"url": url_to_check}],
            },
        }

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.post(f"{self.API_URL}?key={self.api_key}", json=payload)

            if resp.status_code == 400:
                logger.error("gsb_bad_request", status=400, body=resp.text[:300])
                return None
            if resp.status_code == 403:
                logger.error("gsb_forbidden", detail="Check API key and that Safe Browsing API is enabled in Google Cloud Console")
                return None
            if resp.status_code == 429:
                logger.warning("gsb_rate_limited")
                return None
            if not resp.is_success:
                logger.error("gsb_unexpected_status", status=resp.status_code)
                return None

            data = resp.json()

        except httpx.TimeoutException:
            logger.warning("gsb_timeout", url=url_to_check)
            return None
        except Exception as exc:
            logger.warning("gsb_request_error", url=url_to_check, error=str(exc))
            return None

        matches = data.get("matches", [])
        is_malicious = len(matches) > 0
        categories: list[str] = []
        confidence = 0.5
        details = "No threats detected by Google Safe Browsing."

        if is_malicious:
            categories = list({m.get("threatType") for m in matches if m.get("threatType")})
            confidence = 0.95
            details = f"Detected: {', '.join(categories)}"
            _std_logger.info("[GSB] MALICIOUS %s — %s", url_to_check, categories)
        else:
            _std_logger.debug("[GSB] Clean — %s", url_to_check)

        result = ReputationResult(
            is_malicious=is_malicious,
            confidence=confidence,
            provider_name=self.PROVIDER_NAME,
            details=details,
            categories=categories,
        )

        # Cache write
        if cache:
            try:
                await cache.set_json(cache_key, result.model_dump(), self.CACHE_TTL)
            except Exception as exc:
                logger.warning("gsb_cache_write_error", url=url_to_check, error=str(exc))

        return result

    def generate_signals(self, result: ReputationResult) -> list[ScoreSignal]:
        if not result.is_malicious:
            return []

        signals: list[ScoreSignal] = []
        for cat in result.categories:
            if cat == "SOCIAL_ENGINEERING":
                signals.append(ScoreSignal(
                    name="google_flagged_phishing",
                    weight=80,
                    severity="critical",
                    reason="Google Safe Browsing flagged this URL for phishing activity.",
                ))
            elif cat == "MALWARE":
                signals.append(ScoreSignal(
                    name="google_flagged_malware",
                    weight=80,
                    severity="critical",
                    reason="Google Safe Browsing detected malware-related threats.",
                ))
            elif cat in ("UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"):
                signals.append(ScoreSignal(
                    name="google_flagged_unwanted_software",
                    weight=50,
                    severity="high",
                    reason="Google Safe Browsing detected potentially unwanted software.",
                ))
            elif cat == "THREAT_TYPE_UNSPECIFIED":
                signals.append(ScoreSignal(
                    name="google_flagged_threat",
                    weight=50,
                    severity="high",
                    reason="Google Safe Browsing detected an unspecified threat.",
                ))

        _std_logger.debug("[GSB] Generated %d signal(s)", len(signals))
        return signals
