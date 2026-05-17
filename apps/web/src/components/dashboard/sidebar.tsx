"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldCheck,
  LayoutDashboard,
  History,
  AlertTriangle,
  Settings,
  Bell,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/scans", label: "Scan History", icon: History },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-56 flex-col border-r border-border bg-sidebar">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 border-b border-border px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/15">
          <ShieldCheck className="h-4 w-4 text-primary" />
        </div>
        <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">
          Security Copilot
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-2 py-3">
        <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Intelligence
        </p>
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href as any}
              className={cn(
                "group flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
                isActive
                  ? "bg-accent text-foreground"
                  : "text-sidebar-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {isActive && (
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border px-2 py-3 space-y-0.5">
        <Link
          href="#"
          className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <Bell className="h-4 w-4 shrink-0" />
          Alerts
        </Link>
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
            pathname === "/settings"
              ? "bg-accent text-foreground"
              : "text-sidebar-foreground hover:bg-accent hover:text-foreground"
          )}
        >
          <Settings className="h-4 w-4 shrink-0" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
