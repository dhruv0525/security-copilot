import hashlib
import logging
from typing import Any, List, Optional
from app.services.cache.redis_client import CacheService

logger = logging.getLogger(__name__)

# User-friendly mapping for security intelligence signals
SIGNAL_MAPPINGS = {
    # 1. URL Heuristics
    "ip_domain": "the website uses a raw IP address instead of a standard domain name",
    "suspiciously_long_domain": "the domain name length is unusually long, suggesting brand spoofing",
    "deceptive_keywords": "the URL structure contains deceptive keywords attempting to mimic trusted brands",
    "excessive_hyphens": "the domain contains excessive hyphens, commonly used to obfuscate phishing links",
    "suspicious_tld": "the domain uses a top-level domain frequently associated with spam or abuse campaigns",
    "excessive_subdomain_depth": "the URL subdomain structure is unusually deep",
    "random_subdomain": "the subdomain structure contains highly randomized characters",
    
    # 2. DNS/Network Signals
    "domain_resolution_failed": "the domain failed to resolve under standard DNS lookup checks",
    
    # 3. WHOIS/Domain Signals
    "young_domain": "the domain was registered very recently, indicating a potential transient threat campaign",
    "whois_unavailable": "domain registration information could not be verified through WHOIS services",
    
    # 4. SSL/TLS Signals
    "ssl_unavailable": "connection security information could not be retrieved",
    "expired_certificate": "the SSL/TLS certificate for this domain has expired, meaning connection encryption is compromised",
    "self_signed_certificate": "the SSL/TLS certificate is self-signed, which prevents authentication by trusted root certificate authorities",
    
    # 5. Reputation & DOM
    "google_flagged_phishing": "Google Safe Browsing actively flagged this URL as a phishing threat",
    "google_flagged_malware": "Google Safe Browsing actively flagged this URL for distributing malware",
    "missing_reputation_history": "the domain lacks an established reputation or registration history",
    "high_form_count": "the page contains multiple input forms, which is highly characteristic of credential harvesting traps",
    "high_external_link_count": "the page contains an unusually high number of external redirects or links",
}

