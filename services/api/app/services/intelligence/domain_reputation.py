from abc import ABC, abstractmethod
from pydantic import BaseModel
from .models import ScoreSignal
from app.services.cache.redis_client import CacheService

class ReputationResult(BaseModel):
    is_malicious: bool
    confidence: float
    provider_name: str
    details: str
    categories: list[str] = []

class ReputationProvider(ABC):
    @abstractmethod
    async def lookup(self, domain: str, cache: CacheService | None = None) -> ReputationResult | None:
        pass

    def generate_signals(self, result: ReputationResult) -> list[ScoreSignal]:
        if result.is_malicious:
            return [
                ScoreSignal(
                    name=f"reputation_flagged",
                    weight=int(50 * result.confidence),
                    severity="critical" if result.confidence > 0.8 else "high",
                    reason=f"Flagged as malicious by {result.provider_name}: {result.details}"
                )
            ]
        return []

class MockReputationProvider(ReputationProvider):
    async def lookup(self, domain: str, cache: CacheService | None = None) -> ReputationResult | None:
        if cache:
            cache_key = f"rep:mock:{domain}"
            cached_result = await cache.get_json(cache_key)
            if cached_result:
                return ReputationResult(**cached_result)

        # MVP: Mock implementation
        result = None
        if "phishing" in domain:
            result = ReputationResult(
                is_malicious=True,
                confidence=0.9,
                provider_name="MockProvider",
                details="Domain known for phishing."
            )
        else:
            result = ReputationResult(
                is_malicious=False,
                confidence=0.5,
                provider_name="MockProvider",
                details="No malicious records found."
            )
            
        if cache and result:
            await cache.set_json(cache_key, result.model_dump(), 3600)  # cache for 1 hour
            
        return result

async def check_domain_reputation(domain: str, providers: list[ReputationProvider], cache: CacheService | None = None) -> list[ScoreSignal]:
    signals = []
    for provider in providers:
        result = await provider.lookup(domain, cache=cache)
        if result:
            signals.extend(provider.generate_signals(result))
    return signals
