import type { AuthResponse, LoginRequest, SignupRequest } from "@security-copilot/shared-types";
import { apiClient } from "./client";

export const authApi = {
  login: async (payload: LoginRequest): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>("/auth/login", payload);
    return data;
  },

  signup: async (payload: SignupRequest): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>("/auth/signup", payload);
    return data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post("/auth/logout");
  },
};
