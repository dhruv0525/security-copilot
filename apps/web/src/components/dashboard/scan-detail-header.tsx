import Link from "next/link";
import { ArrowLeft, ExternalLink, Clock } from "lucide-react";
import type { ScanDetail } from "@/lib/mock-data";
import { RiskBadge, ConfidenceBadge } from "./risk-badge";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ScanDetailHeader({ scan }: { scan: ScanDetail }) {
  const riskColorMap = {
    critical: "text-risk-critical",
    high: "text-risk-high",
    medium: "text-risk-medium",
    low: "text-risk-low",
    safe: "text-risk-safe",
  };

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <Link
        href="/scans"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Scan History
      </Link>

      {/* Main header */}
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            {/* Domain */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary text-sm font-bold uppercase text-muted-foreground">
                {scan.domain[0]}
              </div>
              <h1 className={`text-xl font-semibold tracking-tight ${riskColorMap[scan.riskLevel]}`}>
                {scan.domain}
              </h1>
              <a
                href={scan.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>

            {/* Badges row */}
            <div className="flex items-center gap-2 flex-wrap">
              <RiskBadge level={scan.riskLevel} size="md" />
              <ConfidenceBadge level={scan.confidenceLevel} value={scan.confidence} size="md" />
              {scan.threatCategory && (
                <span className="inline-flex items-center rounded border border-border bg-secondary px-2 py-1 text-xs font-medium text-muted-foreground">
                  {scan.threatCategory}
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formatDate(scan.scannedAt)}
              </span>
            </div>
          </div>

          {/* Trust Score */}
          <div className="flex flex-col items-center rounded-lg border border-border bg-secondary/50 px-6 py-4 text-center shrink-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
              Trust Score
            </p>
            <p className={`text-4xl font-bold tabular-nums ${riskColorMap[scan.riskLevel]}`}>
              {scan.trustScore}
            </p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">/ 100</p>
          </div>
        </div>
      </div>
    </div>
  );
}
