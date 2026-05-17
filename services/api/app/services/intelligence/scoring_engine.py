from .models import ScoreSignal, RiskLevel

def calculate_trust_score(signals: list[ScoreSignal]) -> tuple[float, RiskLevel, str]:
    """
    Starts with a base score of 100 and deducts points based on signals.
    """
    base_score = 100.0
    total_penalty = 0.0
    
    for signal in signals:
        total_penalty += signal.weight
        
    final_score = max(0.0, base_score - total_penalty)
    
    level: RiskLevel = "safe"
    if final_score < 40:
        level = "critical"
    elif final_score < 60:
        level = "high"
    elif final_score < 80:
        level = "medium"
    elif final_score < 90:
        level = "low"
        
    recommendation = "Safe to browse."
    if level in ["critical", "high"]:
        recommendation = "Avoid entering credentials or sensitive information."
    elif level == "medium":
        recommendation = "Exercise caution. Do not enter passwords unless you are sure of the site's identity."
    elif level == "low":
        recommendation = "Low risk detected, but standard browsing precautions apply."
        
    return final_score, level, recommendation
