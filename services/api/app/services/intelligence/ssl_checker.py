"""
SSL/TLS certificate intelligence.

Implementation strategy:
  1. Use `openssl s_client` to establish the TLS connection and capture the
     leaf certificate PEM.
  2. Pipe PEM into `openssl x509 -noout -text` to decode all cert fields.

This two-stage approach is required because `s_client` alone does NOT emit
`Not Before` / `Not After` — those are certificate fields only available after
decoding the PEM blob.

Signals produced:
  expired_certificate          — critical
  self_signed_certificate      — high
  hostname_mismatch            — high
  suspicious_short_validity    — medium
  ssl_unavailable              — medium  (site doesn't respond on HTTPS)
"""
import asyncio
import logging
import re
from datetime import datetime, timezone
from typing import Optional

from pydantic import BaseModel

from .models import ScoreSignal
from app.services.cache.redis_client import CacheService

logger = logging.getLogger(__name__)

OPENSSL_CONNECT_TIMEOUT = 7.0
OPENSSL_DECODE_TIMEOUT = 4.0
CACHE_TTL = 3600 * 6  # 6 hours

# openssl x509 -text emits:  "            Not After : Apr 12 23:59:59 2015 GMT"
# Note the space before the colon on "Not After"
_DATE_FMT = "%b %d %H:%M:%S %Y %Z"


class SSLInfo(BaseModel):
    issuer: Optional[str] = None
    subject: Optional[str] = None
    valid_from: Optional[str] = None
    valid_until: Optional[str] = None
    validity_days: Optional[int] = None
    expired: bool = False
    self_signed: bool = False


async def _fetch_leaf_pem(hostname: str, port: int = 443) -> str:
    """
    Connect via s_client, return the raw PEM of the LEAF certificate only.
    We strip intermediate certs by taking only the first -----BEGIN CERTIFICATE----- block.
    """
    try:
        proc = await asyncio.create_subprocess_exec(
            "openssl", "s_client",
            "-connect", f"{hostname}:{port}",
            "-servername", hostname,
            "-showcerts",
            stdin=asyncio.subprocess.DEVNULL,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.DEVNULL,  # suppress handshake noise
        )
        stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=OPENSSL_CONNECT_TIMEOUT)
        raw = stdout.decode(errors="ignore") if stdout else ""
    except asyncio.TimeoutError:
        logger.warning("[SSL] s_client timed out for %s", hostname)
        return ""
    except FileNotFoundError:
        logger.debug("[SSL] openssl binary not found — SSL check skipped")
        return ""
    except Exception as exc:
        logger.warning("[SSL] s_client error for %s: %s", hostname, exc)
        return ""

    # Extract ONLY the first PEM block = the leaf/end-entity certificate
    pem_match = re.search(
        r"(-----BEGIN CERTIFICATE-----.*?-----END CERTIFICATE-----)",
        raw,
        re.DOTALL,
    )
    if not pem_match:
        logger.debug("[SSL] No PEM block found in s_client output for %s", hostname)
        return ""

    return pem_match.group(1)


async def _decode_pem(pem: str) -> str:
    """Decode a PEM certificate into human-readable text via `openssl x509 -text`."""
    if not pem:
        return ""
    try:
        proc = await asyncio.create_subprocess_exec(
            "openssl", "x509", "-noout", "-text",
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.DEVNULL,
        )
        stdout, _ = await asyncio.wait_for(
            proc.communicate(input=pem.encode()),
            timeout=OPENSSL_DECODE_TIMEOUT,
        )
        return stdout.decode(errors="ignore") if stdout else ""
    except Exception as exc:
        logger.warning("[SSL] x509 decode error: %s", exc)
        return ""


