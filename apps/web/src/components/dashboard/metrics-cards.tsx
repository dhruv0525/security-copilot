"use client";

import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/lib/api/analytics";
import {
  ScanLine,
  ShieldAlert,
  ShieldCheck,
  AlertOctagon,
  Activity,
  Lock,
} from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  sub?: string;
  accent?: "default" | "danger" | "warning" | "success" | "blue";
}

const accentMap = {
  default: "text-muted-foreground",
  danger: "text-risk-critical",
  warning: "text-risk-medium",
  success: "text-risk-safe",
  blue: "text-primary",
};

function MetricCard({ label, value, icon, sub, accent = "default" }: MetricCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className={accentMap[accent]}>{icon}</span>
      </div>
      <div>
        <p className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">
          {value}
        </p>
        {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

export function MetricsCards() {
  const { data, isLoading } = useQuery({
    queryKey: ["analytics", "summary"],
    queryFn: () => analyticsApi.getSummary(),
    refetchInterval: 10000, // Refresh every 10 seconds for real-time security tracking
  });

  const m = data as any;

  if (isLoading || !m) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-24 rounded-lg border border-border bg-card animate-pulse flex flex-col justify-between p-4">
            <div className="flex items-center justify-between">
              <div className="h-3 w-16 bg-muted rounded" />
              <div className="h-4 w-4 bg-muted rounded-full" />
            </div>
            <div className="h-6 w-12 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  const threatPct = m.totalScans > 0 ? ((m.threatsDetected / m.totalScans) * 100).toFixed(1) : "0.0";
  const safePct = m.totalScans > 0 ? ((m.safeSites / m.totalScans) * 100).toFixed(1) : "0.0";

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      <MetricCard
        label="Total Scans"
        value={m.totalScans.toLocaleString()}
        icon={<ScanLine className="h-4 w-4" />}
        sub="All time"
        accent="default"
      />
      <MetricCard
        label="Threats Detected"
        value={m.threatsDetected.toLocaleString()}
        icon={<ShieldAlert className="h-4 w-4" />}
        sub={`${threatPct}% of scans`}
        accent="danger"
      />
      <MetricCard
        label="Safe Sites"
        value={m.safeSites.toLocaleString()}
        icon={<ShieldCheck className="h-4 w-4" />}
        sub={`${safePct}% of scans`}
        accent="success"
      />
      <MetricCard
        label="High Risk Domains"
        value={m.highRiskDomains.toLocaleString()}
        icon={<AlertOctagon className="h-4 w-4" />}
        sub="Critical + High"
        accent="danger"
      />
      <MetricCard
        label="Avg Confidence"
        value={`${m.avgConfidence}%`}
        icon={<Activity className="h-4 w-4" />}
        sub="Trust Engine"
        accent="blue"
      />
      <MetricCard
        label="SSL Issues"
        value={m.sslIssues.toLocaleString()}
        icon={<Lock className="h-4 w-4" />}
        sub="Expired / Self-signed"
        accent="warning"
      />
    </div>
  );
}
