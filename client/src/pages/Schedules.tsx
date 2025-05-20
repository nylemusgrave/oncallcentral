import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Physician, Schedule, insertScheduleSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { CalendarPlus, Download, Upload, Loader2, CalendarIcon, Clock } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addDays, parseISO, isSameDay, set } from "date-fns";

const formSchema = insertScheduleSchema;

type FormValues = z.infer<typeof formSchema>;

const Schedules = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [editScheduleId, setEditScheduleId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const orgId = currentOrganization?.id;

  const { data: physicians } = useQuery<Physician[]>({
    queryKey: ["/api/organizations", orgId, "physicians"],
    enabled: !!orgId,
  });

  const { data: schedules, isLoading: schedulesLoading } = useQuery<Schedule[]>({
    queryKey: ["/api/organizations", orgId, "schedules"],
    enabled: !!orgId,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      organizationId: 0,
      physicianId: 0,
      startTime: new Date(),
      endTime: new Date(),
      title: "",
      description: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (orgId) {
      form.setValue("organizationId", orgId);
    }
  }, [orgId, form]);

  useEffect(() => {
    if (editScheduleId && schedules) {
      const scheduleToEdit = schedules.find((s) => s.id === editScheduleId);
      if (scheduleToEdit) {
        form.reset({
          organizationId: scheduleToEdit.organizationId,
          physicianId: scheduleToEdit.physicianId,
          startTime: new Date(scheduleToEdit.startTime),
          endTime: new Date(scheduleToEdit.endTime),
          title: scheduleToEdit.title,
          description: scheduleToEdit.description || "",
          isActive: scheduleToEdit.isActive,
        });
      }
    }
  }, [editScheduleId, schedules, form]);

  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const response = await apiRequest("POST", "/api/schedules", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", orgId, "schedules"] });
      toast({
        title: "Schedule created",
        description: "The on-call schedule has been created successfully",
      });
      setScheduleDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create schedule: ${error}`,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const response = await apiRequest(
        "PUT",
        `/api/schedules/${editScheduleId}`,
        data
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", orgId, "schedules"] });
      toast({
        title: "Schedule updated",
        description: "The on-call schedule has been updated successfully",
      });
      setScheduleDialogOpen(false);
      setEditScheduleId(null);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update schedule: ${error}`,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/schedules/${id}`, undefined);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", orgId, "schedules"] });
      toast({
        title: "Schedule deleted",
        description: "The on-call schedule has been deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete schedule: ${error}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    if (editScheduleId) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleNewSchedule = () => {
    setEditScheduleId(null);
    form.reset({
      organizationId: orgId || 0,
      physicianId: 0,
      startTime: new Date(),
      endTime: addDays(new Date(), 1),
      title: "",
      description: "",
      isActive: true,
    });
    setScheduleDialogOpen(true);
  };

  const handleEditSchedule = (scheduleId: number) => {
    setEditScheduleId(scheduleId);
    setScheduleDialogOpen(true);
  };

  const handleDeleteSchedule = (scheduleId: number) => {
    if (confirm("Are you sure you want to delete this schedule?")) {
      deleteMutation.mutate(scheduleId);
    }
  };

  // Helper for calendar view
  const getDaysInMonth = (date: Date) => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    return eachDayOfInterval({ start, end });
  };

  const getSchedulesForDay = (day: Date) => {
    if (!schedules) return [];
    return schedules.filter((schedule) => {
      // Handle string or Date objects
      const startTime = schedule.startTime ? 
        (typeof schedule.startTime === 'string' ? parseISO(schedule.startTime) : new Date(schedule.startTime)) 
        : new Date();
      const endTime = schedule.endTime ? 
        (typeof schedule.endTime === 'string' ? parseISO(schedule.endTime) : new Date(schedule.endTime)) 
        : new Date();
      return (
        isSameDay(day, startTime) ||
        (day >= startTime && day <= endTime)
      );
    });
  };

  const getPhysicianName = (physicianId: number) => {
    const physician = physicians?.find((p) => p.id === physicianId);
    return physician ? `Dr. ${physician.firstName} ${physician.lastName}` : "Unknown";
  };

  const formatTimeRange = (startTime: Date | string | null | undefined, endTime: Date | string | null | undefined) => {
    const start = startTime ? new Date(startTime) : new Date();
    const end = endTime ? new Date(endTime) : new Date();
    return `${format(start, "MMM dd, h:mm a")} - ${format(end, "MMM dd, h:mm a")}`;
  };

  const handleCSVExport = () => {
    if (!schedules || schedules.length === 0) {
      toast({
        title: "No schedules to export",
        description: "There are no schedules available to export.",
      });
      return;
    }

    // Create CSV content
    const headers = ["ID", "Physician", "Title", "Start Time", "End Time", "Description", "Status"];
    const rows = schedules.map((schedule) => [
      schedule.id,
      getPhysicianName(schedule.physicianId),
      schedule.title,
      format(new Date(schedule.startTime), "yyyy-MM-dd HH:mm:ss"),
      format(new Date(schedule.endTime), "yyyy-MM-dd HH:mm:ss"),
      schedule.description || "",
      schedule.isActive ? "Active" : "Inactive",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    // Create and download the file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `schedules_export_${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCSVImport = () => {
    toast({
      title: "Import feature",
      description: "The CSV import feature is coming soon.",
    });
  };

  const daysInMonth = getDaysInMonth(selectedDate);

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-neutral-900">On-Call Schedules</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCSVExport}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={handleCSVImport}>
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </Button>
            <Button onClick={handleNewSchedule}>
              <CalendarPlus className="h-4 w-4 mr-2" />
              New Schedule
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Schedule Calendar</CardTitle>
            <CardDescription>
              View and manage on-call physician schedules
            </CardDescription>
            <Tabs
              defaultValue="month"
              className="mt-4"
              value={viewMode}
              onValueChange={(value) => setViewMode(value as "month" | "week" | "day")}
            >
              <TabsList>
                <TabsTrigger value="month">Month</TabsTrigger>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="day">Day</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {schedulesLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : schedules?.length === 0 ? (
              <div className="text-center p-6">
                <p className="text-neutral-500 mb-4">
                  No schedules found. Create your first on-call schedule to get started.
                </p>
                <Button onClick={handleNewSchedule}>
                  <CalendarPlus className="h-4 w-4 mr-2" />
                  Create New Schedule
                </Button>
              </div>
            ) : (
              <div>
                {viewMode === "month" && (
                  <div className="grid grid-cols-7 gap-2">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                      <div
                        key={day}
                        className="text-center font-medium text-sm p-2 bg-neutral-50"
                      >
                        {day}
                      </div>
                    ))}
                    {Array.from({ length: new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1).getDay() }).map((_, i) => (
                      <div key={`empty-${i}`} className="p-2 border border-neutral-200 h-24"></div>
                    ))}
                    {daysInMonth.map((day) => {
                      const daySchedules = getSchedulesForDay(day);
                      return (
                        <div
                          key={day.toString()}
                          className="p-2 border border-neutral-200 h-24 overflow-hidden hover:overflow-auto"
                        >
                          <div className="font-medium text-sm mb-1">
                            {format(day, "d")}
                          </div>
                          {daySchedules.map((schedule) => (
                            <div
                              key={schedule.id}
                              className="text-xs p-1 mb-1 rounded truncate cursor-pointer"
                              style={{
                                backgroundColor: schedule.isActive ? "#E3F2FD" : "#EEEEEE",
                                borderLeft: `3px solid ${schedule.isActive ? "#1976D2" : "#9E9E9E"}`,
                              }}
                              onClick={() => handleEditSchedule(schedule.id)}
                              title={`${schedule.title} - ${getPhysicianName(schedule.physicianId)}`}
                            >
                              {schedule.title}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}

                {viewMode === "week" && (
                  <div className="border border-neutral-200 rounded-md">
                    <div className="grid grid-cols-7 bg-neutral-50">
                      {Array.from({ length: 7 }).map((_, i) => {
                        const day = addDays(
                          new Date(
                            selectedDate.getFullYear(),
                            selectedDate.getMonth(),
                            selectedDate.getDate() - selectedDate.getDay()
                          ),
                          i
                        );
                        return (
                          <div key={i} className="p-2 text-center">
                            <div className="font-medium">{format(day, "EEE")}</div>
                            <div>{format(day, "MMM d")}</div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="divide-y divide-neutral-200">
                      {["Morning (6AM-12PM)", "Afternoon (12PM-6PM)", "Evening (6PM-12AM)", "Night (12AM-6AM)"].map((timeSlot, slotIndex) => (
                        <div key={timeSlot} className="grid grid-cols-7">
                          {Array.from({ length: 7 }).map((_, i) => {
                            const day = addDays(
                              new Date(
                                selectedDate.getFullYear(),
                                selectedDate.getMonth(),
                                selectedDate.getDate() - selectedDate.getDay()
                              ),
                              i
                            );
                            const daySchedules = getSchedulesForDay(day);
                            return (
                              <div key={i} className="p-2 border-r border-neutral-200 min-h-20">
                                <div className="text-xs text-neutral-500 mb-1">{timeSlot}</div>
                                {daySchedules.map((schedule) => (
                                  <div
                                    key={schedule.id}
                                    className="text-xs p-1 mb-1 rounded truncate cursor-pointer"
                                    style={{
                                      backgroundColor: schedule.isActive ? "#E3F2FD" : "#EEEEEE",
                                      borderLeft: `3px solid ${schedule.isActive ? "#1976D2" : "#9E9E9E"}`,
                                    }}
                                    onClick={() => handleEditSchedule(schedule.id)}
                                  >
                                    {schedule.title}
                                    <div className="text-2xs text-neutral-500">
                                      {getPhysicianName(schedule.physicianId)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {viewMode === "day" && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedDate(addDays(selectedDate, -1))}
                      >
                        Previous Day
                      </Button>
                      <h3 className="text-lg font-medium">
                        {format(selectedDate, "EEEE, MMMM d, yyyy")}
                      </h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                      >
                        Next Day
                      </Button>
                    </div>
                    <Separator className="my-4" />
                    <div className="space-y-4">
                      {getSchedulesForDay(selectedDate).length === 0 ? (
                        <div className="text-center p-6 text-neutral-500">
                          No schedules found for this day.
                        </div>
                      ) : (
                        getSchedulesForDay(selectedDate).map((schedule) => (
                          <Card key={schedule.id}>
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="text-lg font-medium">{schedule.title}</h4>
                                  <p className="text-sm text-neutral-500">
                                    {getPhysicianName(schedule.physicianId)}
                                  </p>
                                  <div className="flex items-center mt-2 text-sm text-neutral-600">
                                    <Clock className="h-4 w-4 mr-1" />
                                    {formatTimeRange(schedule.startTime, schedule.endTime)}
                                  </div>
                                  {schedule.description && (
                                    <p className="mt-2 text-sm">{schedule.description}</p>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditSchedule(schedule.id)}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDeleteSchedule(schedule.id)}
                                  >
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Schedule Create/Edit Dialog */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editScheduleId ? "Edit Schedule" : "Create New Schedule"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="physicianId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Physician</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value.toString()}
                      value={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a physician" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {physicians?.map((physician) => (
                          <SelectItem
                            key={physician.id}
                            value={physician.id.toString()}
                          >
                            Dr. {physician.firstName} {physician.lastName} - {physician.specialty}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter schedule title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Time</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className="pl-3 text-left font-normal"
                            >
                              {field.value ? (
                                format(field.value, "PPP h:mm a")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => {
                              if (date) {
                                const hours = field.value.getHours();
                                const minutes = field.value.getMinutes();
                                const newDate = set(date, { hours, minutes });
                                field.onChange(newDate);
                              }
                            }}
                            initialFocus
                          />
                          <div className="p-3 border-t border-neutral-200">
                            <Input
                              type="time"
                              value={format(field.value, "HH:mm")}
                              onChange={(e) => {
                                const [hours, minutes] = e.target.value.split(":").map(Number);
                                const newDate = set(field.value, { hours, minutes });
                                field.onChange(newDate);
                              }}
                            />
                          </div>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>End Time</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className="pl-3 text-left font-normal"
                            >
                              {field.value ? (
                                format(field.value, "PPP h:mm a")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => {
                              if (date) {
                                const hours = field.value.getHours();
                                const minutes = field.value.getMinutes();
                                const newDate = set(date, { hours, minutes });
                                field.onChange(newDate);
                              }
                            }}
                            initialFocus
                          />
                          <div className="p-3 border-t border-neutral-200">
                            <Input
                              type="time"
                              value={format(field.value, "HH:mm")}
                              onChange={(e) => {
                                const [hours, minutes] = e.target.value.split(":").map(Number);
                                const newDate = set(field.value, { hours, minutes });
                                field.onChange(newDate);
                              }}
                            />
                          </div>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field: { value, onChange, ...fieldProps } }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter additional details about this schedule"
                        className="resize-none"
                        value={value || ""}
                        onChange={onChange}
                        {...fieldProps}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Active Schedule</FormLabel>
                      <p className="text-sm text-neutral-500">
                        Inactive schedules will not be displayed in the on-call list
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setScheduleDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editScheduleId ? "Update Schedule" : "Create Schedule"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Schedules;
