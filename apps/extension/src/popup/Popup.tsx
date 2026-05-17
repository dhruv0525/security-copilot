import React, { useEffect, useState } from "react";
import type { ScanResult, ScanRequest } from "@security-copilot/shared-types";
import { MESSAGE_TYPES } from "../shared/constants";
import { RiskSummary } from "./components/RiskSummary";
import { IssueList } from "./components/IssueList";
import { ActionButtons } from "./components/ActionButtons";

type PopupState = "idle" | "loading" | "result" | "unauthenticated" | "error";

export function Popup() {
  const [state, setState] = useState<PopupState>("loading");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("Unable to analyze this page.");

  useEffect(() => {
    // Check if we have a cached result for the current tab
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (!tab?.url) {
        setState("idle");
        return;
      }

      chrome.runtime.sendMessage(
        { type: MESSAGE_TYPES.GET_CACHED_RESULT, payload: { url: tab.url } },
        (response: any) => {
          if (chrome.runtime.lastError || !response || !response.result) {
            setState("idle");
            return;
          }
          console.log("[SecurityCopilot Popup] Loaded cached result");
          setResult(response.result);
          setState("result");
        }
      );
    });
  }, []);

  const handleAnalyzeClick = async () => {
    setState("loading");
    setErrorMessage("Unable to analyze this page."); // Reset default

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id || !tab?.url) {
        console.error("[SecurityCopilot Popup] No active tab found");
        setErrorMessage("Cannot analyze this tab.");
        setState("error");
        return;
      }

      console.log(`[SecurityCopilot Popup] Sending EXTRACT_PAGE_DATA to tab ${tab.id}`);
      // Tell content script to extract data
      chrome.tabs.sendMessage(
        tab.id,
        { type: MESSAGE_TYPES.EXTRACT_PAGE_DATA },
        (response: any) => {
          if (chrome.runtime.lastError) {
            console.error("[SecurityCopilot Popup] Content script unavailable:", chrome.runtime.lastError);
            setErrorMessage("Content script unavailable on this tab.");
            setState("error");
            return;
          }
          
          if (!response || !response.success || !response.data) {
            console.error("[SecurityCopilot Popup] Extraction error:", response?.error);
            setErrorMessage("This page blocks content extraction.");
            setState("error");
            return;
          }

          console.log("[SecurityCopilot Popup] Extraction successful, sending to background script");
          const pageData = response.data;
          const scanRequest: ScanRequest = {
            url: tab.url!,
            page_text: pageData.text,
            page_title: pageData.title,
            external_link_count: pageData.externalLinkCount,
            form_count: pageData.formCount,
          };

          // Send to background to hit API
          chrome.runtime.sendMessage(
            {
              type: MESSAGE_TYPES.SCAN_URL,
              payload: scanRequest,
            },
            (apiResponse: any) => {
              if (chrome.runtime.lastError) {
                console.error("[SecurityCopilot Popup] Background script unavailable:", chrome.runtime.lastError);
                setErrorMessage("Unable to contact extension background script.");
                setState("error");
                return;
              }

              if (!apiResponse) {
                console.error("[SecurityCopilot Popup] Empty response from background script");
                setErrorMessage("Unable to contact analysis server.");
                setState("error");
                return;
              }

              if (apiResponse.error === "unauthenticated") {
                setState("unauthenticated");
                return;
              }

              if (apiResponse.error || !apiResponse.result) {
                console.error("[SecurityCopilot Popup] Scan API error:", apiResponse.error);
                setErrorMessage("Unable to contact analysis server.");
                setState("error");
                return;
              }

              console.log("[SecurityCopilot Popup] Scan successful");
              setResult(apiResponse.result);
              setState("result");
            }
          );
        }
      );
    } catch (err) {
      console.error("[SecurityCopilot Popup] Unexpected error:", err);
      setErrorMessage("An unexpected error occurred.");
      setState("error");
    }
  };

  return (
    <div style={{ padding: "16px", minWidth: "340px" }}>
      <header style={{ marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontWeight: 700, fontSize: "15px" }}>🛡 Security Copilot</span>
      </header>

      {state === "idle" && (
        <div style={{ textAlign: "center", padding: "16px 0" }}>
          <p style={{ marginBottom: "16px", color: "#555" }}>
            Ready to analyze the current website for security risks.
          </p>
          <button
            onClick={handleAnalyzeClick}
            style={{
              padding: "10px 16px",
              backgroundColor: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: 600,
              width: "100%",
            }}
          >
            Analyze Current Site
          </button>
        </div>
      )}

      {state === "loading" && (
        <div style={{ textAlign: "center", padding: "16px 0" }}>
          <p style={{ color: "#888" }}>Analyzing page…</p>
        </div>
      )}

      {state === "unauthenticated" && (
        <div style={{ textAlign: "center", padding: "16px 0" }}>
          <p style={{ color: "#f97316", marginBottom: "12px", fontWeight: 600, fontSize: "14px" }}>
            Authentication Required
          </p>
          <p style={{ color: "#6b7280", fontSize: "12px", lineHeight: "1.5", marginBottom: "16px" }}>
            Please sign in to the dashboard or paste your API Access Token from the dashboard settings into the extension Settings page.
          </p>
          <button
            onClick={() => chrome.runtime.openOptionsPage()}
            style={{
              padding: "10px 16px",
              backgroundColor: "#111827",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: 600,
              width: "100%",
            }}
          >
            Open Settings
          </button>
        </div>
      )}

      {state === "error" && (
        <p style={{ color: "#ef4444" }}>{errorMessage}</p>
      )}

      {state === "result" && result && (
        <>
          <RiskSummary result={result} />
          <IssueList issues={result.trust_score.issues} />
          <ActionButtons scanId={result.id} />
        </>
      )}
    </div>
  );
}
