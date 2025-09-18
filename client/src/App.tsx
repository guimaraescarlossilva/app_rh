import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/layout/layout";
import Dashboard from "@/pages/dashboard";
import Employees from "@/pages/employees";
import Vacations from "@/pages/vacations";
import Terminations from "@/pages/terminations";
import Advances from "@/pages/advances";
import Payroll from "@/pages/payroll";
import Permissions from "@/pages/permissions";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
