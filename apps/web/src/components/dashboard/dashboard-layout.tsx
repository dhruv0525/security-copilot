import { Sidebar } from "@/components/dashboard/sidebar";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 pl-56">
        <div className="mx-auto max-w-screen-xl px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
