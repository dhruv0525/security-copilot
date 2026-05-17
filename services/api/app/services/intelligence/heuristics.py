"""
URL heuristics — rule-based signals derived from the parsed URL.

Covers:
  • IP-based domain
  • Excessively long domain
  • Deceptive keywords in domain/path
  • Excessive hyphens
  • Suspicious TLDs
  • Excessive subdomain depth
  • High URL entropy (randomness)
"""
import math
import re

from .models import ScoreSignal
from .url_parser import ParsedUrl

# TLDs historically over-represented in phishing and free-hosting abuse
SUSPICIOUS_TLDS = {"tk", "ml", "ga", "cf", "gq", "xyz", "top", "click", "live", "monster"}

# Keywords that appear frequently in phishing domains / paths
DECEPTIVE_KEYWORDS = [
    "login", "signin", "sign-in", "verify", "verification",
    "update", "secure", "account", "banking", "auth", "authenticate",
    "password", "credential", "payment", "paypal", "amazon",
]


def _shannon_entropy(s: str) -> float:
    """Shannon entropy of a string — high values suggest random/machine-generated names."""
    if not s:
        return 0.0
    freq = {}
    for ch in s:
        freq[ch] = freq.get(ch, 0) + 1
    length = len(s)
    return -sum((c / length) * math.log2(c / length) for c in freq.values())


def analyze_url_heuristics(parsed: ParsedUrl) -> list[ScoreSignal]:
    signals: list[ScoreSignal] = []

    # 1. IP address used as domain
    if parsed.is_ip:
        signals.append(ScoreSignal(
            name="ip_domain",
            weight=30,
            severity="high",
            reason="URL uses a raw IP address instead of a domain name — common in phishing.",
        ))

    # 2. Unusually long domain
    if len(parsed.domain) > 50:
        signals.append(ScoreSignal(
            name="suspiciously_long_domain",
            weight=15,
            severity="medium",
            reason=f"Domain name is unusually long ({len(parsed.domain)} chars).",
        ))

    # 3. Deceptive keywords
    combined = (parsed.domain + parsed.path).lower()
    found = [kw for kw in DECEPTIVE_KEYWORDS if kw in combined]
    if found:
        signals.append(ScoreSignal(
            name="deceptive_keywords",
            weight=20,
            severity="high",
            reason=f"URL contains deceptive keywords: {', '.join(found)}.",
        ))

    # 4. Excessive hyphens in domain
    if parsed.domain.count("-") > 3:
        signals.append(ScoreSignal(
            name="excessive_hyphens",
            weight=10,
            severity="medium",
            reason="Domain contains an excessive number of hyphens.",
        ))

    # 5. Suspicious TLD
    if parsed.tld and parsed.tld.lower() in SUSPICIOUS_TLDS:
        signals.append(ScoreSignal(
            name="suspicious_tld",
            weight=18,
            severity="medium",
            reason=f"Domain uses TLD '.{parsed.tld}' which is commonly abused for phishing and spam.",
        ))

    # 6. Excessive subdomain depth (e.g. a.b.c.evil.com)
    parts = parsed.domain.split(".")
    if len(parts) > 4:
        signals.append(ScoreSignal(
            name="excessive_subdomain_depth",
            weight=12,
            severity="medium",
            reason=f"Domain has {len(parts) - 2} subdomain levels, which may indicate subdomain abuse.",
        ))

    # 7. High entropy label (machine-generated random subdomain)
    # Check the leftmost label only (e.g. "xk3j9m" in xk3j9m.example.com)
    if len(parts) >= 3:
        leftmost = parts[0]
        if len(leftmost) >= 8 and _shannon_entropy(leftmost) > 3.5:
            signals.append(ScoreSignal(
                name="random_subdomain",
                weight=12,
                severity="medium",
                reason=f"Subdomain '{leftmost}' appears machine-generated (high randomness).",
            ))

    return signals
