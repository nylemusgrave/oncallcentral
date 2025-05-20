import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  PlusIcon, 
  SearchIcon, 
  Loader2, 
  FileTextIcon,
  CalendarIcon 
} from "lucide-react";
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
      return "bg-gray-400 text-white hover:bg-gray-400";
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

const getPriorityBadgeStyles = (priority: string) => {
  switch (priority) {
    case "normal":
      return "bg-blue-100 text-blue-800";
    case "urgent":
      return "bg-orange-100 text-orange-800";
    case "emergency":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getPriorityLabel = (priority: string) => {
  switch (priority) {
    case "normal":
      return "Normal";
    case "urgent":
      return "Urgent";
    case "emergency":
      return "Emergency";
    default:
      return priority;
  }
};

const Requests = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
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

  // Filter requests
  let filteredRequests = requests;
  
  if (statusFilter !== "all") {
    filteredRequests = filteredRequests?.filter(
      (request) => request.status === statusFilter
    );
  }
  
  if (priorityFilter !== "all") {
    filteredRequests = filteredRequests?.filter(
      (request) => request.priority === priorityFilter
    );
  }
  
  if (searchTerm) {
    filteredRequests = filteredRequests?.filter(
      (request) =>
        request.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.patientMRN.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getPhysicianName(request.physicianId).toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-neutral-900">On-Call Requests</h1>
          <Link href="/requests/new">
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" /> New Request
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-8">
        <Card>
          <CardHeader className="p-6">
            <CardTitle>Request Management</CardTitle>
            <CardDescription>
              Manage and track on-call physician requests
            </CardDescription>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div className="relative sm:col-span-2">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SearchIcon className="h-5 w-5 text-neutral-400" />
                </div>
                <Input
                  placeholder="Search requests..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div>
                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="declined">Declined</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Select
                  value={priorityFilter}
                  onValueChange={setPriorityFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {requestsLoading ? (
              <div className="flex justify-center items-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !filteredRequests || filteredRequests.length === 0 ? (
              <div className="text-center p-8 text-neutral-500">
                {searchTerm || statusFilter !== "all" || priorityFilter !== "all"
                  ? "No requests found matching your filters"
                  : "No requests found. Create your first request to get started."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Physician</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div className="font-medium">{request.patientName}</div>
                            <div className="text-sm text-neutral-500">
                              MRN: {request.patientMRN}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">
                              {getPhysicianName(request.physicianId)}
                            </div>
                            <div className="text-sm text-neutral-500">
                              {getPhysicianSpecialty(request.physicianId)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium truncate max-w-[200px]" title={request.diagnosis}>
                              {request.diagnosis}
                            </div>
                            <div className="text-sm text-neutral-500 truncate max-w-[200px]" title={request.location}>
                              {request.location}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPriorityBadgeStyles(request.priority)}>
                            {getPriorityLabel(request.priority)}
                          </Badge>
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
                            <Button variant="outline" size="sm">
                              <FileTextIcon className="h-4 w-4 mr-2" />
                              View
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Requests;
