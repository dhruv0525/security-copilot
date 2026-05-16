// ────────────────────────────────────────────────
// Analytics contracts
// Mirrored by: services/api/app/schemas/analytics.py
// ────────────────────────────────────────────────

import type { RiskLevel, RiskCategory } from "./trust";

export interface TrendDataPoint {
  date: string; // ISO 8601 date (YYYY-MM-DD)
  scan_count: number;
  average_score: number;
  flagged_count: number;
}

export interface CategoryBreakdown {
  category: RiskCategory;
  count: number;
  percentage: number;
}

export interface TopFlaggedDomain {
  domain: string;
  scan_count: number;
  average_score: number;
  highest_level: RiskLevel;
}

export interface AnalyticsSummary {
  total_scans: number;
  flagged_scans: number;
  average_trust_score: number;
  scans_by_risk_level: Record<RiskLevel, number>;
  top_flagged_domains: TopFlaggedDomain[];
  category_breakdown: CategoryBreakdown[];
  /** 30-day daily trend */
  trend: TrendDataPoint[];
}
