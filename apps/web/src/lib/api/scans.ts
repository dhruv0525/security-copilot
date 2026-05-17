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

  create: async (payload: { url: string; page_text?: string; page_title?: string }): Promise<ScanResult> => {
    const { data } = await apiClient.post<ScanResult>("/scans", payload);
    return data;
  },
};
