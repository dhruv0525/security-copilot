"""
Suspicious keyword scanner.

Scans visible page text for high-risk keyword clusters:
- Credential harvesting ("Enter your SSN", "Verify your account")
- Financial fraud signals ("Wire transfer", "Gift card payment")
- Malware distribution ("Download now", "Your PC is infected")
- Lottery / advance-fee fraud language

Implemented in Phase 3.
"""
from __future__ import annotations
from app.services.analysis.engine import AnalysisInput


async def analyze_keywords(input_data: AnalysisInput) -> float:
    """Returns a risk score 0–100. Higher = more suspicious keywords detected."""
    raise NotImplementedError
