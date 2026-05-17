import { PageHeader } from "@/components/dashboard/page-header";
import { LookupInput } from "@/components/dashboard/lookup-input";
import { MetricsCards } from "@/components/dashboard/metrics-cards";
import {
  ScanActivityChart,
  RiskDistributionChart,
  ThreatCategoryChart,
  ConfidenceDistributionChart,
} from "@/components/dashboard/overview-charts";
import { RecentThreats } from "@/components/dashboard/recent-threats";

export default function OverviewPage() {
  return (
    <>
      <PageHeader
        title="Overview"
        description="Real-time browser security intelligence across all scanned domains."
        action={<LookupInput />}
      />

      {/* Metrics */}
      <MetricsCards />

      {/* Charts */}
      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ScanActivityChart />
        </div>
        <RiskDistributionChart />
        <ThreatCategoryChart />
        <ConfidenceDistributionChart />
      </div>

      {/* Recent Threats Feed */}
      <div className="mt-5">
        <RecentThreats />
      </div>
    </>
  );
}
