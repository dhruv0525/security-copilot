from typing import Literal

from pydantic import BaseModel, HttpUrl

from app.services.intelligence.models import ScoreSignal

RiskLevel = Literal[
    "safe",
    "low",
    "medium",
    "high",
    "critical",
]

RiskCategory = Literal[
    "phishing",
    "dark_pattern",
    "suspicious_keywords",
    "url_reputation",
    "malware",
    "unknown",
]


class DetectedIssue(BaseModel):
    category: RiskCategory
    severity: RiskLevel
    title: str
    description: str
    evidence: str | None = None


class ComponentScores(BaseModel):
    phishing: float
    dark_patterns: float
    url_reputation: float
    keyword_risk: float


class TrustScoreSchema(BaseModel):
    score: float
    level: RiskLevel
    dominant_category: RiskCategory | None
    issues: list[DetectedIssue]
    explanation: str
    component_scores: ComponentScores | None = None

    # Explainable Intelligence Signals
    signals: list[ScoreSignal] = []

    # Human-readable recommendation
    recommendation: str = ""

    # Confidence layer
    confidence: str = "medium"


class ScanRequest(BaseModel):
    # URL-first architecture
    url: HttpUrl

    # Optional DOM enrichment
    page_text: str | None = None
    page_title: str | None = None

    # Lightweight metadata
    external_link_count: int | None = 0
    form_count: int | None = 0


class ScanResponse(BaseModel):
    id: str
    url: str
    domain: str
    scanned_at: str

    trust_score: TrustScoreSchema

    cached: bool
    analysis_duration_ms: int

    # Domain intelligence enrichment
    domain_info: dict | None = None

    # Reputation provider enrichment
    reputation: dict | None = None

    # SSL/TLS certificate intelligence
    ssl_info: dict | None = None



class ScanListItem(BaseModel):
    id: str
    url: str
    domain: str
    scanned_at: str
    score: float
    level: RiskLevel
    dominant_category: RiskCategory | None


class PaginatedScans(BaseModel):
    items: list[ScanListItem]
    total: int
    page: int
    page_size: int
    has_next: bool


class ErrorResponse(BaseModel):
    error: str
    detail: str | None = None
    request_id: str | None = None