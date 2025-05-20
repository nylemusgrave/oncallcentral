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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, ArrowLeft, Save, Trash2 } from "lucide-react";
import { Physician, insertPhysicianSchema, Organization } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface PhysicianFormProps {
  isNew?: boolean;
}

const formSchema = insertPhysicianSchema.extend({
  credentialsString: z.string().optional(),
  organizationIds: z.array(z.number()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

const specialties = [
  "Cardiology",
  "Dermatology",
  "Emergency Medicine",
  "Endocrinology",
  "Gastroenterology",
  "General Surgery",
  "Hematology",
  "Infectious Disease",
  "Internal Medicine",
  "Nephrology",
  "Neurology",
  "Obstetrics & Gynecology",
  "Oncology",
  "Orthopedic Surgery",
  "Pediatrics",
  "Psychiatry",
  "Pulmonology",
  "Radiology",
  "Rheumatology",
  "Urology",
];

const PhysicianForm = ({ isNew = false }: PhysicianFormProps) => {
  const { id } = useParams();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const physicianId = isNew ? null : Number(id);

  const { data: physician, isLoading: isLoadingPhysician } = useQuery<Physician>({
    queryKey: [`/api/physicians/${physicianId}`],
    enabled: !isNew && !!physicianId,
  });

  const { data: organizations } = useQuery<Organization[]>({
    queryKey: ["/api/organizations"],
  });

  const { data: physicianOrgs } = useQuery<Organization[]>({
    queryKey: [`/api/physicians/${physicianId}/organizations`],
    enabled: !isNew && !!physicianId,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      specialty: "",
      phone: "",
      email: "",
      credentialsString: "",
      organizationIds: [],
    },
  });

  useEffect(() => {
    if (physician && !isNew && physicianOrgs) {
      form.reset({
        firstName: physician.firstName,
        lastName: physician.lastName,
        specialty: physician.specialty,
        phone: physician.phone,
        email: physician.email,
        credentialsString: physician.credentials.join(", "),
        organizationIds: physicianOrgs.map((org) => org.id),
      });
    }
  }, [physician, physicianOrgs, form, isNew]);

  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const { credentialsString, organizationIds, ...rest } = data;
      const credentials = credentialsString
        ? credentialsString.split(",").map((code) => code.trim())
        : [];
      
      const response = await apiRequest(
        "POST",
        "/api/physicians",
        { ...rest, credentials }
      );
      const newPhysician = await response.json();
      
      // Assign to organizations if selected
      if (organizationIds && organizationIds.length > 0) {
        for (const orgId of organizationIds) {
          await apiRequest(
            "POST",
            "/api/organization-physicians",
            { organizationId: orgId, physicianId: newPhysician.id }
          );
        }
      }
      
      return newPhysician;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/physicians"] });
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
      toast({
        title: "Physician created",
        description: "The physician has been created successfully",
      });
      navigate("/physicians");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create physician: ${error}`,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const { credentialsString, organizationIds, ...rest } = data;
      const credentials = credentialsString
        ? credentialsString.split(",").map((code) => code.trim())
        : [];
      
      const response = await apiRequest(
        "PUT",
        `/api/physicians/${physicianId}`,
        { ...rest, credentials }
      );
      const updatedPhysician = await response.json();
      
      // Get current organizations
      const currentOrgs = physicianOrgs || [];
      const currentOrgIds = currentOrgs.map(o => o.id);
      
      // Add new organization assignments
      if (organizationIds) {
        for (const orgId of organizationIds) {
          if (!currentOrgIds.includes(orgId)) {
            await apiRequest(
              "POST",
              "/api/organization-physicians",
              { organizationId: orgId, physicianId: physicianId }
            );
          }
        }
        
        // Remove old organization assignments
        for (const orgId of currentOrgIds) {
          if (!organizationIds.includes(orgId)) {
            await apiRequest(
              "DELETE",
              `/api/organizations/${orgId}/physicians/${physicianId}`,
              undefined
            );
          }
        }
      }
      
      return updatedPhysician;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/physicians"] });
      queryClient.invalidateQueries({ queryKey: [`/api/physicians/${physicianId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/physicians/${physicianId}/organizations`] });
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
      toast({
        title: "Physician updated",
        description: "The physician has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update physician: ${error}`,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        "DELETE",
        `/api/physicians/${physicianId}`,
        undefined
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/physicians"] });
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
      toast({
        title: "Physician deleted",
        description: "The physician has been deleted successfully",
      });
      navigate("/physicians");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete physician: ${error}`,
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

  const handleDelete = () => {
    deleteMutation.mutate();
    setDeleteDialogOpen(false);
  };

  if (isLoadingPhysician && !isNew) {
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
            onClick={() => navigate("/physicians")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-semibold text-neutral-900">
            {isNew ? "Add New Physician" : `Edit Physician: Dr. ${physician?.firstName} ${physician?.lastName}`}
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Physician Information</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter first name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter last name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="specialty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specialty</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a specialty" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {specialties.map((specialty) => (
                            <SelectItem key={specialty} value={specialty}>
                              {specialty}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />
                <h3 className="font-medium">Contact Information</h3>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter email address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />
                <h3 className="font-medium">Credentials and Organizations</h3>

                <FormField
                  control={form.control}
                  name="credentialsString"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Credentials</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter credentials (e.g., MD, PhD, FACC), separated by commas"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="organizationIds"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel>Affiliated Organizations</FormLabel>
                      </div>
                      <div className="space-y-2">
                        {organizations?.map((organization) => (
                          <div className="flex items-center space-x-2" key={organization.id}>
                            <Checkbox
                              id={`organization-${organization.id}`}
                              checked={form.watch("organizationIds")?.includes(organization.id)}
                              onCheckedChange={(checked) => {
                                const currentValues = form.getValues("organizationIds") || [];
                                if (checked) {
                                  form.setValue("organizationIds", [
                                    ...currentValues,
                                    organization.id,
                                  ]);
                                } else {
                                  form.setValue(
                                    "organizationIds",
                                    currentValues.filter((id) => id !== organization.id)
                                  );
                                }
                              }}
                            />
                            <label
                              htmlFor={`organization-${organization.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {organization.name}
                            </label>
                          </div>
                        ))}
                      </div>
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
                          <Trash2 className="mr-2 h-4 w-4" /> Delete Physician
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the
                            physician and all associated data.
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
                      onClick={() => navigate("/physicians")}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                      {(createMutation.isPending || updateMutation.isPending) && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      <Save className="mr-2 h-4 w-4" />
                      {isNew ? "Create Physician" : "Save Changes"}
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default PhysicianForm;
