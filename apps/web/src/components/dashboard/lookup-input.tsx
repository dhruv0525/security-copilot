"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { scansApi } from "@/lib/api/scans";
import { Search, Loader2, AlertCircle } from "lucide-react";

export function LookupInput() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { mutate, isPending } = useMutation({
    mutationFn: async (domain: string) => {
      let url = domain.trim();
      if (!/^https?:\/\//i.test(url)) {
        url = `https://${url}`;
      }
      return scansApi.create({ url });
    },
    onSuccess: (data) => {
      setQuery("");
      setError(null);
      // Invalidate dashboard totals, trends, and threat alerts
      queryClient.invalidateQueries({ queryKey: ["scans"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      // Redirect directly to the generated threat intelligence detail report
      router.push(`/scans/${data.id}`);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || "Threat scan failed. Ensure the domain is valid.";
      setError(msg);
      // Automatically clear error after 4 seconds
      setTimeout(() => setError(null), 4000);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() || isPending) return;
    mutate(query);
  }

  return (
    <div className="relative flex flex-col items-end gap-1.5 z-40">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative w-60 sm:w-72 md:w-80">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isPending}
            placeholder="Scan domain (e.g. google.com)..."
            className="w-full rounded-lg border border-border bg-card/65 pl-9 pr-4 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary disabled:opacity-50 transition-all shadow-inner"
          />
        </div>
        <button
          type="submit"
          disabled={isPending || !query.trim()}
          className="flex items-center justify-center rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/95 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] transition-all shadow shadow-primary/10 shrink-0"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
              Scanning...
            </>
          ) : (
            "Scan Now"
          )}
        </button>
      </form>

      {/* Floating Error Alert */}
      {error && (
        <div className="absolute top-10 right-0 flex items-center gap-1.5 rounded-md border border-risk-critical/20 bg-risk-critical/15 px-3 py-1.5 text-[11px] text-risk-critical shadow-lg animate-none whitespace-nowrap">
          <AlertCircle className="h-3.5 w-3.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
