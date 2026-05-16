import React, { useEffect, useState } from "react";
import type { ScanResult } from "@security-copilot/shared-types";
import { MESSAGE_TYPES } from "../shared/constants";
import { RiskSummary } from "./components/RiskSummary";
import { IssueList } from "./components/IssueList";
import { ActionButtons } from "./components/ActionButtons";

type PopupState = "loading" | "result" | "unauthenticated" | "error";

export function Popup() {
  const [state, setState] = useState<PopupState>("loading");
  const [result, setResult] = useState<ScanResult | null>(null);

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (!tab?.url) {
        setState("error");
        return;
      }

      chrome.runtime.sendMessage(
        { type: MESSAGE_TYPES.GET_CACHED_RESULT, payload: { url: tab.url } },
        (response: ScanResult | null) => {
          if (chrome.runtime.lastError || !response) {
            setState("unauthenticated");
            return;
          }
          setResult(response);
          setState("result");
        }
      );
    });
  }, []);

  return (
    <div style={{ padding: "16px", minWidth: "340px" }}>
      <header style={{ marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontWeight: 700, fontSize: "15px" }}>🛡 Security Copilot</span>
      </header>

      {state === "loading" && <p style={{ color: "#888" }}>Analyzing page…</p>}

      {state === "unauthenticated" && (
        <p style={{ color: "#f97316" }}>
          Sign in to the dashboard to enable real-time scanning.
        </p>
      )}

      {state === "error" && (
        <p style={{ color: "#ef4444" }}>Unable to analyze this page.</p>
      )}

      {state === "result" && result && (
        <>
          <RiskSummary result={result} />
          <IssueList issues={result.trust_score.issues} />
          <ActionButtons />
        </>
      )}
    </div>
  );
}
