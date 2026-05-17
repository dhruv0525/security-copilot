"""
Intelligence orchestration engine.

Stage order:
  1. URL Heuristics
  2. Reputation Providers (parallelized)
  3. WHOIS / Domain Age
  4. SSL/TLS Certificate
  5. DOM Enrichment (lightweight, optional)
  6. Uncertainty Signals
  7. Central Scoring
  8. Confidence Evaluation
"""
import asyncio
import logging
import re
from dataclasses import dataclass

from pydantic import BaseModel

from .dns_checker import check_dns_resolution
from .domain_reputation import MockReputationProvider, ReputationResult
from .heuristics import analyze_url_heuristics
from .models import RiskLevel, ScoreSignal
from .providers import GoogleSafeBrowsingProvider
from .scoring_engine import calculate_trust_score
from .ssl_checker import SSLInfo, check_ssl
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


class SSLSummary(BaseModel):
    issuer: str | None = None
    validity_days: int | None = None
    expired: bool = False
    self_signed: bool = False


class IntelligenceResult(BaseModel):
    trust_score: float
    risk_level: RiskLevel
    signals: list[ScoreSignal]
    recommendation: str
    confidence: str
    domain_info: DomainInfo | None = None
    reputation: ReputationSummary | None = None
    ssl_info: SSLSummary | None = None


async def _execute_provider(provider, lookup_target: str, cache: CacheService | None):
    """Safely execute a reputation provider. Isolates failures per-provider."""
    try:
        result = await provider.lookup(lookup_target, cache=cache)
        if not result:
            return None, []
        return result, provider.generate_signals(result)
    except Exception as exc:
        logger.warning("[PROVIDER] %s failed: %s", provider.__class__.__name__, exc)
        return None, []


def _build_uncertainty_signals(
    whois_result,
    reputation_results: list[ReputationResult],
    ssl_info: SSLSummary | None,
    has_gsb_result: bool,
    is_https: bool,
) -> list[ScoreSignal]:
    """
    Generate signals for ambiguous/unknown conditions.
    These represent risk-under-uncertainty rather than confirmed threats.
    """
    signals: list[ScoreSignal] = []

    # 1. Missing WHOIS
    if whois_result is None:
        signals.append(ScoreSignal(
            name="whois_unavailable",
            weight=10,
            severity="low",
            reason="Unable to verify domain registration information.",
        ))

    # 2. Missing Reputation History
    no_malicious_reputation = all(not r.is_malicious for r in reputation_results)
    if no_malicious_reputation and not has_gsb_result:
        signals.append(ScoreSignal(
            name="missing_reputation_history",
            weight=10,
            severity="low",
            reason="No established reputation history exists for this domain.",
        ))

    # 3. Missing SSL on HTTPS
    if is_https and (ssl_info is None or ssl_info.expired or ssl_info.self_signed):
        signals.append(ScoreSignal(
            name="ssl_unavailable",
            weight=15,
            severity="medium",
            reason="Unable to verify SSL/TLS certificate legitimacy.",
        ))

    return signals



async def analyze_dom_heuristics(context: ScanContext) -> list[ScoreSignal]:
    """Lightweight DOM-based signal extraction from optional page metadata."""
    signals: list[ScoreSignal] = []

    if context.form_count and context.form_count > 2:
        signals.append(ScoreSignal(
            name="high_form_count",
            weight=10,
            severity="low",
            reason="Page contains multiple forms, which could be used for credential harvesting.",
        ))

    if context.external_link_count and context.external_link_count > 25:
        signals.append(ScoreSignal(
            name="high_external_link_count",
            weight=8,
            severity="low",
            reason="Page contains an unusually high number of external links.",
        ))

    return signals


