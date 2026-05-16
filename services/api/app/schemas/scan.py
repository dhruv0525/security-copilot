from typing import Literal

from pydantic import BaseModel, HttpUrl

RiskLevel = Literal["safe", "low", "medium", "high", "critical"]
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
    component_scores: ComponentScores


class ScanRequest(BaseModel):
    url: HttpUrl
    page_text: str
    page_title: str | None = None
    external_link_count: int | None = None
    form_count: int | None = None


class ScanResponse(BaseModel):
    id: str
    url: str
    domain: str
    scanned_at: str
    trust_score: TrustScoreSchema
    cached: bool
    analysis_duration_ms: int


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
