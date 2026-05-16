export const API_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://api.yourdomain.com"
    : "http://localhost:8000";

export const API_V1 = `${API_BASE_URL}/api/v1`;

/** Risk score thresholds matching backend RiskLevel enum */
export const RISK_THRESHOLDS = {
  safe: 80,
  low: 60,
  medium: 40,
  high: 20,
} as const;

/** Redis-equivalent: don't re-scan the same URL within this window */
export const POPUP_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

export const STORAGE_KEYS = {
  authToken: "auth_token",
  cachedScans: "cached_scans",
  userPreferences: "user_preferences",
} as const;

/** Message types for chrome.runtime messaging between contexts */
export const MESSAGE_TYPES = {
  SCAN_URL: "SCAN_URL",
  SCAN_RESULT: "SCAN_RESULT",
  GET_CACHED_RESULT: "GET_CACHED_RESULT",
  CLEAR_CACHE: "CLEAR_CACHE",
} as const;
