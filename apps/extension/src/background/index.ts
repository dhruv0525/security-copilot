import { MESSAGE_TYPES, POPUP_CACHE_TTL_MS, STORAGE_KEYS } from "../shared/constants";
import type { ScanRequest, ScanResult } from "@security-copilot/shared-types";
import { callScanApi } from "./api";
import type { ApiScanResponse } from "./api";
import { storage } from "../shared/storage";

interface CacheEntry {

  result: ScanResult;
  cachedAt: number;
}

// In-memory cache (survives within the service worker lifetime)
const scanCache = new Map<string, CacheEntry>();

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  // Must return true to use sendResponse asynchronously
  handleMessage(message).then(sendResponse).catch((err) => {
    console.error("[SecurityCopilot BG] Error handling message:", err);
    sendResponse({ error: String(err) });
  });
  return true;
});

async function handleMessage(message: { type: string; payload?: unknown }): Promise<unknown> {
  switch (message.type) {
    case MESSAGE_TYPES.SCAN_URL: {
      const payload = message.payload as ScanRequest;
      return getScanResult(payload);
    }
    case MESSAGE_TYPES.GET_CACHED_RESULT: {
      const { url } = message.payload as { url: string };
      const cached = getCached(url);
      if (cached) return { result: cached };
      return { result: null };
    }
    case MESSAGE_TYPES.CLEAR_CACHE: {
      scanCache.clear();
      return { cleared: true };
    }
    default:
      return { error: "unknown_message_type" };
  }
}

async function getScanResult(request: ScanRequest): Promise<ApiScanResponse> {
  const cacheKey = request.url;
  const cached = getCached(cacheKey);
  if (cached) return { result: cached };

  let token = await storage.get<string>(STORAGE_KEYS.authToken);
  if (!token) {
    // TEMPORARY MVP AUTH BYPASS
    // TODO: restore secure extension JWT authentication flow
    console.warn("[SecurityCopilot BG] No auth token found, using temporary MVP bypass dummy token");
    token = "MVP_TEST_DUMMY_TOKEN"; 
  }

  console.log(`[SecurityCopilot BG] Calling API for URL: ${request.url}`);
  const response = await callScanApi(request, token);
  if (response.result) {
    console.log(`[SecurityCopilot BG] Scan successful for URL: ${request.url}`);
    scanCache.set(cacheKey, { result: response.result, cachedAt: Date.now() });
    // Update extension badge
    updateBadge(response.result);
  } else {
    console.warn(`[SecurityCopilot BG] Scan failed for URL: ${request.url}`, response.error);
  }
  return response;
}

function getCached(url: string): ScanResult | null {
  const entry = scanCache.get(url);
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > POPUP_CACHE_TTL_MS) {
    scanCache.delete(url);
    return null;
  }
  return entry.result;
}

function updateBadge(result: ScanResult): void {
  const BADGE_COLORS: Record<string, string> = {
    safe: "#22c55e",
    low: "#84cc16",
    medium: "#f59e0b",
    high: "#f97316",
    critical: "#ef4444",
  };

  const level = result.trust_score.level;
  chrome.action.setBadgeText({ text: String(Math.round(result.trust_score.score)) });
  chrome.action.setBadgeBackgroundColor({ color: BADGE_COLORS[level] ?? "#888" });
}
