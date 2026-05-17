"use client";

import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/lib/api/analytics";
import { scansApi } from "@/lib/api/scans";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const tooltipStyle = {
  backgroundColor: "oklch(0.145 0.006 260)",
  border: "1px solid oklch(0.22 0.007 260)",
  borderRadius: "6px",
  color: "oklch(0.95 0.005 260)",
  fontSize: "12px",
};

function ChartCard({
  title,
  children,
  loading,
  empty,
}: {
  title: string;
  children: React.ReactNode;
  loading?: boolean;
  empty?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 flex flex-col justify-between min-h-[240px]">
      <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </p>
      {loading ? (
        <div className="flex-1 flex items-center justify-center animate-pulse">
          <div className="h-32 w-full bg-muted rounded" />
        </div>
      ) : empty ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
          <p className="text-xs text-muted-foreground">No scans logged yet</p>
        </div>
      ) : (
        children
      )}
    </div>
  );
}

export function ScanActivityChart() {
  const { data: trends, isLoading } = useQuery({
    queryKey: ["analytics", "trends"],
    queryFn: () => analyticsApi.getTrends(),
    refetchInterval: 10000,
  });

  const isEmpty = !trends || trends.every((t) => t.scans === 0);

  return (
    <ChartCard title="Scan Activity — Last 14 Days" loading={isLoading} empty={isEmpty}>
      {trends && (
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={trends} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="scansGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="oklch(0.62 0.18 250)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="oklch(0.62 0.18 250)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="threatsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="oklch(0.52 0.22 25)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="oklch(0.52 0.22 25)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.007 260)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 9, fill: "oklch(0.56 0.006 260)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis tick={{ fontSize: 9, fill: "oklch(0.56 0.006 260)" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "oklch(0.22 0.007 260)" }} />
            <Area
              type="monotone"
              dataKey="scans"
              stroke="oklch(0.62 0.18 250)"
              strokeWidth={1.5}
              fill="url(#scansGrad)"
              name="Scans"
            />
            <Area
              type="monotone"
              dataKey="threats"
              stroke="oklch(0.52 0.22 25)"
              strokeWidth={1.5}
              fill="url(#threatsGrad)"
              name="Threats"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

export function RiskDistributionChart() {
  const { data: scansData, isLoading } = useQuery({
    queryKey: ["scans", "list", 100],
    queryFn: () => scansApi.list({ page_size: 100 }),
  });

  const items = scansData?.items || [];
  const isEmpty = items.length === 0;

  const riskCounts = { safe: 0, low: 0, medium: 0, high: 0, critical: 0 };
  items.forEach((s) => {
    if (s.level in riskCounts) {
      riskCounts[s.level as keyof typeof riskCounts]++;
    }
  });

  const riskData = [
    { name: "Critical", value: riskCounts.critical, color: "var(--risk-critical)" },
    { name: "High", value: riskCounts.high, color: "var(--risk-high)" },
    { name: "Medium", value: riskCounts.medium, color: "var(--risk-medium)" },
    { name: "Low", value: riskCounts.low, color: "var(--risk-low)" },
    { name: "Safe", value: riskCounts.safe, color: "var(--risk-safe)" },
  ];

  return (
    <ChartCard title="Risk Distribution" loading={isLoading} empty={isEmpty}>
      <div className="flex items-center gap-6">
        <ResponsiveContainer width={130} height={130}>
          <PieChart>
            <Pie
              data={riskData}
              cx="50%"
              cy="50%"
              innerRadius={38}
              outerRadius={58}
              paddingAngle={2}
              dataKey="value"
              strokeWidth={0}
            >
              {riskData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
        <ul className="flex-1 space-y-1.5">
          {riskData.map((item) => (
            <li key={item.name} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs text-muted-foreground">{item.name}</span>
              </div>
              <span className="text-xs font-semibold tabular-nums text-foreground">
                {item.value.toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </ChartCard>
  );
}

export function ThreatCategoryChart() {
  const { data: scansData, isLoading } = useQuery({
    queryKey: ["scans", "list", 100],
    queryFn: () => scansApi.list({ page_size: 100 }),
  });

  const items = scansData?.items || [];
  const catCounts: Record<string, number> = {
    "Phishing": 0,
    "Malware": 0,
    "Scam": 0,
    "Suspicious TLD": 0,
    "SSL Issues": 0
  };

  let hasThreats = false;
  items.forEach((s) => {
    if (s.dominant_category) {
      hasThreats = true;
      let label = "Scam";
      if (s.dominant_category.includes("phish")) label = "Phishing";
      else if (s.dominant_category.includes("malware")) label = "Malware";
      else if (s.dominant_category.includes("keywords")) label = "Suspicious TLD";
      else if (s.dominant_category.includes("reputation")) label = "SSL Issues";

      catCounts[label] = (catCounts[label] || 0) + 1;
    }
  });

  const categoryData = Object.entries(catCounts).map(([name, count]) => ({ name, count }));

  return (
    <ChartCard title="Threat Categories" loading={isLoading} empty={!hasThreats}>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart
          data={categoryData}
          layout="vertical"
          margin={{ top: 0, right: 4, left: -8, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.007 260)" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 9, fill: "oklch(0.56 0.006 260)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 9, fill: "oklch(0.56 0.006 260)" }}
            axisLine={false}
            tickLine={false}
            width={85}
          />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "oklch(0.22 0.007 260)" }} />
          <Bar dataKey="count" radius={[0, 3, 3, 0]} fill="oklch(0.62 0.18 250)" name="Count" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function ConfidenceDistributionChart() {
  const { data: scansData, isLoading } = useQuery({
    queryKey: ["scans", "list", 100],
    queryFn: () => scansApi.list({ page_size: 100 }),
  });

  const items = scansData?.items || [];
  const isEmpty = items.length === 0;

  const confCounts = { "90–100%": 0, "75–89%": 0, "60–74%": 0, "40–59%": 0, "< 40%": 0 };
  items.forEach((s) => {
    const score = s.score;
    if (score >= 90) confCounts["90–100%"]++;
    else if (score >= 75) confCounts["75–89%"]++;
    else if (score >= 60) confCounts["60–74%"]++;
    else if (score >= 40) confCounts["40–59%"]++;
    else confCounts["< 40%"]++;
  });

  const confidenceData = Object.entries(confCounts).map(([range, count]) => ({ range, count }));

  return (
    <ChartCard title="Confidence Distribution" loading={isLoading} empty={isEmpty}>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart
          data={confidenceData}
          margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.007 260)" />
          <XAxis
            dataKey="range"
            tick={{ fontSize: 9, fill: "oklch(0.56 0.006 260)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis tick={{ fontSize: 9, fill: "oklch(0.56 0.006 260)" }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "oklch(0.22 0.007 260)" }} />
          <Bar dataKey="count" radius={[3, 3, 0, 0]} fill="oklch(0.62 0.16 155)" name="Scans" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
