import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useRequireAuth } from "@/hooks/use-auth";
import Layout from "@/components/layout/layout";
import { Suspense, lazy } from 'react';
import LoadingSpinner from "@/components/ui/loading-spinner";

// Lazy loading de componentes para melhorar performance
const Login = lazy(() => import("@/pages/login"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const Branches = lazy(() => import("@/pages/branches"));
const Employees = lazy(() => import("@/pages/employees"));
const Vacations = lazy(() => import("@/pages/vacations"));
const Terminations = lazy(() => import("@/pages/terminations"));
const Advances = lazy(() => import("@/pages/advances"));
const Payroll = lazy(() => import("@/pages/payroll"));
const Permissions = lazy(() => import("@/pages/permissions"));
const NotFound = lazy(() => import("@/pages/not-found"));

function ProtectedRouter() {
  const { isLoading } = useRequireAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <Layout>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="md" />
        </div>
      }>
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
      </Suspense>
    </Layout>
  );
}

function Router() {
  // Integração do hook de prefetch para melhorar navegação
  const { usePrefetch } = require('./hooks/use-prefetch');
  usePrefetch();
  
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
          <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
              <LoadingSpinner size="lg" />
            </div>
          }>
            <Router />
          </Suspense>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
