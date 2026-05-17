"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { scansApi } from "@/lib/api/scans";
import Link from "next/link";
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { RiskBadge, ConfidenceBadge, TrustScorePill } from "./risk-badge";
import type { RiskLevel, ConfidenceLevel } from "@/lib/mock-data";

const ROWS_PER_PAGE = 8;

const riskOptions: Array<{ value: RiskLevel | "all"; label: string }> = [
  { value: "all", label: "All Risks" },
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
  { value: "safe", label: "Safe" },
];

const confidenceOptions: Array<{ value: ConfidenceLevel | "all"; label: string }> = [
  { value: "all", label: "All Confidence" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

function formatDate(timestampStr: string) {
  const ts = parseInt(timestampStr, 10);
  if (isNaN(ts)) return "N/A";
  return new Date(ts * 1000).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ScanHistoryTable() {
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<RiskLevel | "all">("all");
  const [confidenceFilter, setConfidenceFilter] = useState<ConfidenceLevel | "all">("all");
  const [page, setPage] = useState(1);

  const { data: scansData, isLoading } = useQuery({
    queryKey: ["scans", "list", 100],
    queryFn: () => scansApi.list({ page_size: 100 }),
    refetchInterval: 10000,
  });

  const mappedHistory = useMemo(() => {
    const items = scansData?.items || [];
    return items.map((s) => {
      const confLevel = s.score >= 80 ? "high" : s.score >= 50 ? "medium" : "low";
      return {
        id: s.id,
        domain: s.domain,
        url: s.url,
        trustScore: s.score,
        riskLevel: s.level as RiskLevel,
        confidence: Math.round(s.score),
        confidenceLevel: confLevel as ConfidenceLevel,
        detectionSource: "Trust Engine Scan",
        scannedAt: s.scanned_at,
        threatCategory: s.dominant_category ? s.dominant_category.replace(/_/g, " ") : undefined,
      };
    });
  }, [scansData]);

  const filtered = useMemo(() => {
    return mappedHistory.filter((scan) => {
      const matchesSearch =
        !search || scan.domain.toLowerCase().includes(search.toLowerCase());
      const matchesRisk = riskFilter === "all" || scan.riskLevel === riskFilter;
      const matchesConf =
        confidenceFilter === "all" || scan.confidenceLevel === confidenceFilter;
      return matchesSearch && matchesRisk && matchesConf;
    });
  }, [mappedHistory, search, riskFilter, confidenceFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const paged = filtered.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  function handleSearch(val: string) {
    setSearch(val);
    setPage(1);
  }

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search domains..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full rounded-md border border-border bg-secondary pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <select
          value={riskFilter}
          onChange={(e) => { setRiskFilter(e.target.value as RiskLevel | "all"); setPage(1); }}
          className="rounded-md border border-border bg-secondary px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring animate-none"
        >
          {riskOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          value={confidenceFilter}
          onChange={(e) => { setConfidenceFilter(e.target.value as ConfidenceLevel | "all"); setPage(1); }}
          className="rounded-md border border-border bg-secondary px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {confidenceOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <span className="text-xs text-muted-foreground ml-auto">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Domain</th>
              <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Score</th>
              <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Risk</th>
              <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Confidence</th>
              <th className="hidden px-3 py-2.5 text-left font-medium text-muted-foreground md:table-cell">
                Source
              </th>
              <th className="hidden px-3 py-2.5 text-left font-medium text-muted-foreground lg:table-cell">
                Category
              </th>
              <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Scanned</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              [...Array( ROWS_PER_PAGE )].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-4 py-3"><div className="h-4 w-32 bg-muted rounded" /></td>
                  <td className="px-3 py-3"><div className="h-4 w-8 bg-muted rounded" /></td>
                  <td className="px-3 py-3"><div className="h-4 w-12 bg-muted rounded" /></td>
                  <td className="px-3 py-3"><div className="h-4 w-14 bg-muted rounded" /></td>
                  <td className="hidden px-3 py-3 md:table-cell"><div className="h-4 w-20 bg-muted rounded" /></td>
                  <td className="hidden px-3 py-3 lg:table-cell"><div className="h-4 w-16 bg-muted rounded" /></td>
                  <td className="px-4 py-3 text-right"><div className="h-4 w-16 bg-muted rounded" /></td>
                </tr>
              ))
            ) : paged.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                  No scans match your filters.
                </td>
              </tr>
            ) : (
              paged.map((scan) => (
                <tr
                  key={scan.id}
                  className="group transition-colors hover:bg-accent/40"
                >
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/scans/${scan.id}` as any}
                      className="flex items-center gap-2.5"
                    >
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-secondary text-[10px] font-bold uppercase text-muted-foreground">
                        {scan.domain[0]}
                      </div>
                      <span className="font-medium text-foreground group-hover:text-primary transition-colors truncate max-w-[180px]">
                        {scan.domain}
                      </span>
                    </Link>
                  </td>
                  <td className="px-3 py-2.5">
                    <TrustScorePill score={scan.trustScore} />
                  </td>
                  <td className="px-3 py-2.5">
                    <RiskBadge level={scan.riskLevel} />
                  </td>
                  <td className="px-3 py-2.5">
                    <ConfidenceBadge level={scan.confidenceLevel} value={scan.confidence} />
                  </td>
                  <td className="hidden px-3 py-2.5 text-muted-foreground md:table-cell">
                    {scan.detectionSource}
                  </td>
                  <td className="hidden px-3 py-2.5 text-muted-foreground lg:table-cell">
                    {scan.threatCategory ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground whitespace-nowrap">
                    {formatDate(scan.scannedAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Page {page} of {totalPages}
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage(1)}
            disabled={page === 1}
            className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40 transition-colors"
          >
            <ChevronsLeft className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40 transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40 transition-colors"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages}
            className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40 transition-colors"
          >
            <ChevronsRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
