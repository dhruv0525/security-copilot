"""
Phishing heuristics analyzer.

Checks:
- Suspicious TLDs (.xyz, .tk, .top, etc.)
- IP address as hostname
- Excessive subdomains
- URL length anomalies
- Login-form on HTTP
- Homoglyph characters in domain

Implemented in Phase 3.
"""
from __future__ import annotations
from app.services.analysis.engine import AnalysisInput


async def analyze_phishing(input_data: AnalysisInput) -> float:
    """Returns a risk score 0–100. Higher = more phishing risk."""
    raise NotImplementedError
