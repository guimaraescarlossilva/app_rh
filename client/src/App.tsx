import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/layout/layout";
import Dashboard from "@/pages/dashboard";
import Branches from "@/pages/branches";
import Employees from "@/pages/employees";
import Vacations from "@/pages/vacations";
import Terminations from "@/pages/terminations";
import Advances from "@/pages/advances";
import Payroll from "@/pages/payroll";
import Permissions from "@/pages/permissions";
import NotFound from "@/pages/not-found";

function Router() {
  const [location] = useLocation();
  
  // Redirecionar para login se não estiver logado
  if (location === "/" && !localStorage.getItem("isLoggedIn")) {
    window.location.href = "/login";
    return null;
  }

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={() => (
        <Layout>
          <Dashboard />
        </Layout>
      )} />
      <Route path="/branches" component={() => (
        <Layout>
          <Branches />
        </Layout>
      )} />
      <Route path="/employees" component={() => (
        <Layout>
          <Employees />
        </Layout>
      )} />
      <Route path="/vacations" component={() => (
        <Layout>
          <Vacations />
        </Layout>
      )} />
      <Route path="/terminations" component={() => (
        <Layout>
          <Terminations />
        </Layout>
      )} />
      <Route path="/advances" component={() => (
        <Layout>
          <Advances />
        </Layout>
      )} />
      <Route path="/payroll" component={() => (
        <Layout>
          <Payroll />
        </Layout>
      )} />
      <Route path="/permissions" component={() => (
        <Layout>
          <Permissions />
        </Layout>
      )} />
      <Route component={NotFound} />
    </Switch>
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
