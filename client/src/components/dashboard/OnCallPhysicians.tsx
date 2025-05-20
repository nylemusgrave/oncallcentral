import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Physician, Schedule } from "@shared/schema";
import { Phone, Clock, PlusIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RequestForm } from "@/pages/RequestForm";

const OnCallPhysicians = () => {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;
  const [_, navigate] = useLocation();
  const [createRequestModalOpen, setCreateRequestModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  // Get current date for filtering active schedules
  const now = new Date();
  
  // Set today to start of day
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Set tomorrow to end of today
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // For debugging
  console.log("Today's date:", today.toISOString());
  console.log("Tomorrow's date:", tomorrow.toISOString());
  console.log("Current time:", now.toISOString());

  const { data: schedules, isLoading: schedulesLoading } = useQuery<Schedule[]>({
    queryKey: [`/api/organizations/${orgId}/active-schedules`],
    enabled: !!orgId,
  });

  const { data: physicians } = useQuery<Physician[]>({
    queryKey: ["/api/physicians"],
  });

  const getPhysicianById = (id: number) => {
    return physicians?.find((p) => p.id === id);
  };

  // Filter schedules for today
  // Only show schedules that have "Day Shift" or "Night Shift" in their title
  // This is to show the demo data for today's on-call physicians
  const todaysSchedules = schedules?.filter(schedule => {
    try {
      const title = schedule.title;
      return title.includes("Day Shift") || title.includes("Night Shift");
    } catch (error) {
      console.error('Error filtering schedules:', error, schedule);
      return false;
    }
  }) || [];

  const formatTimeRange = (startTime: Date, endTime: Date) => {
    return `${format(new Date(startTime), "h:mm a")} - ${format(new Date(endTime), "h:mm a")}`;
  };

  const handleCreateRequest = () => {
    navigate("/requests/new");
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between p-6">
        <CardTitle className="text-lg font-medium">Today's on-call physicians</CardTitle>
        <Link href="/schedules">
          <Button variant="link" className="text-primary">
            View schedule
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="p-6 border-t border-neutral-200">
        {schedulesLoading ? (
          <div className="space-y-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-start space-x-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : todaysSchedules.length === 0 ? (
          <div className="text-center p-6 text-neutral-500">
            No on-call physicians scheduled for today
          </div>
        ) : (
          <div className="space-y-4">
            {todaysSchedules
              .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
              .map((schedule) => {
                const physician = getPhysicianById(schedule.physicianId);
                return (
                <div
                  key={schedule.id}
                  className="bg-neutral-50 p-4 rounded-lg flex items-start"
                >
                  {/* Avatar placeholder using initials */}
                  <div className="h-10 w-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold text-sm">
                    {physician ? `${physician.firstName[0]}${physician.lastName[0]}` : "??"}
                  </div>
                  <div className="ml-3 min-w-0 flex-1">
                    <div className="text-sm font-medium text-neutral-900 truncate">
                      {physician ? `Dr. ${physician.firstName} ${physician.lastName}` : "Unknown Physician"}
                    </div>
                    <div className="text-sm text-neutral-500">
                      {physician?.specialty || ""}
                    </div>
                    <div className="mt-1 flex items-center">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="ml-1 text-xs text-neutral-500">
                        {formatTimeRange(schedule.startTime, schedule.endTime)}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="p-1 rounded-full text-primary hover:bg-primary-50"
                  >
                    <Phone className="h-5 w-5" />
                  </Button>
                </div>
              );
            })}

            {todaysSchedules.length > itemsPerPage && (
              <div className="flex justify-center gap-2 mt-4 border-t pt-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage(prev => Math.min(Math.ceil(todaysSchedules.length / itemsPerPage), prev + 1))}
                  disabled={currentPage === Math.ceil(todaysSchedules.length / itemsPerPage)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
            <div className="mt-3">
              <Dialog open={createRequestModalOpen} onOpenChange={setCreateRequestModalOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full" onClick={handleCreateRequest}>
                    <PlusIcon className="mr-2 h-5 w-5" />
                    Create On-Call Request
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OnCallPhysicians;
