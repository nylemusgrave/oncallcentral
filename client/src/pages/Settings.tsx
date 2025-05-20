import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  Settings as SettingsIcon,
  Bell,
  ShieldCheck,
  Save,
  Lock,
  User as UserIcon,
  Building,
  Mail,
  Smartphone,
  Loader2
} from "lucide-react";
import { Organization, User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const profileFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
});

const notificationFormSchema = z.object({
  emailNotifications: z.boolean(),
  smsNotifications: z.boolean(),
  newRequestNotifications: z.boolean(),
  statusChangeNotifications: z.boolean(),
  scheduleReminders: z.boolean(),
});

type PasswordFormValues = z.infer<typeof passwordFormSchema>;
type ProfileFormValues = z.infer<typeof profileFormSchema>;
type NotificationFormValues = z.infer<typeof notificationFormSchema>;

const Settings = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const { toast } = useToast();
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();

  const { data: userData, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/users", user?.id],
    enabled: !!user?.id,
  });

  // Mock notification settings since they're not in the schema
  const defaultNotificationSettings = {
    emailNotifications: true,
    smsNotifications: false,
    newRequestNotifications: true,
    statusChangeNotifications: true,
    scheduleReminders: true,
  };

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const notificationForm = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: defaultNotificationSettings,
  });

  // Set form values when user data is loaded
  useEffect(() => {
    if (userData) {
      profileForm.reset({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        phone: "", // Phone isn't in the user schema, but we include it in the form
      });
    }
  }, [userData, profileForm]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      if (!user?.id) throw new Error("User ID is missing");
      
      const response = await apiRequest(
        "PUT",
        `/api/users/${user.id}`,
        data
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id] });
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update profile: ${error}`,
        variant: "destructive",
      });
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async (data: PasswordFormValues) => {
      if (!user?.id) throw new Error("User ID is missing");
      
      // In a real app, you would need an API endpoint for this
      // For our mock, we'll simulate success
      return { success: true };
    },
    onSuccess: () => {
      passwordForm.reset();
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update password: ${error}`,
        variant: "destructive",
      });
    },
  });

  const updateNotificationsMutation = useMutation({
    mutationFn: async (data: NotificationFormValues) => {
      // In a real app, this would communicate with an API
      // For our mock, we'll simulate success
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Notification settings updated",
        description: "Your notification preferences have been saved",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update notification settings: ${error}`,
        variant: "destructive",
      });
    },
  });

  const onProfileSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };

  const onPasswordSubmit = (data: PasswordFormValues) => {
    updatePasswordMutation.mutate(data);
  };

  const onNotificationSubmit = (data: NotificationFormValues) => {
    updateNotificationsMutation.mutate(data);
  };

  return (
    <>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-neutral-900">Settings</h1>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 mt-8">
        <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-64 flex-shrink-0">
              <TabsList className="flex flex-col h-auto space-y-1 bg-transparent p-0">
                <TabsTrigger 
                  value="profile" 
                  className="justify-start px-3 py-2 h-9 font-normal"
                >
                  <UserIcon className="mr-2 h-5 w-5" />
                  User Profile
                </TabsTrigger>
                <TabsTrigger 
                  value="security" 
                  className="justify-start px-3 py-2 h-9 font-normal"
                >
                  <ShieldCheck className="mr-2 h-5 w-5" />
                  Security
                </TabsTrigger>
                <TabsTrigger 
                  value="notifications" 
                  className="justify-start px-3 py-2 h-9 font-normal"
                >
                  <Bell className="mr-2 h-5 w-5" />
                  Notifications
                </TabsTrigger>
                <TabsTrigger 
                  value="organization" 
                  className="justify-start px-3 py-2 h-9 font-normal"
                >
                  <Building className="mr-2 h-5 w-5" />
                  Organization
                </TabsTrigger>
              </TabsList>

              <div className="mt-6 border-t pt-6">
                <div className="px-3">
                  <h3 className="text-sm font-medium text-neutral-500">Current User</h3>
                  <div className="mt-2 flex items-center">
                    <div className="h-10 w-10 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-600">
                      {userData?.firstName?.[0]}{userData?.lastName?.[0]}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-neutral-900">
                        {userData?.firstName} {userData?.lastName}
                      </p>
                      <p className="text-xs text-neutral-500">{userData?.email}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1">
              <TabsContent value="profile" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>
                      Update your personal information and contact details
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {userLoading ? (
                      <div className="flex justify-center items-center h-48">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : (
                      <Form {...profileForm}>
                        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <FormField
                              control={profileForm.control}
                              name="firstName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>First Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Enter your first name" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={profileForm.control}
                              name="lastName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Last Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Enter your last name" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={profileForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <div className="flex">
                                    <Mail className="h-5 w-5 text-neutral-400 mr-2 mt-2.5" />
                                    <Input 
                                      placeholder="Enter your email address" 
                                      type="email" 
                                      {...field} 
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={profileForm.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone Number</FormLabel>
                                <FormControl>
                                  <div className="flex">
                                    <Smartphone className="h-5 w-5 text-neutral-400 mr-2 mt-2.5" />
                                    <Input 
                                      placeholder="Enter your phone number" 
                                      type="tel" 
                                      {...field} 
                                    />
                                  </div>
                                </FormControl>
                                <FormDescription>
                                  Used for SMS notifications and emergency contacts
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="flex justify-end">
                            <Button 
                              type="submit" 
                              disabled={updateProfileMutation.isPending}
                            >
                              {updateProfileMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              )}
                              <Save className="mr-2 h-4 w-4" />
                              Save Changes
                            </Button>
                          </div>
                        </form>
                      </Form>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="security" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Security Settings</CardTitle>
                    <CardDescription>
                      Update your password and security preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...passwordForm}>
                      <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                        <FormField
                          control={passwordForm.control}
                          name="currentPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Current Password</FormLabel>
                              <FormControl>
                                <div className="flex">
                                  <Lock className="h-5 w-5 text-neutral-400 mr-2 mt-2.5" />
                                  <Input 
                                    placeholder="Enter your current password" 
                                    type="password" 
                                    {...field} 
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={passwordForm.control}
                          name="newPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>New Password</FormLabel>
                              <FormControl>
                                <div className="flex">
                                  <Lock className="h-5 w-5 text-neutral-400 mr-2 mt-2.5" />
                                  <Input 
                                    placeholder="Enter your new password" 
                                    type="password" 
                                    {...field} 
                                  />
                                </div>
                              </FormControl>
                              <FormDescription>
                                Password must be at least 8 characters long
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={passwordForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm New Password</FormLabel>
                              <FormControl>
                                <div className="flex">
                                  <Lock className="h-5 w-5 text-neutral-400 mr-2 mt-2.5" />
                                  <Input 
                                    placeholder="Confirm your new password" 
                                    type="password" 
                                    {...field} 
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex justify-end">
                          <Button 
                            type="submit" 
                            disabled={updatePasswordMutation.isPending}
                          >
                            {updatePasswordMutation.isPending && (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            <Save className="mr-2 h-4 w-4" />
                            Update Password
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notifications" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Settings</CardTitle>
                    <CardDescription>
                      Configure how and when you receive notifications
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...notificationForm}>
                      <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)} className="space-y-6">
                        <div className="space-y-4">
                          <h3 className="text-sm font-medium text-neutral-700">
                            Notification Channels
                          </h3>
                          <FormField
                            control={notificationForm.control}
                            name="emailNotifications"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">
                                    Email Notifications
                                  </FormLabel>
                                  <FormDescription>
                                    Receive notifications via email
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={notificationForm.control}
                            name="smsNotifications"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">
                                    SMS Notifications
                                  </FormLabel>
                                  <FormDescription>
                                    Receive notifications via text message
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>

                        <Separator />

                        <div className="space-y-4">
                          <h3 className="text-sm font-medium text-neutral-700">
                            Notification Types
                          </h3>
                          <FormField
                            control={notificationForm.control}
                            name="newRequestNotifications"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">
                                    New On-Call Requests
                                  </FormLabel>
                                  <FormDescription>
                                    Get notified when you're assigned a new on-call request
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={notificationForm.control}
                            name="statusChangeNotifications"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">
                                    Status Changes
                                  </FormLabel>
                                  <FormDescription>
                                    Get notified when the status of your requests changes
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={notificationForm.control}
                            name="scheduleReminders"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">
                                    Schedule Reminders
                                  </FormLabel>
                                  <FormDescription>
                                    Get reminders for upcoming on-call shifts
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="flex justify-end">
                          <Button 
                            type="submit" 
                            disabled={updateNotificationsMutation.isPending}
                          >
                            {updateNotificationsMutation.isPending && (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            <Save className="mr-2 h-4 w-4" />
                            Save Preferences
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="organization" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Organization Settings</CardTitle>
                    <CardDescription>
                      View your current organization information
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!currentOrganization ? (
                      <div className="flex justify-center items-center h-48">
                        <p className="text-neutral-500">
                          No organization information available
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-medium mb-4">{currentOrganization.name}</h3>
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-neutral-500">Address</p>
                              <p className="text-sm">
                                {currentOrganization.address}, {currentOrganization.city}, {currentOrganization.state} {currentOrganization.zip}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-neutral-500">Contact</p>
                              <p className="text-sm">
                                {currentOrganization.phone}
                              </p>
                              <p className="text-sm">
                                {currentOrganization.email}
                              </p>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <h4 className="text-sm font-medium text-neutral-700 mb-2">Billing Codes</h4>
                          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                            {currentOrganization.billingCodes.map((code, index) => (
                              <div key={index} className="bg-neutral-100 rounded-md px-3 py-1.5 text-sm">
                                {code}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="border-t pt-6 flex justify-between">
                    <p className="text-sm text-neutral-500">
                      To update organization settings, please contact an administrator
                    </p>
                    <Button variant="outline" onClick={() => window.location.href = "/organizations"}>
                      <Building className="mr-2 h-4 w-4" />
                      View Organizations
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </div>
    </>
  );
};

export default Settings;
