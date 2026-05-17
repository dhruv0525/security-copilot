import type { AnalyticsSummary } from "@security-copilot/shared-types";
import { apiClient } from "./client";

export const analyticsApi = {
  getSummary: async (): Promise<AnalyticsSummary> => {
    const { data } = await apiClient.get<AnalyticsSummary>("/analytics/summary");
    return data;
  },
  getTrends: async (): Promise<any[]> => {
    const { data } = await apiClient.get<any[]>("/analytics/trends");
    return data;
  },
};
