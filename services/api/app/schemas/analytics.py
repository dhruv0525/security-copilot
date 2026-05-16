from pydantic import BaseModel


class TrendDataPoint(BaseModel):
    date: str
    scan_count: int
    average_score: float
    flagged_count: int


class CategoryBreakdown(BaseModel):
    category: str
    count: int
    percentage: float


class TopFlaggedDomain(BaseModel):
    domain: str
    scan_count: int
    average_score: float
    highest_level: str


class AnalyticsSummary(BaseModel):
    total_scans: int
    flagged_scans: int
    average_trust_score: float
    scans_by_risk_level: dict[str, int]
    top_flagged_domains: list[TopFlaggedDomain]
    category_breakdown: list[CategoryBreakdown]
    trend: list[TrendDataPoint]
