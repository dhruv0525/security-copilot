// ─────────────────────────────────────────────
// Auth contracts
// Mirrored by: services/api/app/schemas/auth.py
// ─────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  expires_in: number; // seconds
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}
