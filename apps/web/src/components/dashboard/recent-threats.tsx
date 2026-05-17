"use client";

import { useQuery } from "@tanstack/react-query";
import { scansApi } from "@/lib/api/scans";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { RiskBadge, ConfidenceBadge } from "@/components/dashboard/risk-badge";

function timeAgo(timestampStr: string): string {
  const ts = parseInt(timestampStr, 10);
  if (isNaN(ts)) return "recently";
  const diff = Date.now() - (ts * 1000);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function RecentThreats() {
  const { data: scansData, isLoading } = useQuery({
    queryKey: ["scans", "list", 50],
    queryFn: () => scansApi.list({ page_size: 50 }),
    refetchInterval: 10000,
  });

  const threats = (scansData?.items || []).filter(
    (s) => s.level === "critical" || s.level === "high"
  ).slice(0, 7); // Show top 7 recent threats

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Recent Threats
        </p>
        <Link
          href="/scans"
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          View all <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      <div className="divide-y divide-border">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-4 animate-pulse">
              <div className="h-7 w-7 bg-muted rounded shrink-0" />
              <div className="flex-1 space-y-1.5 min-w-0">
                <div className="h-3 w-28 bg-muted rounded" />
                <div className="h-2.5 w-16 bg-muted rounded" />
              </div>
              <div className="h-4 w-12 bg-muted rounded shrink-0" />
              <div className="h-4 w-12 bg-muted rounded shrink-0" />
            </div>
          ))
        ) : threats.length === 0 ? (
          <div className="px-4 py-8 text-center text-xs text-muted-foreground">
            No active threat alerts identified in recent scans.
          </div>
        ) : (
          threats.map((scan) => {
            const confLevel = scan.score >= 80 ? "high" : scan.score >= 50 ? "medium" : "low";
            return (
              <Link
                key={scan.id}
                href={`/scans/${scan.id}` as any}
                className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-accent/50 group"
              >
                {/* Favicon placeholder */}
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-secondary text-[10px] font-bold uppercase text-muted-foreground">
                  {scan.domain[0]}
                </div>

                {/* Domain */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-foreground group-hover:text-primary transition-colors">
                    {scan.domain}
                  </p>
                  {scan.dominant_category && (
                    <p className="text-[10px] uppercase font-semibold text-risk-critical shrink-0 tracking-wider">
                      {scan.dominant_category.replace(/_/g, " ")}
                    </p>
                  )}
                </div>

                {/* Badges */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <RiskBadge level={scan.level} />
                  <ConfidenceBadge level={confLevel} value={scan.score} />
                </div>

                {/* Source */}
                <div className="hidden w-36 shrink-0 lg:block">
                  <p className="truncate text-[11px] text-muted-foreground">Trust Engine Scan</p>
                </div>

                {/* Time */}
                <p className="w-16 shrink-0 text-right text-[11px] text-muted-foreground">
                  {timeAgo(scan.scanned_at)}
                </p>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
