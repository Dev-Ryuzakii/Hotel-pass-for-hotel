import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Settings from "@/pages/settings";
import AuthPage from "@/pages/auth";
import Sidebar from "@/components/layout/sidebar";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="*">
        <div className="flex h-screen">
          <Sidebar />
          {/* Add pl-0 lg:pl-72 to offset main content from sidebar */}
          <main className="flex-1 overflow-auto bg-background pl-0 lg:pl-72">
            <Switch>
              <ProtectedRoute path="/" component={Dashboard} />
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