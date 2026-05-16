import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/lib/api/analytics";

export const ANALYTICS_KEYS = {
  summary: ["analytics", "summary"] as const,
};

export function useAnalytics() {
  return useQuery({
    queryKey: ANALYTICS_KEYS.summary,
    queryFn: analyticsApi.getSummary,
    staleTime: 5 * 60 * 1000, // analytics can be 5 minutes stale
  });
}
