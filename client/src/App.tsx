import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "./pages/Dashboard";
import Organizations from "./pages/Organizations";
import OrganizationForm from "./pages/OrganizationForm";
import Physicians from "./pages/Physicians";
import PhysicianForm from "./pages/PhysicianForm";
import Schedules from "./pages/Schedules";
import Requests from "./pages/Requests";
import RequestForm from "./pages/RequestForm";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import AuthPage from "./pages/auth-page";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./contexts/AuthContext";
import { OrganizationProvider } from "./contexts/OrganizationContext";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/organizations" component={Organizations} />
      <ProtectedRoute path="/organizations/new" component={() => <OrganizationForm isNew />} />
      <ProtectedRoute path="/organizations/:id" component={() => <OrganizationForm isNew={false} />} />
      <ProtectedRoute path="/physicians" component={Physicians} />
      <ProtectedRoute path="/physicians/new" component={() => <PhysicianForm isNew />} />
      <ProtectedRoute path="/physicians/:id" component={() => <PhysicianForm isNew={false} />} />
      <ProtectedRoute path="/schedules" component={Schedules} />
      <ProtectedRoute path="/requests" component={Requests} />
      <ProtectedRoute path="/requests/new" component={() => <RequestForm isNew />} />
      <ProtectedRoute path="/requests/:id" component={() => <RequestForm isNew={false} />} />
      <ProtectedRoute path="/reports" component={Reports} />
      <ProtectedRoute path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <OrganizationProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </QueryClientProvider>
      </OrganizationProvider>
    </AuthProvider>
  );
}

export default App;