async def generate_ai_explanation(
    url: str,
    trust_score: float,
    risk_level: str,
    confidence: str,
    signals: List[Any],
    reputation: Optional[dict],
    ssl_info: Optional[dict],
    domain_info: Optional[dict],
    recommendation: str,
    cache: Optional[CacheService] = None,
) -> Optional[str]:
    """
    Synthesizes a highly professional, human-readable, deterministic security explanation 
    directly from active intelligence findings. Completely replaces the OpenAI API inference 
    with a fully rule-based model, ensuring zero latencies, zero LLM billing costs, and no hallucinations.
    """
    try:
        # 1. Generate unique cache key based on URL, trust score, and active signals
        signal_names = sorted([
            getattr(s, "name", str(s.get("name") if isinstance(s, dict) else s)) 
            for s in signals
        ])
        signals_str = ",".join(signal_names)
        raw_key = f"{url}:{trust_score}:{signals_str}"
        hashed_key = hashlib.md5(raw_key.encode("utf-8")).hexdigest()
        cache_key = f"ai_explainer:{hashed_key}"
    except Exception as e:
        logger.warning("[AI EXPL] Failed to generate cache key: %s", e)
        cache_key = None

    # 2. Redis Caching (highly efficient, works fully locally without external APIs)
    if cache and cache_key:
        cached_val = await cache.get(cache_key)
        if cached_val:
            logger.info("[AI EXPL] [CACHE HIT] Found cached explanation for URL: %s", url)
            return cached_val

    logger.info("[AI EXPL] [SYNTHESIS START] Synthesizing rule-based explanation for: %s", url)

    try:
        # 3. Compile list of user-friendly core threat findings
        findings: List[str] = []

        # Check Active Threat Signals
        for s in signals:
            name = getattr(s, "name", s.get("name") if isinstance(s, dict) else str(s))
            if name in SIGNAL_MAPPINGS:
                findings.append(SIGNAL_MAPPINGS[name])

        # Check reputation payload details if not caught by signal names
        if reputation and reputation.get("malicious"):
            source = reputation.get("source", "threat intelligence feeds")
            cats = reputation.get("categories", [])
            cat_str = f" ({', '.join(cats)})" if cats else ""
            findings.append(f"the domain is flagged as malicious on {source}{cat_str}")

        # Check SSL details if not captured by signals
        if ssl_info:
            if ssl_info.get("expired"):
                findings.append("the SSL/TLS certificate is expired")
            elif ssl_info.get("self_signed"):
                findings.append("the SSL/TLS certificate is self-signed and untrusted")

        # Check WHOIS young domain if not captured by signals
        if domain_info:
            days_old = domain_info.get("days_old")
            if days_old is not None and days_old < 30:
                findings.append(f"the domain registration is extremely young ({days_old} days old)")

        # Remove duplicate findings safely
        unique_findings = []
        for f in findings:
            if f not in unique_findings:
                unique_findings.append(f)

        # 4. Compose deterministic explanation text based on security posture
        explanation = ""

        # Posture A: SAFE / LOW RISK
        if risk_level in ["safe", "low"]:
            if risk_level == "safe":
                explanation = f"This website is evaluated as safe with an excellent trust score of {trust_score:.0f}/100."
            else:
                explanation = f"This website has a low security risk and appears safe for general browsing, with a trust score of {trust_score:.0f}/100."
            
            # Highlight positive integrity indicators
            integrity_points = []
            if ssl_info and not ssl_info.get("expired") and not ssl_info.get("self_signed"):
                integrity_points.append("SSL/TLS integrity is fully verified")
            if domain_info and domain_info.get("days_old", 0) > 365:
                integrity_points.append("the domain registration history is fully established")
            if reputation and not reputation.get("malicious"):
                integrity_points.append("standard reputation checks are clean")

            if integrity_points:
                explanation += f" Specifically, {', '.join(integrity_points)}."
            else:
                explanation += " Specifically, reputation checks are clean and no suspicious heuristic patterns were detected."

        # Posture B: MODERATE RISK
        elif risk_level == "medium":
            explanation = f"This website displays moderate risk indicators, with a trust score of {trust_score:.0f}/100. Users should proceed with caution."
            if unique_findings:
                # Join findings with natural transitions
                if len(unique_findings) == 1:
                    explanation += f" Specifically, {unique_findings[0]}."
                else:
                    explanation += f" Specifically, {', and '.join([', '.join(unique_findings[:-1]), unique_findings[-1]])}."
            else:
                explanation += " Some security indicators could not be fully verified, or no established reputation history exists for this site."

        # Posture C: HIGH / CRITICAL RISK
        else:
            explanation = f"This website has been flagged as high risk with a low trust score of {trust_score:.0f}/100, indicating severe security concerns."
            if unique_findings:
                if len(unique_findings) == 1:
                    explanation += f" Specifically, {unique_findings[0]}."
                else:
                    explanation += f" Specifically, {', and '.join([', '.join(unique_findings[:-1]), unique_findings[-1]])}."
            else:
                explanation += " Multiple malicious indicators or active threats have been identified on this page."

        # 5. Append action-oriented guidance
        if recommendation:
            explanation += f" {recommendation}"

        logger.info("[AI EXPL] [SYNTHESIS SUCCESS] Synthesized explanation: '%s'", explanation)

        # 6. Save successfully generated value in cache
        if cache and cache_key and explanation:
            await cache.set(cache_key, explanation, ttl_seconds=86400)

        return explanation

    except Exception as exc:
        logger.error("[AI EXPL] [SYNTHESIS FAILURE] Explanation synthesis failed: %s", exc, exc_info=True)
        # 7. Safe fallback to deterministic recommendation text
        return recommendation
