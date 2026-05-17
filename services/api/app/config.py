from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # ── App ──────────────────────────────────────────
    app_name: str = "Security Copilot API"
    environment: str = "development"
    log_level: str = "INFO"
    api_v1_prefix: str = "/api/v1"

    # ── Security ─────────────────────────────────────
    secret_key: str
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 30
    algorithm: str = "HS256"

    # ── Database ─────────────────────────────────────
    database_url: str  # postgresql+asyncpg://...

    # ── Redis ────────────────────────────────────────
    redis_url: str = "redis://localhost:6379/0"
    url_cache_ttl_seconds: int = 900  # 15 minutes
    rate_limit_requests: int = 60
    rate_limit_window_seconds: int = 60

    # ── OpenAI ───────────────────────────────────────
    openai_api_key: str
    openai_model: str = "gpt-4o-mini"

    # ── CORS ─────────────────────────────────────────
    backend_cors_origins: str | list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # ── External APIs ────────────────────────────────
    google_safe_browsing_api_key: str | None = None

    @property
    def is_production(self) -> bool:
        return self.environment == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
