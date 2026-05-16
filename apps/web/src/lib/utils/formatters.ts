import type { RiskLevel } from "@security-copilot/shared-types";

export function formatScore(score: number): string {
  return Math.round(score).toString();
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  safe: "Safe",
  low: "Low risk",
  medium: "Medium risk",
  high: "High risk",
  critical: "Critical",
};

export const RISK_LEVEL_COLORS: Record<RiskLevel, string> = {
  safe: "text-risk-safe bg-risk-safe/10",
  low: "text-risk-low bg-risk-low/10",
  medium: "text-risk-medium bg-risk-medium/10",
  high: "text-risk-high bg-risk-high/10",
  critical: "text-risk-critical bg-risk-critical/10",
};

export const RISK_LEVEL_DOT: Record<RiskLevel, string> = {
  safe: "bg-risk-safe",
  low: "bg-risk-low",
  medium: "bg-risk-medium",
  high: "bg-risk-high",
  critical: "bg-risk-critical",
};
