import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
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
import { useOrganization } from "@/contexts/OrganizationContext";
import { Request } from "@shared/schema";
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
import { FileDownIcon, TrendingUpIcon, TrendingDownIcon } from "lucide-react";

const PerformanceMetrics = () => {
  const [timeRange, setTimeRange] = useState("7days");
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;

  const { data: requests } = useQuery<Request[]>({
    queryKey: ["/api/organizations", orgId, "requests"],
    enabled: !!orgId,
  });

  // Calculate metrics
  const calculateMetrics = () => {
    if (!requests || requests.length === 0) {
      return {
        avgResponseTime: 0,
        responseTimeImprovement: 0,
        requestVolume: 0,
        requestVolumeChange: 0,
        utilizationRate: 0,
        utilizationImprovement: 0,
        completionRate: 0,
        completionImprovement: 0,
        statusBreakdown: [],
        responseTimeData: [],
        requestVolumeData: []
      };
    }

    // Mock calculations - in a real app, these would be calculated from actual data
    const avgResponseTime = 12.4;
    const responseTimeImprovement = 8;
    const requestVolume = requests.length;
    const requestVolumeChange = 12;
    const utilizationRate = 76;
    const utilizationImprovement = 5;
    
    // Calculate completion rate
    const completedRequests = requests.filter(r => r.status === "completed").length;
    const completionRate = Math.round((completedRequests / requests.length) * 100);
    const completionImprovement = 3;

    // Status breakdown for the pie chart
    const statusCounts = requests.reduce((acc, request) => {
      acc[request.status] = (acc[request.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const statusBreakdown = Object.entries(statusCounts).map(([status, count]) => ({
      name: status,
      value: Math.round((count / requests.length) * 100)
    }));

    // Mock data for response time chart
    const responseTimeData = [
      { name: "Mon", time: 15 },
      { name: "Tue", time: 12 },
      { name: "Wed", time: 18 },
      { name: "Thu", time: 10 },
      { name: "Fri", time: 8 },
      { name: "Sat", time: 14 },
      { name: "Sun", time: 9 }
    ];

    // Mock data for request volume chart
    const requestVolumeData = [
      { name: "Mon", count: 12 },
      { name: "Tue", count: 15 },
      { name: "Wed", count: 10 },
      { name: "Thu", count: 18 },
      { name: "Fri", count: 24 },
      { name: "Sat", count: 22 },
      { name: "Sun", count: 23 }
    ];

    return {
      avgResponseTime,
      responseTimeImprovement,
      requestVolume,
      requestVolumeChange,
      utilizationRate,
      utilizationImprovement,
      completionRate,
      completionImprovement,
      statusBreakdown,
      responseTimeData,
      requestVolumeData
    };
  };

  const metrics = calculateMetrics();

  // For the pie chart colors
  const COLORS = ['#4CAF50', '#FFC107', '#F44336', '#9E9E9E'];

  return (
    <Card className="mt-8">
      <CardHeader className="flex flex-row items-center justify-between p-6">
        <CardTitle className="text-lg font-medium">Performance Metrics</CardTitle>
        <div className="flex space-x-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
              <SelectItem value="year">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="flex items-center">
            <FileDownIcon className="-ml-0.5 mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6 border-t border-neutral-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Average response time */}
          <div className="bg-neutral-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-neutral-700">Average Response Time</h4>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <TrendingUpIcon className="-ml-0.5 mr-1 h-3 w-3" />
                {metrics.responseTimeImprovement}% improvement
              </span>
            </div>
            <div className="flex items-baseline">
              <p className="text-2xl font-semibold text-neutral-900">{metrics.avgResponseTime} minutes</p>
              <p className="ml-2 text-sm text-neutral-500">avg. time to respond</p>
            </div>
            {/* Response time chart */}
            <div className="mt-4 h-16">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics.responseTimeData}>
                  <defs>
                    <linearGradient id="colorTime" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1976D2" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#1976D2" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area 
                    type="monotone" 
                    dataKey="time" 
                    stroke="#1976D2" 
                    fillOpacity={1} 
                    fill="url(#colorTime)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* On-call request volume */}
          <div className="bg-neutral-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-neutral-700">On-Call Request Volume</h4>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                <TrendingDownIcon className="-ml-0.5 mr-1 h-3 w-3" />
                {metrics.requestVolumeChange}% increase
              </span>
            </div>
            <div className="flex items-baseline">
              <p className="text-2xl font-semibold text-neutral-900">{metrics.requestVolume}</p>
              <p className="ml-2 text-sm text-neutral-500">total requests</p>
            </div>
            {/* Request volume chart */}
            <div className="mt-4 h-16">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.requestVolumeData}>
                  <Bar dataKey="count" fill="#00897B" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Physician utilization */}
          <div className="bg-neutral-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-neutral-700">Physician Utilization</h4>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <TrendingUpIcon className="-ml-0.5 mr-1 h-3 w-3" />
                {metrics.utilizationImprovement}% improvement
              </span>
            </div>
            <div className="flex items-baseline">
              <p className="text-2xl font-semibold text-neutral-900">{metrics.utilizationRate}%</p>
              <p className="ml-2 text-sm text-neutral-500">utilization rate</p>
            </div>
            <div className="mt-4 flex justify-center">
              <div className="h-16 w-16 rounded-full border-4 border-primary relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                  {metrics.utilizationRate}%
                </div>
              </div>
            </div>
          </div>

          {/* Request resolution */}
          <div className="bg-neutral-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-neutral-700">Request Resolution</h4>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <TrendingUpIcon className="-ml-0.5 mr-1 h-3 w-3" />
                {metrics.completionImprovement}% improvement
              </span>
            </div>
            <div className="flex items-baseline">
              <p className="text-2xl font-semibold text-neutral-900">{metrics.completionRate}%</p>
              <p className="ml-2 text-sm text-neutral-500">completion rate</p>
            </div>
            {/* Status breakdown */}
            <div className="mt-4 flex justify-center">
              <ResponsiveContainer width={100} height={50}>
                <PieChart>
                  <Pie
                    data={metrics.statusBreakdown}
                    cx="50%"
                    cy="50%"
                    outerRadius={25}
                    fill="#8884d8"
                    dataKey="value"
                    label={false}
                  >
                    {metrics.statusBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 grid grid-cols-4 gap-2 text-xs">
              <div>
                <div className="h-2 bg-green-500 rounded-full"></div>
                <p className="mt-1 text-neutral-500">Completed</p>
                <p className="font-medium">{metrics.statusBreakdown.find(s => s.name === "completed")?.value || 0}%</p>
              </div>
              <div>
                <div className="h-2 bg-yellow-500 rounded-full"></div>
                <p className="mt-1 text-neutral-500">Pending</p>
                <p className="font-medium">{metrics.statusBreakdown.find(s => s.name === "pending")?.value || 0}%</p>
              </div>
              <div>
                <div className="h-2 bg-red-500 rounded-full"></div>
                <p className="mt-1 text-neutral-500">Declined</p>
                <p className="font-medium">{metrics.statusBreakdown.find(s => s.name === "declined")?.value || 0}%</p>
              </div>
              <div>
                <div className="h-2 bg-gray-500 rounded-full"></div>
                <p className="mt-1 text-neutral-500">Cancelled</p>
                <p className="font-medium">{metrics.statusBreakdown.find(s => s.name === "cancelled")?.value || 0}%</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PerformanceMetrics;
