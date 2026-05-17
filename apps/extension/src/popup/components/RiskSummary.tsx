import React from "react";
import type { ScanResult, RiskLevel, ScoreSignal } from "@security-copilot/shared-types";

// ── Color palette per risk level ────────────────────────────────────────────
const LEVEL_PALETTE: Record<RiskLevel, { bg: string; border: string; text: string; badge: string }> = {
  safe:     { bg: "#f0fdf4", border: "#bbf7d0", text: "#15803d", badge: "#dcfce7" },
  low:      { bg: "#f7fee7", border: "#d9f99d", text: "#4d7c0f", badge: "#ecfccb" },
  medium:   { bg: "#fefce8", border: "#fde68a", text: "#a16207", badge: "#fef9c3" },
  high:     { bg: "#fff7ed", border: "#fed7aa", text: "#c2410c", badge: "#ffedd5" },
  critical: { bg: "#fff1f2", border: "#fecdd3", text: "#be123c", badge: "#fee2e2" },
};

const LEVEL_LABEL: Record<RiskLevel, string> = {
  safe:     "🟢 Safe",
  low:      "🟡 Low Risk",
  medium:   "🟠 Medium Risk",
  high:     "🔴 High Risk",
  critical: "🚨 Critical Risk",
};

const SEVERITY_COLOR: Record<string, string> = {
  critical: "#be123c",
  high:     "#c2410c",
  medium:   "#a16207",
  low:      "#4d7c0f",
};

interface Props {
  result: ScanResult;
}

// ── Sub-components ───────────────────────────────────────────────────────────

function ConfidenceBadge({ confidence }: { confidence?: string }) {
  if (!confidence) return null;
  const colors: Record<string, { bg: string; text: string }> = {
    high:   { bg: "#dbeafe", text: "#1d4ed8" },
    medium: { bg: "#fef3c7", text: "#92400e" },
    low:    { bg: "#f3f4f6", text: "#6b7280" },
  };
  const c = colors[confidence] ?? colors.low;
  return (
    <span style={{
      fontSize: "10px",
      fontWeight: 600,
      padding: "2px 8px",
      borderRadius: "999px",
      backgroundColor: c.bg,
      color: c.text,
      letterSpacing: "0.03em",
      textTransform: "uppercase" as const,
    }}>
      {confidence} confidence
    </span>
  );
}

function PhishingWarningBanner() {
  return (
    <div style={{
      backgroundColor: "#fff1f2",
      border: "1px solid #fecdd3",
      borderRadius: "6px",
      padding: "8px 10px",
      marginBottom: "10px",
      display: "flex",
      alignItems: "flex-start",
      gap: "8px",
    }}>
      <span style={{ fontSize: "16px", flexShrink: 0 }}>⚠️</span>
      <div>
        <p style={{ fontSize: "12px", fontWeight: 700, color: "#be123c", marginBottom: "2px" }}>
          Phishing Warning
        </p>
        <p style={{ fontSize: "11px", color: "#9f1239", lineHeight: 1.4 }}>
          This page has been flagged as a phishing site. Do not enter any passwords or personal information.
        </p>
      </div>
    </div>
  );
}

