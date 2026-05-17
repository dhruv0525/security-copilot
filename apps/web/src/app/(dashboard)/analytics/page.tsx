import { PageHeader } from "@/components/dashboard/page-header";
import {
  ScanActivityChart,
  RiskDistributionChart,
  ThreatCategoryChart,
  ConfidenceDistributionChart,
} from "@/components/dashboard/overview-charts";

export default function AnalyticsPage() {
  return (
    <>
      <PageHeader
        title="Security Analytics"
        description="Comprehensive analysis of scanned domains, threat distributions, and model performance."
      />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <ScanActivityChart />
        <RiskDistributionChart />
        <ThreatCategoryChart />
        <ConfidenceDistributionChart />
      </div>
    </>
  );
}
