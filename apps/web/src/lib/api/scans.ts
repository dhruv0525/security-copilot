import type { PaginatedScans, ScanResult } from "@security-copilot/shared-types";
import { apiClient } from "./client";

interface ListScansParams {
  page?: number;
  page_size?: number;
}

export const scansApi = {
  list: async (params: ListScansParams = {}): Promise<PaginatedScans> => {
    const { data } = await apiClient.get<PaginatedScans>("/scans", { params });
    return data;
  },

  getById: async (id: string): Promise<ScanResult> => {
    const { data } = await apiClient.get<ScanResult>(`/scans/${id}`);
    return data;
  },
};
