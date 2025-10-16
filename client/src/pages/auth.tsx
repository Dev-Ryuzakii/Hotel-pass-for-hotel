import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import LoginForm from "@/components/auth/login-form";
import RegisterForm from "@/components/auth/register-form";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { hotel, token } = useAuth();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (hotel || token) {
      setLocation("/dashboard");
    }
  }, [hotel, token, setLocation]);

  return (
    <div className="min-h-screen flex">
      {/* Form Section */}
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-3xl font-bold">Welcome</CardTitle>
            <CardDescription>
              Manage your hotel and rooms efficiently
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <LoginForm />
              </TabsContent>
              <TabsContent value="register">
                <RegisterForm />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Hero Section */}
      <div className="hidden lg:flex flex-1 bg-muted items-center justify-center p-8">
        <div className="max-w-md space-y-6 text-center">
          <h1 className="text-4xl font-bold tracking-tight">
            Hotel Room Management System
          </h1>
          <p className="text-muted-foreground">
            Efficiently manage your hotel rooms, track availability, and handle bookings all in one place.
            Join our platform to streamline your hotel operations.
          </p>
        </div>
      </div>
    </div>
  );
}