import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { authApi } from "@/lib/queryClient";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  hotelName: z.string().min(1, "Hotel name is required"),
  location: z.string().min(1, "Location is required"),
  description: z.string().min(1, "Description is required"),
});

type RegisterValues = z.infer<typeof registerSchema>;

export default function RegisterForm() {
  const { toast } = useToast();
  const { registerMutation } = useAuth();
  const [, setLocation] = useLocation();
  
  // Hotel registration mutation
  const hotelRegisterMutation = useMutation({
    mutationFn: async (data: { adminId: string; hotelName: string; location: string; description: string }) => {
      return authApi.registerHotel(data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Hotel registered successfully",
      });
      // Redirect to dashboard after successful registration
      setLocation("/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to register hotel",
        variant: "destructive",
      });
    },
  });
  
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      hotelName: "",
      location: "",
      description: "",
    },
  });
  
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (data) => {
          // First, register the user
          try {
            const userData = {
              username: data.email.split('@')[0], // Use email prefix as username
              email: data.email,
              password: data.password,
            };
            
            const userResponse = await registerMutation.mutateAsync(userData);
            
            // After successful user registration, register the hotel
            if (userResponse && userResponse.user && userResponse.user.id) {
              const hotelData = {
                adminId: userResponse.user.id.toString(),
                hotelName: data.hotelName,
                location: data.location,
                description: data.description
              };
              
              await hotelRegisterMutation.mutateAsync(hotelData);
            } else {
              // If hotel registration fails, still redirect to dashboard
              setLocation("/dashboard");
            }
          } catch (error) {
            console.error("Registration error:", error);
          }
        })}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input type={showPassword ? "text" : "password"} {...field} />
                </FormControl>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  <span className="sr-only">
                    {showPassword ? "Hide password" : "Show password"}
                  </span>
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="hotelName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hotel Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} className="min-h-[100px]" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="w-full"
          disabled={registerMutation.isPending || hotelRegisterMutation.isPending}
        >
          {(registerMutation.isPending || hotelRegisterMutation.isPending) ? "Creating account..." : "Create Account"}
        </Button>
      </form>
    </Form>
  );
}