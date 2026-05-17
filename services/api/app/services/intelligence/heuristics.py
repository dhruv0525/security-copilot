from .models import ScoreSignal
from .url_parser import ParsedUrl

def analyze_url_heuristics(parsed: ParsedUrl) -> list[ScoreSignal]:
    signals = []
    
    if parsed.is_ip:
        signals.append(
            ScoreSignal(
                name="ip_domain",
                weight=30,
                severity="high",
                reason="URL uses an IP address instead of a domain name, common in phishing."
            )
        )
    
    if len(parsed.domain) > 50:
        signals.append(
            ScoreSignal(
                name="suspiciously_long_domain",
                weight=15,
                severity="medium",
                reason=f"Domain name is unusually long ({len(parsed.domain)} characters)."
            )
        )
        
    suspicious_keywords = ["login", "verify", "update", "secure", "account", "banking", "auth"]
    found_keywords = [kw for kw in suspicious_keywords if kw in parsed.domain.lower() or kw in parsed.path.lower()]
    
    if found_keywords:
        signals.append(
            ScoreSignal(
                name="deceptive_keywords",
                weight=20,
                severity="high",
                reason=f"URL contains suspicious keywords: {', '.join(found_keywords)}."
            )
        )
        
    if parsed.domain.count("-") > 3:
        signals.append(
            ScoreSignal(
                name="excessive_hyphens",
                weight=10,
                severity="medium",
                reason="Domain contains an excessive number of hyphens."
            )
        )
        
    return signals
