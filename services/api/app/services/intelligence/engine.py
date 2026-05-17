import asyncio
import logging
from dataclasses import dataclass

from pydantic import BaseModel

from .domain_reputation import MockReputationProvider, ReputationResult
from .heuristics import analyze_url_heuristics
from .models import RiskLevel, ScoreSignal
from .providers import GoogleSafeBrowsingProvider
from .scoring_engine import calculate_trust_score
from .url_parser import parse_url
from .whois_lookup import evaluate_whois_signals, fetch_whois
from app.services.cache.redis_client import CacheService

logger = logging.getLogger(__name__)


@dataclass
class ScanContext:
    url: str
    page_text: str | None = None
    page_title: str | None = None
    external_link_count: int = 0
    form_count: int = 0


class DomainInfo(BaseModel):
    registrar: str | None = None
    days_old: int | None = None
    country: str | None = None


class ReputationSummary(BaseModel):
    source: str
    malicious: bool
    categories: list[str] = []
    confidence: str = "medium"


class IntelligenceResult(BaseModel):
    trust_score: float
    risk_level: RiskLevel
    signals: list[ScoreSignal]
    recommendation: str
    confidence: str
    domain_info: DomainInfo | None = None
    reputation: ReputationSummary | None = None


async def analyze_dom_heuristics(
    context: ScanContext,
) -> list[ScoreSignal]:
    """
    Lightweight DOM-based heuristic analysis.
    Keeps orchestration logic clean.
    """
    signals: list[ScoreSignal] = []

    if context.form_count and context.form_count > 2:
        signals.append(
            ScoreSignal(
                name="high_form_count",
                weight=10,
                severity="low",
                reason="Page contains multiple forms, which could be used for data harvesting.",
            )
        )

    if context.external_link_count and context.external_link_count > 25:
        signals.append(
            ScoreSignal(
                name="high_external_link_count",
                weight=8,
                severity="low",
                reason="Page contains an unusually high number of external links.",
            )
        )

    return signals


async def execute_provider(
    provider,
    lookup_target: str,
    cache: CacheService | None,
):
    """
    Safely execute a provider lookup.
    Prevents one provider failure from breaking the scan pipeline.
    """
    try:
        result = await provider.lookup(
            lookup_target,
            cache=cache,
        )

        if not result:
            return None, []

        signals = provider.generate_signals(result)

        return result, signals

    except Exception as exc:
        logger.warning(
            "[PROVIDER] %s failed during lookup: %s",
            provider.__class__.__name__,
            str(exc),
        )

        return None, []


async def run_intelligence_scan(
    context: ScanContext,
    cache: CacheService | None = None,
) -> IntelligenceResult:
    logger.info(
        "[SCAN] Starting intelligence scan for URL: %s",
        context.url,
    )

    parsed_url = parse_url(context.url)

    signals: list[ScoreSignal] = []

    # --------------------------------------------------
    # 1. URL Heuristics
    # --------------------------------------------------
    logger.info("[HEURISTICS] Running URL heuristic analysis")

    heuristic_signals = analyze_url_heuristics(parsed_url)
    signals.extend(heuristic_signals)

    # --------------------------------------------------
    # 2. Reputation Providers (Parallelized)
    # --------------------------------------------------
    logger.info("[REPUTATION] Running provider intelligence checks")

    providers = [
        MockReputationProvider(),
        GoogleSafeBrowsingProvider(),
    ]

    provider_tasks = []

    for provider in providers:
        lookup_target = (
            context.url
            if isinstance(provider, GoogleSafeBrowsingProvider)
            else parsed_url.domain
        )

        provider_tasks.append(
            execute_provider(
                provider,
                lookup_target,
                cache,
            )
        )

    provider_results = await asyncio.gather(
        *provider_tasks,
        return_exceptions=False,
    )

    reputation_results: list[ReputationResult] = []

    for result, generated_signals in provider_results:
        if result:
            reputation_results.append(result)

        if generated_signals:
            signals.extend(generated_signals)

    # --------------------------------------------------
    # 3. Reputation Summary
    # --------------------------------------------------
    reputation: ReputationSummary | None = None

    for r in reputation_results:
        if (
            r.is_malicious
            or r.provider_name
            == GoogleSafeBrowsingProvider.PROVIDER_NAME
        ):
            reputation = ReputationSummary(
                source=r.provider_name,
                malicious=r.is_malicious,
                categories=r.categories,
                confidence="high"
                if r.is_malicious
                else "medium",
            )

            if r.is_malicious:
                break

    # --------------------------------------------------
    # 4. WHOIS / Domain Age Intelligence
    # --------------------------------------------------
    logger.info("[WHOIS] Fetching WHOIS intelligence")

    whois_result = await fetch_whois(
        parsed_url.domain,
        cache=cache,
    )

    if whois_result:
        logger.info(
            "[WHOIS] WHOIS data successfully resolved"
        )
    else:
        logger.warning(
            "[WHOIS] WHOIS lookup returned no data"
        )

    whois_signals = evaluate_whois_signals(
        whois_result
    )

    signals.extend(whois_signals)

    domain_info = None

    if whois_result:
        domain_info = DomainInfo(
            registrar=whois_result.registrar,
            days_old=whois_result.days_old,
            country=whois_result.country,
        )

    # --------------------------------------------------
    # 5. DOM Heuristics
    # --------------------------------------------------
    logger.info(
        "[DOM] Running lightweight DOM heuristic analysis"
    )

    dom_signals = await analyze_dom_heuristics(
        context
    )

    signals.extend(dom_signals)

    # --------------------------------------------------
    # 6. Central Scoring
    # --------------------------------------------------
    logger.info(
        "[SCORING] Calculating final trust score"
    )

    score, level, recommendation = (
        calculate_trust_score(signals)
    )

    # --------------------------------------------------
    # 7. Confidence Evaluation
    # --------------------------------------------------
    confidence = "medium"

    critical_signals = [
        s for s in signals
        if s.severity == "critical"
    ]

    high_signals = [
        s for s in signals
        if s.severity == "high"
    ]

    if reputation and reputation.malicious:
        confidence = "high"

    elif len(critical_signals) >= 2:
        confidence = "high"

    elif len(high_signals) >= 2:
        confidence = "medium"

    elif len(signals) <= 1:
        confidence = "low"

    logger.info(
        "[SCAN] Completed scan | Score=%s | Risk=%s | Signals=%s",
        score,
        level,
        len(signals),
    )

    return IntelligenceResult(
        trust_score=score,
        risk_level=level,
        signals=signals,
        recommendation=recommendation,
        confidence=confidence,
        domain_info=domain_info,
        reputation=reputation,
    )