import { useQuery } from "@tanstack/react-query";
import { scansApi } from "@/lib/api/scans";

export const SCAN_KEYS = {
  all: ["scans"] as const,
  list: (page: number, pageSize: number) => ["scans", "list", page, pageSize] as const,
  detail: (id: string) => ["scans", "detail", id] as const,
};

export function useScans(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: SCAN_KEYS.list(page, pageSize),
    queryFn: () => scansApi.list({ page, page_size: pageSize }),
  });
}

export function useScan(id: string) {
  return useQuery({
    queryKey: SCAN_KEYS.detail(id),
    queryFn: () => scansApi.getById(id),
    enabled: Boolean(id),
  });
}
