import { cn } from "@/lib/utils";
import type { RiskLevel, ConfidenceLevel } from "@/lib/mock-data";

const riskConfig: Record<
  RiskLevel,
  { label: string; className: string }
> = {
  critical: {
    label: "Critical",
    className: "bg-risk-critical/15 text-risk-critical border-risk-critical/30",
  },
  high: {
    label: "High",
    className: "bg-risk-high/15 text-risk-high border-risk-high/30",
  },
  medium: {
    label: "Medium",
    className: "bg-risk-medium/15 text-risk-medium border-risk-medium/30",
  },
  low: {
    label: "Low",
    className: "bg-risk-low/15 text-risk-low border-risk-low/30",
  },
  safe: {
    label: "Safe",
    className: "bg-risk-safe/15 text-risk-safe border-risk-safe/30",
  },
};

const confidenceConfig: Record<
  ConfidenceLevel,
  { className: string }
> = {
  high: { className: "bg-primary/10 text-primary border-primary/20" },
  medium: { className: "bg-risk-medium/10 text-risk-medium border-risk-medium/20" },
  low: { className: "bg-muted text-muted-foreground border-border" },
};

interface RiskBadgeProps {
  level: RiskLevel;
  size?: "sm" | "md" | "lg";
}

export function RiskBadge({ level, size = "sm" }: RiskBadgeProps) {
  const { label, className } = riskConfig[level];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border font-medium",
        size === "sm" && "px-1.5 py-0.5 text-[11px]",
        size === "md" && "px-2 py-1 text-xs",
        size === "lg" && "px-3 py-1.5 text-sm",
        className
      )}
    >
      {label}
    </span>
  );
}

interface ConfidenceBadgeProps {
  level: ConfidenceLevel;
  value?: number;
  size?: "sm" | "md";
}

export function ConfidenceBadge({ level, value, size = "sm" }: ConfidenceBadgeProps) {
  const { className } = confidenceConfig[level];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border font-medium",
        size === "sm" && "px-1.5 py-0.5 text-[11px]",
        size === "md" && "px-2 py-1 text-xs",
        className
      )}
    >
      {value !== undefined ? `${value}%` : level}
    </span>
  );
}

interface TrustScorePillProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

export function TrustScorePill({ score, size = "sm" }: TrustScorePillProps) {
  const level: RiskLevel =
    score >= 80 ? "safe" : score >= 60 ? "low" : score >= 40 ? "medium" : score >= 20 ? "high" : "critical";
  const { className } = riskConfig[level];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border font-mono font-semibold",
        size === "sm" && "px-1.5 py-0.5 text-[11px]",
        size === "md" && "px-2 py-1 text-xs",
        size === "lg" && "px-3 py-1.5 text-sm",
        className
      )}
    >
      {score}
    </span>
  );
}
