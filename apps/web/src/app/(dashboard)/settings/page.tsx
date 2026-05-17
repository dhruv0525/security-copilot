"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { useAuthStore } from "@/store/authStore";
import { Key, Copy, Check, ShieldCheck, Mail, Calendar } from "lucide-react";

export default function SettingsPage() {
  const user = useAuthStore((state) => state.user);
  const [token, setToken] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof document !== "undefined") {
      const activeToken = document.cookie
        .split("; ")
        .find((row) => row.startsWith("access_token="))
        ?.split("=")?.[1];
      if (activeToken) {
        setToken(activeToken);
      }
    }
  }, []);

  function copyToken() {
    if (!token) return;
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const joinDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Recently";

  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage your account profile and browser extension API access."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Profile Card */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-sm font-semibold tracking-tight text-foreground mb-4">
            User Profile
          </h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email Address</p>
                <p className="text-xs font-semibold text-foreground">{user?.email || "seccopilot@example.com"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Account Created</p>
                <p className="text-xs font-semibold text-foreground">{joinDate}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Extension Token Card */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-1.5">
                <ShieldCheck className="h-4.5 w-4.5 text-primary" />
                Browser Extension Authorization
              </h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Authorize the Chrome Extension to run scans from your browser.
              </p>
            </div>
          </div>

          <div className="space-y-3.5">
            <div className="rounded-lg bg-secondary/40 border border-border/80 p-3 text-[11px] text-muted-foreground leading-relaxed">
              Login on the dashboard will automatically authorize your browser extension! If you need to manually bind the extension, copy your API token below and paste it in the extension settings page.
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-foreground/80 flex items-center gap-1">
                <Key className="h-3 w-3" />
                Your API Access Token
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={token || "Please sign in to view your token"}
                  className="flex-1 rounded-lg border border-border/80 bg-secondary/60 px-3.5 py-2 text-xs font-mono text-muted-foreground select-all focus:outline-none focus:ring-0"
                />
                <button
                  type="button"
                  onClick={copyToken}
                  disabled={!token}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card hover:bg-secondary text-foreground disabled:opacity-50 active:scale-95 transition-all shrink-0"
                  title="Copy to Clipboard"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-primary" />
                  ) : (
                    <Copy className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
