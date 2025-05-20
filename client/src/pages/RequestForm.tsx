import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, ArrowLeft, Save, Trash2, CheckCircle, Clock, XCircle, Stethoscope, CircleCheck } from "lucide-react";
import { Request, insertRequestSchema, Physician } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useOrganization } from "@/contexts/OrganizationContext";
import { formatDistanceToNow, format } from "date-fns";

interface RequestFormProps {
  isNew?: boolean;
}

const formSchema = insertRequestSchema.extend({
  note: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

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

export const RequestForm = ({ isNew = false }: RequestFormProps) => {
  const { id } = useParams();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string | null>(null);

  const orgId = currentOrganization?.id;
  const requestId = isNew ? null : Number(id);

  const { data: request, isLoading: requestLoading } = useQuery<Request>({
    queryKey: [`/api/requests/${requestId}`],
    enabled: !isNew && !!requestId,
  });

  const { data: physicians } = useQuery<Physician[]>({
    queryKey: ["/api/organizations", orgId, "physicians"],
    enabled: !!orgId,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      organizationId: orgId || 0,
      physicianId: 0,
      patientName: "",
      patientMRN: "",
      diagnosis: "",
      location: "",
      notes: "",
      status: "pending",
      priority: "normal",
      note: "",
    },
  });

  useEffect(() => {
    if (orgId) {
      form.setValue("organizationId", orgId);
    }
  }, [orgId, form]);

  useEffect(() => {
    if (request && !isNew) {
      form.reset({
        organizationId: request.organizationId,
        physicianId: request.physicianId,
        patientName: request.patientName,
        patientMRN: request.patientMRN,
        diagnosis: request.diagnosis,
        location: request.location,
        notes: request.notes || "",
        status: request.status,
        priority: request.priority,
        note: "",
      });
    }
  }, [request, form, isNew]);

  const getPhysicianName = (physicianId: number) => {
    const physician = physicians?.find((p) => p.id === physicianId);
    return physician
      ? `Dr. ${physician.firstName} ${physician.lastName}`
      : "Unknown Physician";
  };

  const formatTime = (timestamp: Date) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const { note, ...requestData } = data;
      const response = await apiRequest("POST", "/api/requests", requestData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", orgId, "requests"] });
      toast({
        title: "Request created",
        description: "The on-call request has been created successfully",
      });
      navigate("/requests");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create request: ${error}`,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const { note, ...requestData } = data;
      const response = await apiRequest(
        "PUT",
        `/api/requests/${requestId}`,
        requestData
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      queryClient.invalidateQueries({ queryKey: [`/api/requests/${requestId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", orgId, "requests"] });
      toast({
        title: "Request updated",
        description: "The on-call request has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update request: ${error}`,
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ status, note }: { status: string; note?: string }) => {
      const response = await apiRequest(
        "PUT",
        `/api/requests/${requestId}/status`,
        { status, note }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      queryClient.invalidateQueries({ queryKey: [`/api/requests/${requestId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", orgId, "requests"] });
      toast({
        title: "Status updated",
        description: `The request status has been updated to ${getStatusLabel(newStatus || "")}.`,
      });
      setStatusDialogOpen(false);
      setNewStatus(null);
      form.setValue("note", "");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update status: ${error}`,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        "DELETE",
        `/api/requests/${requestId}`,
        undefined
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", orgId, "requests"] });
      toast({
        title: "Request deleted",
        description: "The on-call request has been deleted successfully",
      });
      navigate("/requests");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete request: ${error}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    if (isNew) {
      createMutation.mutate(data);
    } else {
      updateMutation.mutate(data);
    }
  };

  const handleUpdateStatus = () => {
    if (!newStatus) return;
    
    updateStatusMutation.mutate({
      status: newStatus,
      note: form.getValues("note"),
    });
  };

  const handleDelete = () => {
    deleteMutation.mutate();
    setDeleteDialogOpen(false);
  };

  const openStatusDialog = (status: string) => {
    setNewStatus(status);
    setStatusDialogOpen(true);
  };

  if (requestLoading && !isNew) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/requests")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-semibold text-neutral-900">
            {isNew ? "Create New Request" : `Request: ${request?.patientName}`}
          </h1>
          {!isNew && (
            <Badge className={getStatusBadgeStyles(request?.status || "")}>
              {getStatusLabel(request?.status || "")}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>{isNew ? "New On-Call Request" : "Request Details"}</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <h3 className="font-medium">Patient Information</h3>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="patientName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Patient Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter patient name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="patientMRN"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Medical Record Number (MRN)</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter MRN" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="diagnosis"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Diagnosis</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter diagnosis" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter patient location" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator />
                    <h3 className="font-medium">Request Details</h3>

                    <FormField
                      control={form.control}
                      name="physicianId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Assign to Physician</FormLabel>
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
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select priority" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="normal">Normal</SelectItem>
                              <SelectItem value="urgent">Urgent</SelectItem>
                              <SelectItem value="emergency">Emergency</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Notes</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter any additional information"
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-between pt-6">
                      {!isNew && (
                        <AlertDialog
                          open={deleteDialogOpen}
                          onOpenChange={setDeleteDialogOpen}
                        >
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" type="button">
                              <Trash2 className="mr-2 h-4 w-4" /> Delete Request
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the
                                request and all associated data.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={handleDelete}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                      <div className="flex justify-end flex-1 gap-2">
                        <Button
                          variant="outline"
                          type="button"
                          onClick={() => navigate("/requests")}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                          {(createMutation.isPending || updateMutation.isPending) && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          <Save className="mr-2 h-4 w-4" />
                          {isNew ? "Create Request" : "Save Changes"}
                        </Button>
                      </div>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {!isNew && (
            <div>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {request?.status === "pending" && (
                      <>
                        <Button
                          className="w-full justify-start"
                          onClick={() => openStatusDialog("accepted")}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Accept Request
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => openStatusDialog("declined")}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Decline Request
                        </Button>
                      </>
                    )}
                    {request?.status === "accepted" && (
                      <Button
                        className="w-full justify-start"
                        onClick={() => openStatusDialog("in_progress")}
                      >
                        <Stethoscope className="mr-2 h-4 w-4" />
                        Start In Progress
                      </Button>
                    )}
                    {request?.status === "in_progress" && (
                      <Button
                        className="w-full justify-start"
                        onClick={() => openStatusDialog("completed")}
                      >
                        <CircleCheck className="mr-2 h-4 w-4" />
                        Mark as Completed
                      </Button>
                    )}
                    {["pending", "accepted", "in_progress"].includes(request?.status || "") && (
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => openStatusDialog("cancelled")}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Cancel Request
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Request History</CardTitle>
                </CardHeader>
                <CardContent className="max-h-80 overflow-y-auto">
                  {request?.statusHistory?.length ? (
                    <div className="space-y-4">
                      {request.statusHistory.map((entry, index) => (
                        <div
                          key={index}
                          className="border-l-2 border-primary pl-4 py-1 relative"
                        >
                          <div className="absolute w-3 h-3 bg-primary rounded-full -left-[7px] top-2"></div>
                          <div className="font-medium">
                            Status changed to {getStatusLabel(entry.status)}
                          </div>
                          <div className="text-sm text-neutral-500">
                            {format(new Date(entry.timestamp), "PPP 'at' p")}
                          </div>
                          {entry.note && (
                            <div className="mt-2 text-sm bg-neutral-50 p-2 rounded">
                              {entry.note}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-neutral-500 text-center py-4">
                      No history available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Status Update Dialog */}
      <AlertDialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Update Request Status to {getStatusLabel(newStatus || "")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will update the status of the request and notify the assigned physician.
              You can add an optional note below.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <Form {...form}>
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional information about this status change"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Form>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUpdateStatus}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Update Status
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default RequestForm;