function SignalList({ signals }: { signals: ScoreSignal[] }) {
  if (!signals || signals.length === 0) return null;
  return (
    <div style={{ marginTop: "8px" }}>
      <p style={{ fontSize: "11px", fontWeight: 700, color: "#374151", marginBottom: "4px", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>
        Detected Signals
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {signals.map((signal, idx) => (
          <div key={idx} style={{
            display: "flex",
            gap: "8px",
            alignItems: "flex-start",
            padding: "6px 8px",
            borderRadius: "6px",
            backgroundColor: "#f9fafb",
            border: "1px solid #f3f4f6",
          }}>
            <span style={{
              marginTop: "3px",
              flexShrink: 0,
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              backgroundColor: SEVERITY_COLOR[signal.severity] ?? "#9ca3af",
            }} />
            <p style={{ fontSize: "11px", color: "#374151", lineHeight: 1.4 }}>
              {signal.reason}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function DomainMetaRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value == null) return null;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", padding: "3px 0", borderBottom: "1px solid #f3f4f6" }}>
      <span style={{ color: "#6b7280" }}>{label}</span>
      <span style={{ color: "#111827", fontWeight: 500 }}>{value}</span>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export function RiskSummary({ result }: Props) {
  const { level, recommendation, signals, confidence } = result.trust_score;
  const palette = LEVEL_PALETTE[level];
  const domainInfo = result.domain_info;
  const reputation = result.reputation;
  const sslInfo = result.ssl_info;

  const isPhishing = signals?.some(s =>
    s.name === "google_flagged_phishing" || s.name === "google_flagged_malware"
  );
  const isCritical = level === "critical" || level === "high";

  return (
    <div style={{ fontFamily: "system-ui, sans-serif" }}>
      {/* Risk Level Header */}
      <div style={{
        backgroundColor: palette.bg,
        border: `1px solid ${palette.border}`,
        borderRadius: "8px",
        padding: "12px",
        marginBottom: "8px",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
          <span style={{ fontWeight: 700, fontSize: "15px", color: palette.text }}>
            {LEVEL_LABEL[level]}
          </span>
          <ConfidenceBadge confidence={confidence} />
        </div>

        {recommendation && (
          <p style={{ fontSize: "12px", color: palette.text, lineHeight: 1.5, fontWeight: 500 }}>
            {recommendation}
          </p>
        )}
      </div>
      
      {/* AI Explanation Banner */}
      {result.ai_explanation && (
        <div style={{
          backgroundColor: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          padding: "10px",
          marginBottom: "8px",
        }}>
          <p style={{ fontSize: "9px", fontWeight: 700, color: "#475569", marginBottom: "3px", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: "4px" }}>
            🤖 AI-Powered Summary
          </p>
          <p style={{ fontSize: "11px", color: "#334155", lineHeight: 1.4, margin: 0 }}>
            {result.ai_explanation}
          </p>
        </div>
      )}

      {/* Phishing Warning Banner */}
      {isPhishing && isCritical && <PhishingWarningBanner />}

      {/* Reputation Source */}
      {reputation && (
        <div style={{
          fontSize: "11px",
          color: reputation.malicious ? "#be123c" : "#6b7280",
          backgroundColor: reputation.malicious ? "#fff1f2" : "#f9fafb",
          border: `1px solid ${reputation.malicious ? "#fecdd3" : "#f3f4f6"}`,
          borderRadius: "6px",
          padding: "6px 8px",
          marginBottom: "8px",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}>
          <span>{reputation.malicious ? "🚫" : "🔍"}</span>
          <span>
            <strong>{reputation.source}</strong>:{" "}
            {reputation.malicious
              ? `Flagged — ${reputation.categories?.join(", ") ?? "threat detected"}`
              : "No threats detected"}
          </span>
        </div>
      )}

      {/* Detected Signals */}
      {signals && signals.length > 0 && <SignalList signals={signals} />}

      {/* Domain Intelligence */}
      {domainInfo && (domainInfo.days_old != null || domainInfo.registrar) && (
        <div style={{
          marginTop: "10px",
          padding: "8px",
          backgroundColor: "#f9fafb",
          borderRadius: "6px",
          border: "1px solid #f3f4f6",
        }}>
          <p style={{ fontSize: "11px", fontWeight: 700, color: "#374151", marginBottom: "4px", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>
            Domain Info
          </p>
          <DomainMetaRow label="Age" value={domainInfo.days_old != null ? `${domainInfo.days_old} days old` : null} />
          <DomainMetaRow label="Registrar" value={domainInfo.registrar} />
          <DomainMetaRow label="Country" value={domainInfo.country} />
        </div>
      )}

      {/* SSL Info */}
      {sslInfo && (sslInfo.expired || sslInfo.self_signed || sslInfo.issuer) && (
        <div style={{
          marginTop: "8px",
          padding: "8px",
          backgroundColor: sslInfo.expired || sslInfo.self_signed ? "#fff7ed" : "#f9fafb",
          borderRadius: "6px",
          border: `1px solid ${sslInfo.expired || sslInfo.self_signed ? "#fed7aa" : "#f3f4f6"}`,
        }}>
          <p style={{ fontSize: "11px", fontWeight: 700, color: "#374151", marginBottom: "4px", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>
            SSL Certificate
          </p>
          {sslInfo.expired && (
            <p style={{ fontSize: "11px", color: "#c2410c", fontWeight: 600 }}>⚠ Certificate expired</p>
          )}
          {sslInfo.self_signed && (
            <p style={{ fontSize: "11px", color: "#c2410c", fontWeight: 600 }}>⚠ Self-signed certificate</p>
          )}
          <DomainMetaRow label="Issuer" value={sslInfo.issuer} />
          <DomainMetaRow label="Valid for" value={sslInfo.validity_days != null ? `${sslInfo.validity_days} days` : null} />
        </div>
      )}
    </div>
  );
}
