import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Request, Physician, Schedule } from "@shared/schema";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  FileTextIcon, 
  FileDownIcon, 
  Loader2,
  FileBarChart2Icon
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format, startOfDay, endOfDay, subDays, differenceInMinutes } from "date-fns";

const Reports = () => {
  const [timeRange, setTimeRange] = useState("30days");
  const [reportType, setReportType] = useState("activity");
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;

  const { data: requests, isLoading: requestsLoading } = useQuery<Request[]>({
    queryKey: ["/api/organizations", orgId, "requests"],
    enabled: !!orgId,
  });

  const { data: physicians, isLoading: physiciansLoading } = useQuery<Physician[]>({
    queryKey: ["/api/organizations", orgId, "physicians"],
    enabled: !!orgId,
  });

  const { data: schedules, isLoading: schedulesLoading } = useQuery<Schedule[]>({
    queryKey: ["/api/organizations", orgId, "schedules"],
    enabled: !!orgId,
  });

  const isLoading = requestsLoading || physiciansLoading || schedulesLoading;

  // Filter data based on selected time range
  const getTimeRangeFilter = () => {
    const now = new Date();
    switch (timeRange) {
      case "7days":
        return subDays(now, 7);
      case "30days":
        return subDays(now, 30);
      case "90days":
        return subDays(now, 90);
      case "year":
        return subDays(now, 365);
      default:
        return subDays(now, 30);
    }
  };

  const startDate = startOfDay(getTimeRangeFilter());

  const filteredRequests = requests?.filter(request => 
    new Date(request.createdAt) >= startDate
  );

  const filteredSchedules = schedules?.filter(schedule => 
    new Date(schedule.startTime) >= startDate
  );

  // Physician activity data
  const getPhysicianActivity = () => {
    if (!physicians || !filteredRequests || !filteredSchedules) return [];

    return physicians.map(physician => {
      const physicianRequests = filteredRequests.filter(r => r.physicianId === physician.id);
      const physicianSchedules = filteredSchedules.filter(s => s.physicianId === physician.id);
      
      // Calculate on-call hours
      const onCallHours = physicianSchedules.reduce((total, schedule) => {
        const startTime = new Date(schedule.startTime);
        const endTime = new Date(schedule.endTime);
        const durationInMinutes = differenceInMinutes(endTime, startTime);
        return total + (durationInMinutes / 60);
      }, 0);

      // Calculate response time (avg minutes between creation and first status change)
      const avgResponseTime = physicianRequests.reduce((total, request) => {
        if (request.statusHistory && request.statusHistory.length > 1) {
          const createdAt = new Date(request.statusHistory[0].timestamp);
          const firstResponse = new Date(request.statusHistory[1].timestamp);
          return total + differenceInMinutes(firstResponse, createdAt);
        }
        return total;
      }, 0) / (physicianRequests.length || 1);

      return {
        id: physician.id,
        name: `Dr. ${physician.firstName} ${physician.lastName}`,
        specialty: physician.specialty,
        totalRequests: physicianRequests.length,
        completedRequests: physicianRequests.filter(r => r.status === "completed").length,
        cancelledRequests: physicianRequests.filter(r => r.status === "cancelled").length,
        declinedRequests: physicianRequests.filter(r => r.status === "declined").length,
        onCallHours: Math.round(onCallHours),
        avgResponseTime: Math.round(avgResponseTime)
      };
    });
  };

  // Request status data for pie chart
  const getRequestStatusData = () => {
    if (!filteredRequests) return [];

    const statusCounts: Record<string, number> = {
      pending: 0,
      accepted: 0,
      declined: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0
    };

    filteredRequests.forEach(request => {
      if (statusCounts[request.status] !== undefined) {
        statusCounts[request.status]++;
      }
    });

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count
    }));
  };

  // Weekly request volume data
  const getWeeklyRequestData = () => {
    if (!filteredRequests) return [];

    const weeklyData: Record<string, number> = {};
    const now = new Date();

    // Initialize weeks
    for (let i = 0; i < 10; i++) {
      const date = subDays(now, i * 7);
      const weekLabel = `Week ${i + 1}`;
      weeklyData[weekLabel] = 0;
    }

    // Count requests per week
    filteredRequests.forEach(request => {
      const requestDate = new Date(request.createdAt);
      const diffDays = Math.floor((now.getTime() - requestDate.getTime()) / (1000 * 60 * 60 * 24));
      const weekIndex = Math.floor(diffDays / 7);
      
      if (weekIndex < 10) {
        const weekLabel = `Week ${weekIndex + 1}`;
        weeklyData[weekLabel]++;
      }
    });

    // Convert to array format for chart
    return Object.entries(weeklyData)
      .map(([week, count]) => ({ week, count }))
      .reverse();
  };

  // Priority distribution
  const getPriorityDistribution = () => {
    if (!filteredRequests) return [];

    const priorityCounts: Record<string, number> = {
      normal: 0,
      urgent: 0,
      emergency: 0
    };

    filteredRequests.forEach(request => {
      if (priorityCounts[request.priority] !== undefined) {
        priorityCounts[request.priority]++;
      }
    });

    return Object.entries(priorityCounts).map(([priority, count]) => ({
      name: priority.charAt(0).toUpperCase() + priority.slice(1),
      value: count
    }));
  };

  // Chart colors
  const COLORS = ['#4CAF50', '#2196F3', '#F44336', '#FFC107', '#9C27B0', '#607D8B'];
  const PRIORITY_COLORS = {
    Normal: '#2196F3',
    Urgent: '#FFC107', 
    Emergency: '#F44336'
  };

  const handleExportPDF = () => {
    window.alert("PDF export functionality will be implemented in a future update");
  };

  const handleExportExcel = () => {
    window.alert("Excel export functionality will be implemented in a future update");
  };

  const physiciansActivity = getPhysicianActivity();
  const requestStatusData = getRequestStatusData();
  const weeklyRequestData = getWeeklyRequestData();
  const priorityData = getPriorityDistribution();

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-neutral-900">Reports</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportPDF}>
              <FileTextIcon className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
            <Button variant="outline" onClick={handleExportExcel}>
              <FileDownIcon className="mr-2 h-4 w-4" />
              Export Excel
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-8">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>Performance Reports</CardTitle>
                <CardDescription>
                  Analytics and insights about on-call physician activities
                </CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Report Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activity">Physician Activity</SelectItem>
                    <SelectItem value="requests">Request Analysis</SelectItem>
                    <SelectItem value="utilization">Physician Utilization</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Time Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7days">Last 7 days</SelectItem>
                    <SelectItem value="30days">Last 30 days</SelectItem>
                    <SelectItem value="90days">Last 90 days</SelectItem>
                    <SelectItem value="year">Last year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Tabs defaultValue={reportType} value={reportType} onValueChange={setReportType}>
                <TabsList className="mb-6">
                  <TabsTrigger value="activity">Physician Activity</TabsTrigger>
                  <TabsTrigger value="requests">Request Analysis</TabsTrigger>
                  <TabsTrigger value="utilization">Physician Utilization</TabsTrigger>
                </TabsList>

                {/* Physician Activity Report */}
                <TabsContent value="activity">
                  <div className="overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Physician</TableHead>
                          <TableHead>Specialty</TableHead>
                          <TableHead className="text-right">On-Call Hours</TableHead>
                          <TableHead className="text-right">Total Requests</TableHead>
                          <TableHead className="text-right">Completed</TableHead>
                          <TableHead className="text-right">Cancelled</TableHead>
                          <TableHead className="text-right">Declined</TableHead>
                          <TableHead className="text-right">Avg. Response (min)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {physiciansActivity.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center text-neutral-500">
                              No activity data available for the selected time period
                            </TableCell>
                          </TableRow>
                        ) : (
                          physiciansActivity.map((physician) => (
                            <TableRow key={physician.id}>
                              <TableCell className="font-medium">{physician.name}</TableCell>
                              <TableCell>{physician.specialty}</TableCell>
                              <TableCell className="text-right">{physician.onCallHours}</TableCell>
                              <TableCell className="text-right">{physician.totalRequests}</TableCell>
                              <TableCell className="text-right">{physician.completedRequests}</TableCell>
                              <TableCell className="text-right">{physician.cancelledRequests}</TableCell>
                              <TableCell className="text-right">{physician.declinedRequests}</TableCell>
                              <TableCell className="text-right">{physician.avgResponseTime}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="mt-8">
                    <h3 className="font-medium mb-4">On-Call Hours by Physician</h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={physiciansActivity}
                          margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="name" 
                            angle={-45} 
                            textAnchor="end" 
                            height={80} 
                          />
                          <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="onCallHours" name="On-Call Hours" fill="#1976D2" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </TabsContent>

                {/* Request Analysis Report */}
                <TabsContent value="requests">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-neutral-50 p-6 rounded-lg">
                      <h3 className="font-medium mb-4">Request Status Distribution</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={requestStatusData}
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {requestStatusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [`${value} requests`, 'Count']} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="bg-neutral-50 p-6 rounded-lg">
                      <h3 className="font-medium mb-4">Request Priority Distribution</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={priorityData}
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {priorityData.map((entry) => (
                                <Cell 
                                  key={`cell-${entry.name}`} 
                                  fill={PRIORITY_COLORS[entry.name as keyof typeof PRIORITY_COLORS]} 
                                />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [`${value} requests`, 'Count']} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8">
                    <h3 className="font-medium mb-4">Weekly Request Volume</h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={weeklyRequestData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="week" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="count" 
                            name="Request Count" 
                            stroke="#00897B" 
                            activeDot={{ r: 8 }} 
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </TabsContent>

                {/* Physician Utilization Report */}
                <TabsContent value="utilization">
                  <div className="mb-8">
                    <h3 className="font-medium mb-4">Physician Utilization Rate</h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={physiciansActivity}
                          margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="name" 
                            angle={-45} 
                            textAnchor="end" 
                            height={80} 
                          />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar 
                            dataKey="completedRequests" 
                            name="Completed Requests" 
                            stackId="a" 
                            fill="#4CAF50" 
                          />
                          <Bar 
                            dataKey="declinedRequests" 
                            name="Declined Requests" 
                            stackId="a" 
                            fill="#F44336" 
                          />
                          <Bar 
                            dataKey="cancelledRequests" 
                            name="Cancelled Requests" 
                            stackId="a" 
                            fill="#9E9E9E" 
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="mt-8">
                    <h3 className="font-medium mb-4">Average Response Time by Physician</h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={physiciansActivity}
                          margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="name" 
                            angle={-45} 
                            textAnchor="end" 
                            height={80} 
                          />
                          <YAxis label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }} />
                          <Tooltip />
                          <Legend />
                          <Bar 
                            dataKey="avgResponseTime" 
                            name="Average Response Time (min)" 
                            fill="#FFC107" 
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            )}

            {!isLoading && (!requests || requests.length === 0) && (
              <div className="text-center p-8 bg-neutral-50 rounded-lg">
                <FileBarChart2Icon className="h-12 w-12 mx-auto text-neutral-400 mb-4" />
                <h3 className="text-lg font-medium text-neutral-700 mb-2">No data available for reports</h3>
                <p className="text-neutral-500">
                  Create some on-call requests and schedules to start generating reports.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Reports;
