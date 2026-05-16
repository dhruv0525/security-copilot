import { MESSAGE_TYPES, POPUP_CACHE_TTL_MS, STORAGE_KEYS } from "../shared/constants";
import type { ScanRequest, ScanResult } from "@security-copilot/shared-types";
import { callScanApi } from "./api";
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
      return getCached(url);
    }
    case MESSAGE_TYPES.CLEAR_CACHE: {
      scanCache.clear();
      return { cleared: true };
    }
    default:
      return { error: "unknown_message_type" };
  }
}

async function getScanResult(request: ScanRequest): Promise<ScanResult | null> {
  const cacheKey = request.url;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const token = await storage.get<string>(STORAGE_KEYS.authToken);
  if (!token) {
    console.warn("[SecurityCopilot BG] No auth token, skipping scan");
    return null;
  }

  const result = await callScanApi(request, token);
  if (result) {
    scanCache.set(cacheKey, { result, cachedAt: Date.now() });
    // Update extension badge
    updateBadge(result);
  }
  return result;
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
