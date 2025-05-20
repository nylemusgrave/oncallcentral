import { Card, CardContent } from "@/components/ui/card";
import { CheckCircleIcon, CalendarIcon, ClockIcon, ClipboardIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Schedule, Request, Physician } from "@shared/schema";

const StatsOverview = () => {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;

  const { data: physicians, isLoading: physiciansLoading } = useQuery<Physician[]>({
    queryKey: ["/api/organizations", orgId, "physicians"],
    enabled: !!orgId,
  });

  const { data: schedules, isLoading: schedulesLoading } = useQuery<Schedule[]>({
    queryKey: ["/api/organizations", orgId, "schedules"],
    enabled: !!orgId,
  });

  const { data: pendingRequests, isLoading: pendingRequestsLoading } = useQuery<Request[]>({
    queryKey: ["/api/requests/status/pending"],
    enabled: !!orgId,
  });

  const { data: completedRequests, isLoading: completedRequestsLoading } = useQuery<Request[]>({
    queryKey: ["/api/requests/status/completed"],
    enabled: !!orgId,
  });

  const stats = [
    {
      title: "Active on-call physicians",
      value: physicians?.length || 0,
      icon: <CheckCircleIcon className="h-6 w-6 text-primary" />,
      background: "bg-primary-50",
      isLoading: physiciansLoading,
    },
    {
      title: "Scheduled shifts this week",
      value: schedules?.length || 0,
      icon: <CalendarIcon className="h-6 w-6 text-secondary-500" />,
      background: "bg-secondary-50",
      isLoading: schedulesLoading,
    },
    {
      title: "Pending on-call requests",
      value: pendingRequests?.length || 0,
      icon: <ClockIcon className="h-6 w-6 text-red-500" />,
      background: "bg-red-50",
      isLoading: pendingRequestsLoading,
    },
    {
      title: "Completed requests (30d)",
      value: completedRequests?.length || 0,
      icon: <ClipboardIcon className="h-6 w-6 text-green-500" />,
      background: "bg-green-50",
      isLoading: completedRequestsLoading,
    },
  ];

  return (
    <div className="mt-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className={`flex-shrink-0 rounded-md ${stat.background} p-3`}>
                  {stat.icon}
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-neutral-500 truncate">
                      {stat.title}
                    </dt>
                    <dd>
                      {stat.isLoading ? (
                        <Skeleton className="h-6 w-12 mt-1" />
                      ) : (
                        <div className="text-lg font-semibold text-neutral-900">
                          {stat.value}
                        </div>
                      )}
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default StatsOverview;
