from fastapi import Request, status, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import get_settings
from app.core.logging import get_logger
from app.services.cache.redis_client import get_redis

logger = get_logger(__name__)
settings = get_settings()

# Endpoints that bypass rate limiting (e.g. healthcheck)
_EXEMPT_PATHS = {"/health", "/docs", "/openapi.json"}


class RateLimiterMiddleware(BaseHTTPMiddleware):
    """
    Per-user sliding-window rate limiter backed by Redis.
    Falls back to per-IP limiting for unauthenticated requests.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        if request.url.path in _EXEMPT_PATHS:
            return await call_next(request)

        identifier = self._get_identifier(request)
        redis = await get_redis()
        key = f"rate_limit:{identifier}"

        try:
            count = await redis.incr(key)
            if count == 1:
                await redis.expire(key, settings.rate_limit_window_seconds)

            if count > settings.rate_limit_requests:
                logger.warning("rate_limit_exceeded", identifier=identifier)
                return JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={"error": "rate_limit_exceeded", "detail": "Too many requests."},
                    headers={"Retry-After": str(settings.rate_limit_window_seconds)},
                )
        except Exception:
            # Redis unavailable — fail open, log the issue
            logger.error("rate_limiter_redis_error", identifier=identifier)

        return await call_next(request)

    def _get_identifier(self, request: Request) -> str:
        # Use user ID from JWT if present, otherwise fall back to IP
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            return f"token:{auth[7:20]}"  # first 13 chars of token as key
        forwarded = request.headers.get("X-Forwarded-For")
        return f"ip:{forwarded or request.client.host}"
