import { API_V1 } from "../shared/constants";
import type { ScanRequest, ScanResult } from "@security-copilot/shared-types";

export async function callScanApi(
  request: ScanRequest,
  token: string
): Promise<ScanResult | null> {
  try {
    const response = await fetch(`${API_V1}/scans`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      console.error(`[SecurityCopilot] Scan API error: ${response.status}`);
      return null;
    }

    return response.json() as Promise<ScanResult>;
  } catch (err) {
    console.error("[SecurityCopilot] Network error calling scan API:", err);
    return null;
  }
}
