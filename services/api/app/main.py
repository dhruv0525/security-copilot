from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import router as v1_router
from app.config import get_settings
from app.core.logging import configure_logging
from app.middleware.error_handler import global_exception_handler
from app.middleware.rate_limiter import RateLimiterMiddleware
from app.middleware.request_id import RequestIDMiddleware
from app.services.cache.redis_client import close_redis, get_redis


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    configure_logging()
    # Warm up Redis connection
    try:
        redis_client = await get_redis()
        # Attempt a quick check
        await redis_client.ping()
    except Exception as exc:
        import logging
        logging.getLogger("app.main").warning(
            "[REDIS] Could not connect to Redis on startup: %s. Graceful degradation enabled.",
            exc,
        )
    yield
    # Graceful shutdown
    try:
        await close_redis()
    except Exception:
        pass


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        docs_url="/docs" if not settings.is_production else None,
        redoc_url="/redoc" if not settings.is_production else None,
        lifespan=lifespan,
    )

    # ── CORS Setup ──
    raw_origins = settings.backend_cors_origins
    if isinstance(raw_origins, str):
        parsed_origins = [o.strip() for o in raw_origins.split(",") if o.strip()]
    else:
        parsed_origins = raw_origins

    origins = []
    allow_origin_regex = None

    for origin in parsed_origins:
        if origin == "chrome-extension://*":
            allow_origin_regex = r"^chrome-extension://.*$"
        elif origin.startswith("chrome-extension://"):
            allow_origin_regex = r"^chrome-extension://.*$"
        else:
            origins.append(origin)

    # ── Middleware (order matters: outermost runs first on request) ──
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_origin_regex=allow_origin_regex,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(RateLimiterMiddleware)
    app.add_middleware(RequestIDMiddleware)

    # ── Global exception handler ──
    app.add_exception_handler(Exception, global_exception_handler)

    # ── Routes ──
    app.include_router(v1_router, prefix=settings.api_v1_prefix)

    @app.get("/health", tags=["ops"])
    async def health() -> dict:
        return {"status": "ok", "version": "0.1.0"}

    return app


app = create_app()
