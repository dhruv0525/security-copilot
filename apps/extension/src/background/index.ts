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
  handleMessage(message).then(sendResponse).catch((err) => {
    console.error("[SecurityCopilot BG] Error handling message:", err);
    sendResponse({ error: String(err) });
  });
  return true; // keep channel open for async sendResponse
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
      return { result: cached ?? null };
    }
    case MESSAGE_TYPES.CLEAR_CACHE: {
      scanCache.clear();
      return { cleared: true };
    }
    case "SYNC_AUTH_TOKEN": {
      const { token } = message.payload as { token: string };
      if (token) {
        const cleanToken = token.trim();
        await storage.set(STORAGE_KEYS.authToken, cleanToken);
        console.log(`[SecurityCopilot BG] Successfully synced token from dashboard (length: ${cleanToken.length})`);
        return { synced: true };
      }
      return { synced: false, error: "Empty token" };
    }
    default:
      return { error: "unknown_message_type" };
  }
}

async function getScanResult(request: ScanRequest): Promise<ApiScanResponse> {
  const cacheKey = request.url;
  const cached = getCached(cacheKey);
  if (cached) return { result: cached };

  const rawToken = await storage.get<string>(STORAGE_KEYS.authToken);
  console.log("[SecurityCopilot BG] TOKEN LOADED FROM STORAGE:", rawToken ? `Exists, length=${rawToken.length}` : "null/undefined");

  if (!rawToken) {
    console.warn("[SecurityCopilot BG] No auth token in storage — user must sign in");
    return { error: "unauthenticated" };
  }

  const token = rawToken.trim();
  console.log(`[SecurityCopilot BG] Scanning: ${request.url}`);
  const response = await callScanApi(request, token);

  if (response.result) {
    scanCache.set(cacheKey, { result: response.result, cachedAt: Date.now() });
    updateBadge(response.result);
  } else {
    console.warn(`[SecurityCopilot BG] Scan failed: ${response.error}`);
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
