"""
Manipulative UX / dark pattern analyzer.

Detects language patterns associated with:
- Urgency manipulation ("Limited time!", "Only 2 left!")
- Scarcity fabrication
- Hidden subscription language
- Misdirection ("No thanks, I don't want to save money")
- Confirm-shaming

Implemented in Phase 3.
"""
from __future__ import annotations
from app.services.analysis.engine import AnalysisInput


async def analyze_dark_patterns(input_data: AnalysisInput) -> float:
    """Returns a risk score 0–100. Higher = more manipulative patterns detected."""
    raise NotImplementedError
