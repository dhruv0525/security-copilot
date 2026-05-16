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
  safe:     "Safe",
  low:      "Low Risk",
  medium:   "Medium Risk",
  high:     "High Risk",
  critical: "Critical",
};

interface Props {
  result: ScanResult;
}

export function RiskSummary({ result }: Props) {
  const { score, level, explanation } = result.trust_score;
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontWeight: 700, fontSize: "28px", color: colors.text }}>
          {Math.round(score)}
        </span>
        <span
          style={{
            fontWeight: 600,
            fontSize: "13px",
            color: colors.text,
            background: "rgba(0,0,0,0.08)",
            borderRadius: "999px",
            padding: "2px 10px",
          }}
        >
          {LEVEL_LABELS[level]}
        </span>
      </div>
      <p style={{ fontSize: "12px", color: colors.text, marginTop: "6px", lineHeight: 1.4 }}>
        {explanation}
      </p>
    </div>
  );
}