def _parse_cert_text(text: str, hostname: str) -> Optional[SSLInfo]:
    """Parse `openssl x509 -text` output into SSLInfo."""
    if not text:
        return None

    info = SSLInfo()
    now = datetime.now(timezone.utc)

    # --- Subject / Issuer ---
    # Format: "        Subject: OU=..., CN=*.badssl.com"
    subject_match = re.search(r"Subject:\s*(.+)", text)
    issuer_match = re.search(r"Issuer:\s*(.+)", text)
    if subject_match:
        info.subject = subject_match.group(1).strip()
    if issuer_match:
        info.issuer = issuer_match.group(1).strip()

    # Self-signed: issuer equals subject
    if info.issuer and info.subject and info.issuer == info.subject:
        info.self_signed = True

    # --- Validity dates ---
    # Format: "            Not Before: Apr  9 00:00:00 2015 GMT"
    #         "            Not After : Apr 12 23:59:59 2015 GMT"
    # Note: "Not After" has a trailing space before the colon in some openssl versions.
    not_before_m = re.search(r"Not Before\s*:\s*(.+)", text)
    not_after_m = re.search(r"Not After\s*:\s*(.+)", text)

    if not_before_m:
        info.valid_from = not_before_m.group(1).strip()
        logger.debug("[SSL] Parsed notBefore='%s' for %s", info.valid_from, hostname)

    if not_after_m:
        info.valid_until = not_after_m.group(1).strip()
        logger.debug("[SSL] Parsed notAfter='%s' for %s", info.valid_until, hostname)
        logger.debug("[SSL] Current UTC time: %s", now.isoformat())

        try:
            # datetime.strptime with %Z handles "GMT" → naive but known-UTC
            expires = datetime.strptime(info.valid_until, _DATE_FMT)
            # strptime with %Z on "GMT" returns a naive datetime; make it explicit UTC
            expires = expires.replace(tzinfo=timezone.utc)
            logger.debug("[SSL] Parsed expiry=%s expired=%s", expires.isoformat(), expires < now)

            info.expired = expires < now

            if not_before_m and info.valid_from:
                try:
                    issued = datetime.strptime(info.valid_from, _DATE_FMT)
                    issued = issued.replace(tzinfo=timezone.utc)
                    info.validity_days = (expires - issued).days
                except ValueError:
                    pass

        except ValueError as ve:
            # Try alternative format without seconds: "Apr  9 00:00:00 2015 GMT" should work,
            # but guard against unusual locale-specific variations.
            logger.warning("[SSL] Could not parse notAfter '%s' for %s: %s", info.valid_until, hostname, ve)

    logger.debug(
        "[SSL] Certificate for %s — subject=%s expired=%s self_signed=%s validity_days=%s",
        hostname, info.subject, info.expired, info.self_signed, info.validity_days,
    )
    return info


def _evaluate_ssl_signals(info: Optional[SSLInfo], hostname: str) -> list[ScoreSignal]:
    """Translate SSLInfo into explainable ScoreSignals."""
    signals: list[ScoreSignal] = []

    if info is None:
        signals.append(ScoreSignal(
            name="ssl_unavailable",
            weight=12,
            severity="medium",
            reason="Could not establish an SSL/TLS connection to the site.",
        ))
        return signals

    if info.expired:
        signals.append(ScoreSignal(
            name="expired_certificate",
            weight=40,
            severity="critical",
            reason=f"SSL certificate expired on {info.valid_until}.",
        ))

    if info.self_signed:
        signals.append(ScoreSignal(
            name="self_signed_certificate",
            weight=30,
            severity="high",
            reason="Site uses a self-signed SSL certificate not trusted by any CA.",
        ))

    # Hostname mismatch — check both exact match and wildcard
    if info.subject and hostname.lower() not in info.subject.lower():
        parts = hostname.split(".", 1)
        wildcard = f"*.{parts[1]}" if len(parts) == 2 else ""
        if wildcard.lower() not in info.subject.lower():
            signals.append(ScoreSignal(
                name="hostname_mismatch",
                weight=35,
                severity="high",
                reason=f"SSL certificate subject '{info.subject}' does not match hostname '{hostname}'.",
            ))

    if info.validity_days is not None and 0 < info.validity_days < 30:
        signals.append(ScoreSignal(
            name="suspicious_short_validity",
            weight=15,
            severity="medium",
            reason=f"SSL certificate has an unusually short validity window of {info.validity_days} days.",
        ))

    return signals


async def check_ssl(
    hostname: str,
    cache: Optional[CacheService] = None,
) -> tuple[Optional[SSLInfo], list[ScoreSignal]]:
    """
    Public entry point. Returns (SSLInfo | None, list[ScoreSignal]).
    Never raises — degrades gracefully on any failure.
    """
    cache_key = f"ssl:v2:{hostname}"  # v2 to bust old cached data from v1 broken impl

    if cache:
        try:
            cached = await cache.get_json(cache_key)
            if cached is not None:
                logger.debug("[SSL] Cache HIT %s", hostname)
                info = SSLInfo(**cached["info"]) if cached.get("info") else None
                signals = [ScoreSignal(**s) for s in cached.get("signals", [])]
                return info, signals
            logger.debug("[SSL] Cache MISS %s", hostname)
        except Exception as exc:
            logger.warning("[SSL] Cache read error for %s: %s", hostname, exc)

    # Stage 1: get leaf PEM
    pem = await _fetch_leaf_pem(hostname)

    # Stage 2: decode PEM to text
    cert_text = await _decode_pem(pem)

    # Stage 3: parse fields
    info = _parse_cert_text(cert_text, hostname)

    # Stage 4: evaluate signals
    signals = _evaluate_ssl_signals(info, hostname)

    if cache:
        try:
            payload = {
                "info": info.model_dump() if info else None,
                "signals": [s.model_dump() for s in signals],
            }
            await cache.set_json(cache_key, payload, CACHE_TTL)
            logger.debug("[SSL] Cached result for %s (TTL=%dh)", hostname, CACHE_TTL // 3600)
        except Exception as exc:
            logger.warning("[SSL] Cache write error for %s: %s", hostname, exc)

    return info, signals
