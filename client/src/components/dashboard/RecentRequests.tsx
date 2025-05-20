import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Request, Physician } from "@shared/schema";
import { useOrganization } from "@/contexts/OrganizationContext";
import { formatDistanceToNow } from "date-fns";

const getStatusBadgeStyles = (status: string) => {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
    case "accepted":
      return "bg-green-100 text-green-800 hover:bg-green-100";
    case "declined":
      return "bg-red-100 text-red-800 hover:bg-red-100";
    case "in_progress":
      return "bg-blue-100 text-blue-800 hover:bg-blue-100";
    case "completed":
      return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    case "cancelled":
      return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-100";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "pending":
      return "Pending";
    case "accepted":
      return "Accepted";
    case "declined":
      return "Declined";
    case "in_progress":
      return "In Progress";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
};

const RecentRequests = () => {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;

  const { data: requests, isLoading: requestsLoading } = useQuery<Request[]>({
    queryKey: ["/api/organizations", orgId, "requests"],
    enabled: !!orgId,
  });

  const { data: physicians } = useQuery<Physician[]>({
    queryKey: ["/api/physicians"],
  });

  const getPhysicianName = (physicianId: number) => {
    const physician = physicians?.find((p) => p.id === physicianId);
    return physician
      ? `Dr. ${physician.firstName} ${physician.lastName}`
      : "Unknown Physician";
  };

  const getPhysicianSpecialty = (physicianId: number) => {
    const physician = physicians?.find((p) => p.id === physicianId);
    return physician ? physician.specialty : "";
  };

  const formatTime = (timestamp: Date) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  // Get most recent 5 requests
  const recentRequests = requests
    ?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <Card className="col-span-2">
      <CardHeader className="flex flex-row items-center justify-between p-6">
        <CardTitle className="text-lg font-medium">Recent on-call requests</CardTitle>
        <Link href="/requests">
          <Button variant="link" className="text-primary">
            View all
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        <div className="border-t border-neutral-200">
          <div className="overflow-hidden overflow-x-auto">
            {requestsLoading ? (
              <div className="p-6 space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex flex-col space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ))}
              </div>
            ) : recentRequests?.length === 0 ? (
              <div className="text-center p-6 text-neutral-500">
                No requests found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Assigned to</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentRequests?.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-medium">{request.patientName}</div>
                          <div className="text-sm text-neutral-500">
                            MRN: #{request.patientMRN}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {getPhysicianName(request.physicianId)}
                        </div>
                        <div className="text-sm text-neutral-500">
                          {getPhysicianSpecialty(request.physicianId)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getStatusBadgeStyles(request.status)}
                        >
                          {getStatusLabel(request.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-neutral-500">
                        {formatTime(request.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/requests/${request.id}`}>
                          <Button variant="link" className="text-primary">
                            Details
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentRequests;
