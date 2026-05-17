from typing import Any

import redis.asyncio as aioredis

from app.config import get_settings
from app.core.logging import get_logger

logger = get_logger(__name__)

_redis_client: aioredis.Redis | None = None


async def get_redis() -> aioredis.Redis:
    global _redis_client
    if _redis_client is None:
        settings = get_settings()
        _redis_client = aioredis.from_url(
            settings.redis_url,
            encoding="utf-8",
            decode_responses=True,
        )
    return _redis_client


async def close_redis() -> None:
    global _redis_client
    if _redis_client:
        await _redis_client.aclose()
        _redis_client = None


class CacheService:
    """
    Thin wrapper around Redis with typed get/set and TTL helpers.
    Services call this instead of touching Redis directly.
    """

    def __init__(self, redis: aioredis.Redis) -> None:
        self._redis = redis

    async def get(self, key: str) -> str | None:
        try:
            return await self._redis.get(key)
        except Exception as exc:
            logger.warning("redis_cache_get_error", key=key, error=str(exc))
            return None

    async def set(self, key: str, value: str, ttl_seconds: int) -> None:
        try:
            await self._redis.setex(key, ttl_seconds, value)
        except Exception as exc:
            logger.warning("redis_cache_set_error", key=key, error=str(exc))

    async def delete(self, key: str) -> None:
        try:
            await self._redis.delete(key)
        except Exception as exc:
            logger.warning("redis_cache_delete_error", key=key, error=str(exc))

    async def exists(self, key: str) -> bool:
        try:
            return bool(await self._redis.exists(key))
        except Exception as exc:
            logger.warning("redis_cache_exists_error", key=key, error=str(exc))
            return False

    async def increment(self, key: str) -> int:
        try:
            return await self._redis.increment(key)
        except Exception as exc:
            try:
                return await self._redis.incr(key)
            except Exception as e:
                logger.warning("redis_cache_increment_error", key=key, error=str(e))
                return 1

    async def expire(self, key: str, seconds: int) -> None:
        try:
            await self._redis.expire(key, seconds)
        except Exception as exc:
            logger.warning("redis_cache_expire_error", key=key, error=str(exc))

    async def get_json(self, key: str) -> Any | None:
        import json
        try:
            value = await self._redis.get(key)
        except Exception as exc:
            logger.warning("redis_cache_get_json_error", key=key, error=str(exc))
            return None
        if value is None:
            return None
        try:
            return json.loads(value)
        except json.JSONDecodeError:
            logger.warning("cache_json_decode_error", key=key)
            return None

    async def set_json(self, key: str, value: Any, ttl_seconds: int) -> None:
        import json
        try:
            await self._redis.setex(key, ttl_seconds, json.dumps(value))
        except Exception as exc:
            logger.warning("redis_cache_set_json_error", key=key, error=str(exc))
