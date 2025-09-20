import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useRequireAuth } from "@/hooks/use-auth";
import Layout from "@/components/layout/layout";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Branches from "@/pages/branches";
import Employees from "@/pages/employees";
import Vacations from "@/pages/vacations";
import Terminations from "@/pages/terminations";
import Advances from "@/pages/advances";
import Payroll from "@/pages/payroll";
import Permissions from "@/pages/permissions";
import NotFound from "@/pages/not-found";

function ProtectedRouter() {
  const { isLoading } = useRequireAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/branches" component={Branches} />
        <Route path="/employees" component={Employees} />
        <Route path="/vacations" component={Vacations} />
        <Route path="/terminations" component={Terminations} />
        <Route path="/advances" component={Advances} />
        <Route path="/payroll" component={Payroll} />
        <Route path="/permissions" component={Permissions} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route component={ProtectedRouter} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
