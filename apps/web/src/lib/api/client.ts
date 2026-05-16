import axios, { type AxiosInstance } from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: `${API_BASE_URL}/api/v1`,
    headers: { "Content-Type": "application/json" },
    timeout: 15_000,
  });

  // Attach JWT from cookie on every request
  client.interceptors.request.use((config) => {
    if (typeof document !== "undefined") {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("access_token="))
        ?.split("=")?.[1];

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  });

  // Redirect to login on 401
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401 && typeof window !== "undefined") {
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }
  );

  return client;
}

export const apiClient = createApiClient();
