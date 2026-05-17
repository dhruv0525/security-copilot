// ─────────────────────────────────────────────
// Trust scoring domain types
// Mirrored by: services/api/app/schemas/scan.py
// ─────────────────────────────────────────────

export type RiskLevel = "safe" | "low" | "medium" | "high" | "critical";

export type RiskCategory =
  | "phishing"
  | "dark_pattern"
  | "suspicious_keywords"
  | "url_reputation"
  | "malware"
  | "unknown";

export interface DetectedIssue {
  category: RiskCategory;
  severity: RiskLevel;
  title: string;
  description: string;
  /** Evidence snippet from the scanned content, if applicable */
  evidence?: string;
}

export interface ScoreSignal {
  name: string;
  weight: number;
  severity: RiskLevel;
  reason: string;
}

export interface TrustScore {
  /** 0–100. Higher = more trustworthy. */
  score: number;
  level: RiskLevel;
  /** Primary category driving the risk rating */
  dominant_category: RiskCategory | null;
  issues: DetectedIssue[];
  /** Human-readable AI-generated explanation */
  explanation: string;
  /** Sub-scores per analyzer, 0–100 each */
  component_scores?: {
    phishing: number;
    dark_patterns: number;
    url_reputation: number;
    keyword_risk: number;
  };
  signals?: ScoreSignal[];
  recommendation?: string;
  /** Confidence classification: "high" | "medium" | "low" */
  confidence?: string;
}
