import React from "react";
import type { DetectedIssue, RiskLevel } from "@security-copilot/shared-types";

const SEVERITY_DOT: Record<RiskLevel, string> = {
  safe:     "#22c55e",
  low:      "#84cc16",
  medium:   "#f59e0b",
  high:     "#f97316",
  critical: "#ef4444",
};

interface Props {
  issues: DetectedIssue[];
}

export function IssueList({ issues }: Props) {
  if (issues.length === 0) {
    return (
      <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "12px" }}>
        No issues detected.
      </p>
    );
  }

  return (
    <ul style={{ listStyle: "none", marginBottom: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
      {issues.map((issue, i) => (
        <li
          key={i}
          style={{
            display: "flex",
            gap: "8px",
            alignItems: "flex-start",
            padding: "8px",
            borderRadius: "6px",
            background: "#f9fafb",
            border: "1px solid #f3f4f6",
          }}
        >
          <span
            style={{
              marginTop: "3px",
              flexShrink: 0,
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: SEVERITY_DOT[issue.severity],
            }}
          />
          <div>
            <p style={{ fontWeight: 600, fontSize: "12px", color: "#111827" }}>{issue.title}</p>
            <p style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>
              {issue.description}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
