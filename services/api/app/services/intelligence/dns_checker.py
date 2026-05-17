"""
DNS resolution verification service.

Performs async-safe DNS queries to verify if a domain has active DNS records.
Handles timeouts gracefully, caches results in Redis, and degrades gracefully
on network or service failures.
"""
import asyncio
import logging
import socket
from typing import Optional

from .models import ScoreSignal
from app.services.cache.redis_client import CacheService

logger = logging.getLogger(__name__)

DNS_TIMEOUT = 5.0
CACHE_TTL = 3600 * 12  # Cache DNS results for 12 hours


async def check_dns_resolution(
    hostname: str,
    cache: Optional[CacheService] = None,
) -> tuple[bool, list[ScoreSignal]]:
    """
    Asynchronously checks if a domain resolves via DNS.
    Returns (resolves, list[ScoreSignal]).
    """
    cache_key = f"dns:v1:{hostname}"

    if cache:
        try:
            cached_data = await cache.get_json(cache_key)
            if cached_data is not None:
                logger.debug("[DNS] Cache HIT %s -> resolves=%s", hostname, cached_data.get("resolves"))
                signals = [ScoreSignal(**s) for s in cached_data.get("signals", [])]
                return cached_data.get("resolves", False), signals
        except Exception as exc:
            logger.warning("[DNS] Cache read error for %s: %s", hostname, exc)

    resolves = False
    loop = asyncio.get_running_loop()

    try:
        # Standard resolve in executor to avoid blocking the event loop
        # We query socket.getaddrinfo which works on all platforms and doesn't require third-party libraries.
        await asyncio.wait_for(
            loop.run_in_executor(
                None,
                socket.getaddrinfo,
                hostname,
                None,
            ),
            timeout=DNS_TIMEOUT,
        )
        resolves = True
        logger.debug("[DNS] Successfully resolved %s", hostname)
    except asyncio.TimeoutError:
        logger.warning("[DNS] Query timed out for %s", hostname)
    except socket.gaierror as exc:
        # gaierror with EAI_NONAME / EAI_NODATA indicates name resolution failure (domain doesn't resolve)
        logger.info("[DNS] Domain resolution failed for %s: %s", hostname, exc)
    except Exception as exc:
        logger.warning("[DNS] Unexpected resolution error for %s: %s", hostname, exc)

    signals: list[ScoreSignal] = []
    if not resolves:
        signals.append(ScoreSignal(
            name="domain_resolution_failed",
            weight=25,
            severity="medium",
            reason="Domain could not be resolved via DNS.",
        ))

    if cache:
        try:
            payload = {
                "resolves": resolves,
                "signals": [s.model_dump() for s in signals],
            }
            await cache.set_json(cache_key, payload, CACHE_TTL)
            logger.debug("[DNS] Cached result for %s", hostname)
        except Exception as exc:
            logger.warning("[DNS] Cache write error for %s: %s", hostname, exc)

    return resolves, signals
