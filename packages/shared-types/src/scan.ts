// ─────────────────────────────────────────────
// Scan request / response contracts
// Mirrored by: services/api/app/schemas/scan.py
// ─────────────────────────────────────────────

import type { TrustScore } from "./trust";

export interface ScanRequest {
  url: string;
  /** Raw visible text extracted from the page DOM */
  page_text: string;
  /** Page <title> tag content */
  page_title?: string;
  /** Number of external links on the page */
  external_link_count?: number;
  /** Number of forms detected */
  form_count?: number;
}

export interface ScanResult {
  id: string;
  url: string;
  domain: string;
  scanned_at: string; // ISO 8601
  trust_score: TrustScore;
  /** True if result was served from cache */
  cached: boolean;
  /** Milliseconds the analysis took */
  analysis_duration_ms: number;
  domain_info?: {
    registrar?: string | null;
    days_old?: number | null;
    country?: string | null;
  };
  reputation?: {
    source: string;
    malicious: boolean;
    categories?: string[];
  };
}

export interface ScanListItem {
  id: string;
  url: string;
  domain: string;
  scanned_at: string;
  score: number;
  level: TrustScore["level"];
  dominant_category: TrustScore["dominant_category"];
}

export interface PaginatedScans {
  items: ScanListItem[];
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
}
