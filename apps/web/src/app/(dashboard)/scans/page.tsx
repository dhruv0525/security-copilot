import { PageHeader } from "@/components/dashboard/page-header";
import { ScanHistoryTable } from "@/components/dashboard/scan-history-table";

export default function ScanHistoryPage() {
  return (
    <>
      <PageHeader
        title="Scan History"
        description="All scanned domains with risk levels, confidence scores, and detection sources."
      />
      <ScanHistoryTable />
    </>
  );
}
