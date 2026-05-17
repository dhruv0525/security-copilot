"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, Eye, EyeOff, Loader2 } from "lucide-react";
import { authApi } from "@/lib/api/auth";
import { useAuthStore } from "@/store/authStore";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const setUser = useAuthStore((state) => state.setUser);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await authApi.signup({ email, password });
      
      // Save JWT token in cookie for Axios interceptors & Chrome extension compatibility
      document.cookie = `access_token=${response.tokens.access_token}; path=/; max-age=${response.tokens.expires_in}; SameSite=Lax`;
      
      // Set user in zustand store
      setUser(response.user);
      
      // Navigate to overview dashboard
      router.push("/");
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Email already registered or registration failed. Try again.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8 overflow-hidden select-none">
      {/* Decorative blurred background nodes */}
      <div className="absolute top-1/4 left-1/4 h-[300px] w-[300px] rounded-full bg-primary/10 blur-[80px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 h-[350px] w-[350px] rounded-full bg-risk-critical/5 blur-[100px] animate-pulse delay-700" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Header */}
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 border border-primary/20 shadow-inner">
            <Shield className="h-6 w-6 text-primary animate-none" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Create Account
          </h1>
          <p className="text-xs text-muted-foreground">
            Get started with Security Copilot browser intelligence
          </p>
        </div>

        {/* Card Panel */}
        <div className="rounded-2xl border border-border/60 bg-card/45 backdrop-blur-md p-6 shadow-xl shadow-black/10">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg border border-risk-critical/20 bg-risk-critical/10 p-3 text-xs text-risk-critical animate-none">
                {error}
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-semibold text-foreground/80">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-lg border border-border/80 bg-secondary/60 px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-semibold text-foreground/80">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-border/80 bg-secondary/60 pl-3.5 pr-10 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="text-xs font-semibold text-foreground/80">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-border/80 bg-secondary/60 px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="relative flex w-full items-center justify-center rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground shadow-md shadow-primary/10 hover:bg-primary/95 focus:outline-none focus:ring-2 focus:ring-primary/20 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Registering...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline transition-all">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
