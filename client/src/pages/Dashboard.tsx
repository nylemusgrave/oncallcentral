import { useOrganization } from "@/contexts/OrganizationContext";
import StatsOverview from "@/components/dashboard/StatsOverview";
import RecentRequests from "@/components/dashboard/RecentRequests";
import OnCallPhysicians from "@/components/dashboard/OnCallPhysicians";
import PerformanceMetrics from "@/components/dashboard/PerformanceMetrics";
import QuickActions from "@/components/dashboard/QuickActions";
import { Skeleton } from "@/components/ui/skeleton";

const Dashboard = () => {
  const { currentOrganization, isLoading } = useOrganization();

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-neutral-900">
          {isLoading ? (
            <Skeleton className="h-8 w-48" />
          ) : (
            `Dashboard${currentOrganization ? ` - ${currentOrganization.name}` : ""}`
          )}
        </h1>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Stats Overview */}
        <StatsOverview />

        {/* Activity and Schedule Overview */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <RecentRequests />
          <OnCallPhysicians />
        </div>

        {/* Performance Metrics */}
        <PerformanceMetrics />

        {/* Quick Actions */}
        <QuickActions />
      </div>
    </>
  );
};

export default Dashboard;
