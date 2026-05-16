import { API_V1 } from "../shared/constants";
import type { ScanRequest, ScanResult } from "@security-copilot/shared-types";

export interface ApiScanResponse {
  result?: ScanResult;
  error?: string;
}

export async function callScanApi(
  request: ScanRequest,
  token: string
): Promise<ApiScanResponse> {
  try {
    const response = await fetch(`${API_V1}/scans`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    // TEMPORARY MVP AUTH BYPASS
    // TODO: restore secure extension JWT authentication flow
    // if (response.status === 401) {
    //   return { error: "unauthenticated" };
    // }

    if (!response.ok) {
      console.error(`[SecurityCopilot BG] Scan API error: ${response.status}`);
      return { error: `API Error: ${response.status}` };
    }

    const result = await response.json() as ScanResult;
    return { result };
  } catch (err) {
    console.error("[SecurityCopilot BG] Network error calling scan API:", err);
    return { error: "network_error" };
  }
}
