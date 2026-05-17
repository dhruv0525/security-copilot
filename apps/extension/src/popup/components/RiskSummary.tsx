import React from "react";
import type { ScanResult, RiskLevel } from "@security-copilot/shared-types";

const LEVEL_COLORS: Record<RiskLevel, { bg: string; text: string }> = {
  safe:     { bg: "#dcfce7", text: "#15803d" },
  low:      { bg: "#ecfccb", text: "#4d7c0f" },
  medium:   { bg: "#fef9c3", text: "#a16207" },
  high:     { bg: "#ffedd5", text: "#c2410c" },
  critical: { bg: "#fee2e2", text: "#b91c1c" },
};

const LEVEL_LABELS: Record<RiskLevel, string> = {
  safe:     "🟢 Safe",
  low:      "🟡 Low Risk",
  medium:   "🟠 Medium Risk",
  high:     "🔴 High Risk",
  critical: "🚨 Critical",
};

interface Props {
  result: ScanResult;
}

export function RiskSummary({ result }: Props) {
  const { level, explanation, recommendation, signals } = result.trust_score;
  const colors = LEVEL_COLORS[level];

  return (
    <div
      style={{
        borderRadius: "8px",
        padding: "12px",
        backgroundColor: colors.bg,
        marginBottom: "12px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", marginBottom: "8px" }}>
        <span
          style={{
            fontWeight: 700,
            fontSize: "16px",
            color: colors.text,
          }}
        >
          {LEVEL_LABELS[level]}
        </span>
      </div>
      
      <p style={{ fontSize: "13px", color: colors.text, marginBottom: "8px", lineHeight: 1.4, fontWeight: 500 }}>
        {recommendation || explanation}
      </p>

      {signals && signals.length > 0 && (
        <div style={{ marginTop: "8px" }}>
          <span style={{ fontSize: "12px", fontWeight: 600, color: colors.text }}>Reasons:</span>
          <ul style={{ margin: "4px 0 0 0", paddingLeft: "20px", fontSize: "12px", color: colors.text }}>
            {signals.map((signal, idx) => (
              <li key={idx} style={{ marginBottom: "4px" }}>
                {signal.reason}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