async def run_intelligence_scan(
    context: ScanContext,
    cache: CacheService | None = None,
) -> IntelligenceResult:
    logger.info("[SCAN] Starting — url=%s", context.url)

    parsed_url = parse_url(context.url)
    signals: list[ScoreSignal] = []

    # ------------------------------------------------------------------
    # Stage 1: URL Heuristics
    # ------------------------------------------------------------------
    heuristic_signals = analyze_url_heuristics(parsed_url)
    signals.extend(heuristic_signals)
    logger.debug("[HEURISTICS] %d signals", len(heuristic_signals))

    # ------------------------------------------------------------------
    # Stage 2: Reputation Providers (parallelized)
    # ------------------------------------------------------------------
    providers = [MockReputationProvider(), GoogleSafeBrowsingProvider()]

    provider_tasks = [
        _execute_provider(
            provider,
            context.url if isinstance(provider, GoogleSafeBrowsingProvider) else parsed_url.domain,
            cache,
        )
        for provider in providers
    ]

    provider_results = await asyncio.gather(*provider_tasks, return_exceptions=False)

    reputation_results: list[ReputationResult] = []
    for result, generated_signals in provider_results:
        if result:
            reputation_results.append(result)
        if generated_signals:
            signals.extend(generated_signals)

    # Build reputation summary — prefer malicious hit, fall back to GSB presence
    reputation: ReputationSummary | None = None
    has_gsb_result = False

    for r in reputation_results:
        if r.provider_name == GoogleSafeBrowsingProvider.PROVIDER_NAME:
            has_gsb_result = True
            reputation = ReputationSummary(
                source=r.provider_name,
                malicious=r.is_malicious,
                categories=r.categories,
                confidence="high" if r.is_malicious else "medium",
            )
            if r.is_malicious:
                break

    logger.debug("[REPUTATION] %d providers responded, malicious=%s", len(reputation_results), reputation and reputation.malicious)

    # ------------------------------------------------------------------
    # Stage 3: WHOIS / Domain Age
    # ------------------------------------------------------------------
    whois_result = await fetch_whois(parsed_url.domain, cache=cache)
    whois_signals = evaluate_whois_signals(whois_result)
    signals.extend(whois_signals)

    domain_info: DomainInfo | None = None
    if whois_result:
        domain_info = DomainInfo(
            registrar=whois_result.registrar,
            days_old=whois_result.days_old,
            country=whois_result.country,
        )
    logger.debug("[WHOIS] resolved=%s days_old=%s", bool(whois_result), domain_info.days_old if domain_info else None)

    # ------------------------------------------------------------------
    # Stage 4: SSL/TLS Certificate
    # ------------------------------------------------------------------
    ssl_signals: list[ScoreSignal] = []
    ssl_summary: SSLSummary | None = None

    # Only run for https; http sites don't need cert analysis
    if parsed_url.scheme == "https":
        ssl_info, ssl_signals = await check_ssl(parsed_url.domain, cache=cache)
        if ssl_info:
            ssl_summary = SSLSummary(
                issuer=ssl_info.issuer,
                validity_days=ssl_info.validity_days,
                expired=ssl_info.expired,
                self_signed=ssl_info.self_signed,
            )
        signals.extend(ssl_signals)
        logger.debug("[SSL] expired=%s self_signed=%s signals=%d", ssl_info.expired if ssl_info else None, ssl_info.self_signed if ssl_info else None, len(ssl_signals))

    # ------------------------------------------------------------------
    # Stage 5: DOM Enrichment
    # ------------------------------------------------------------------
    dom_signals = await analyze_dom_heuristics(context)
    signals.extend(dom_signals)

    # ------------------------------------------------------------------
    # Stage 5.5: DNS Resolution Verification
    # ------------------------------------------------------------------
    dns_resolves, dns_signals = await check_dns_resolution(parsed_url.domain, cache=cache)
    signals.extend(dns_signals)
    logger.debug("[DNS] resolves=%s signals=%d", dns_resolves, len(dns_signals))

    # ------------------------------------------------------------------
    # Stage 6: Uncertainty Signals
    # ------------------------------------------------------------------
    uncertainty_signals = _build_uncertainty_signals(
        whois_result,
        reputation_results,
        ssl_summary,
        has_gsb_result,
        is_https=parsed_url.scheme == "https",
    )
    signals.extend(uncertainty_signals)

    # ------------------------------------------------------------------
    # Legitimacy Evaluation & Capping
    # ------------------------------------------------------------------
    # Legitimacy factors (adds certainty to "safe/low risk" scans)
    has_valid_ssl = ssl_summary is not None and not ssl_summary.expired and not ssl_summary.self_signed
    has_old_domain = domain_info is not None and domain_info.days_old is not None and domain_info.days_old > 365
    has_known_registrar = domain_info is not None and bool(domain_info.registrar)
    has_clean_reputation = reputation is not None and not reputation.malicious
    has_zero_uncertainty = not any(s.name in ("whois_unavailable", "missing_reputation_history", "ssl_unavailable", "domain_resolution_failed") for s in signals)
    has_zero_suspicion = not any(s.name in ("ip_domain", "suspiciously_long_domain", "deceptive_keywords", "excessive_hyphens", "suspicious_tld", "excessive_subdomain_depth", "random_subdomain") for s in signals)

    # Uncertainty/Unknown factors
    has_whois_error = not whois_result
    has_ssl_error = parsed_url.scheme == "https" and (ssl_summary is None or ssl_summary.expired or ssl_summary.self_signed)
    has_no_reputation_history = not has_gsb_result

    # Threat indicators
    is_confirmed_malicious = reputation is not None and reputation.malicious
    has_critical_signals = any(s.severity == "critical" for s in signals)
    has_high_signals = any(s.severity == "high" for s in signals)

    # 1. Calculate positive legitimacy score (0 to 100)
    legitimacy_score = 0
    if has_valid_ssl:
        legitimacy_score += 25
    if has_old_domain:
        legitimacy_score += 25
    if has_known_registrar:
        legitimacy_score += 15
    if has_clean_reputation:
        legitimacy_score += 25
    if has_zero_uncertainty and has_zero_suspicion:
        legitimacy_score += 10

    # A domain that fails DNS resolution has no verified legitimacy
    if not dns_resolves:
        legitimacy_score = 0

    # ------------------------------------------------------------------
    # Stage 7: Central Scoring & Legitimacy-Aware Capping
    # ------------------------------------------------------------------
    score, level, recommendation = calculate_trust_score(signals)

    # Apply score caps to prevent unknown/unverified domains from receiving high/perfect trust scores.
    original_score = score
    if legitimacy_score < 20:
        score = min(score, 70.0)
    if legitimacy_score == 0:
        score = min(score, 60.0)

    if score < original_score:
        logger.info(
            "[SCORING] Legitimacy score cap applied: reduced score from %.1f to %.1f (legitimacy_score=%d)",
            original_score,
            score,
            legitimacy_score,
        )
        # Recalculate RiskLevel / recommendation based on capped score
        if score < 40:
            level = "critical"
        elif score < 60:
            level = "high"
        elif score < 80:
            level = "medium"
        elif score < 90:
            level = "low"
        else:
            level = "safe"

        if level in ["critical", "high"]:
            recommendation = "Avoid entering credentials or sensitive information."
        elif level == "medium":
            recommendation = "Exercise caution. Do not enter passwords unless you are sure of the site's identity."
        elif level == "low":
            recommendation = "Low risk detected, but standard browsing precautions apply."
        else:
            recommendation = "Safe to browse."

    # ------------------------------------------------------------------
    # Stage 8: Confidence Evaluation
    # ------------------------------------------------------------------
    # Determine final confidence based on certainty semantics
    if is_confirmed_malicious or has_critical_signals:
        # High certainty of threat because we have definitive threat intelligence
        confidence = "high"
        reasoning = "definitive threat intelligence detected (GSB flag or critical signal)"
    elif legitimacy_score >= 65:
        # High certainty of safety because we have strong verified positive indicators
        confidence = "high"
        reasoning = f"verified positive legitimacy indicators (legitimacy_score={legitimacy_score})"
    elif has_whois_error and has_ssl_error and has_no_reputation_history:
        # Low certainty because we have almost zero signal / telemetry to verify legitimacy
        confidence = "low"
        reasoning = "extreme uncertainty (no WHOIS, no valid SSL, no reputation history)"
    elif legitimacy_score >= 30:
        # Medium certainty: moderate legitimacy indicators
        confidence = "medium"
        reasoning = f"moderate positive legitimacy indicators (legitimacy_score={legitimacy_score})"
    else:
        # Medium fallback for ambiguous but not highly verified safe sites
        confidence = "medium"
        reasoning = "ambiguous / low positive legitimacy indicators without active threat flags"

    logger.info(
        "[CONFIDENCE] Evaluation rationale: %s | legitimacy_score=%d | is_malicious=%s",
        reasoning,
        legitimacy_score,
        is_confirmed_malicious,
    )

    logger.info("[SCAN] Complete — score=%.1f level=%s signals=%d confidence=%s", score, level, len(signals), confidence)

    return IntelligenceResult(
        trust_score=score,
        risk_level=level,
        signals=signals,
        recommendation=recommendation,
        confidence=confidence,
        domain_info=domain_info,
        reputation=reputation,
        ssl_info=ssl_summary,
    )