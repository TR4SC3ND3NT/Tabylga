import DashboardShell from "@/components/DashboardShell";
import {
  dashboardStats,
  heatmapRegions,
  revenueByRegion,
  spendingByCategory,
  topMerchants,
  transactionsOverTime,
} from "@/lib/mockData";

export default function Home() {
  return (
    <DashboardShell
      stats={dashboardStats}
      heatmapRegions={heatmapRegions}
      revenueByRegion={revenueByRegion}
      spendingByCategory={spendingByCategory}
      transactionsOverTime={transactionsOverTime}
      topMerchants={topMerchants}
    />
  );
}
