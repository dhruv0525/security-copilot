"""
AI explainer — generates a human-readable trust score explanation
using OpenAI structured output.

Takes the analysis result and produces a 1–2 sentence plain-English
explanation suitable for display in the extension popup and dashboard.

Implemented in Phase 6.
"""
from __future__ import annotations
from app.services.analysis.engine import AnalysisResult


async def generate_explanation(result: AnalysisResult, url: str) -> str:
    """Returns a plain-English explanation of the trust score."""
    raise NotImplementedError
