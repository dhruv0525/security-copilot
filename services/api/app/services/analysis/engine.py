"""
Analysis engine — orchestrates all analyzers in parallel.

Each analyzer returns a partial result. The engine collects them
and passes the unified payload to the trust scorer.

Implemented fully in Phase 3.
"""
from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class AnalysisInput:
    url: str
    page_text: str
    page_title: str | None = None
    external_link_count: int = 0
    form_count: int = 0


@dataclass
class AnalysisResult:
    """Raw output from all analyzers before trust scoring."""
    phishing_score: float = 0.0
    dark_pattern_score: float = 0.0
    url_reputation_score: float = 0.0
    keyword_risk_score: float = 0.0
    detected_issues: list[dict] = field(default_factory=list)


async def run_analysis(input_data: AnalysisInput) -> AnalysisResult:
    """
    Runs all analyzers concurrently via asyncio.gather.
    (Basic mock implementation for Phase 2)
    """
    return AnalysisResult(
        phishing_score=10.0,
        dark_pattern_score=0.0,
        url_reputation_score=90.0,
        keyword_risk_score=5.0,
        detected_issues=[],
    )
