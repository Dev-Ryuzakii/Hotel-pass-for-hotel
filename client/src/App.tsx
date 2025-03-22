import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Settings from "@/pages/settings";
import Wallet from "@/pages/wallet";
import AuthPage from "@/pages/auth";
import ForgotPassword from "@/pages/forgot-password";
import RoomsPage from "@/pages/rooms";
import BookingsPage from "@/pages/bookings";
import Sidebar from "@/components/layout/sidebar";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="*">
        <div className="flex min-h-screen flex-col lg:flex-row">
          <Sidebar />
          <main className="flex-1 overflow-auto bg-background pl-0 lg:pl-60">
            <Switch>
              <ProtectedRoute path="/" component={Dashboard} />
              <ProtectedRoute path="/rooms" component={RoomsPage} />
              <ProtectedRoute path="/bookings" component={BookingsPage} />
              <ProtectedRoute path="/wallet" component={Wallet} />
              <ProtectedRoute path="/settings" component={Settings} />
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;