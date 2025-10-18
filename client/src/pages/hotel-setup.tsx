import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Navbar from "@/components/layout/navbar";

export default function HotelSetupPage() {
  const { toast } = useToast();
  const { user, token } = useAuth();
  const [, setLocation] = useLocation();
  const [hotelName, setHotelName] = useState("");
  const [location, setHotelLocation] = useState("");
  const [description, setDescription] = useState("");

  // Decode JWT to get user ID
  const getUserIdFromToken = () => {
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.id;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  const registerMutation = useMutation({
    mutationFn: async (data: { 
      adminId: string; 
      hotelName: string; 
      location: string; 
      description: string 
    }) => {
      const res = await apiRequest("POST", "/api/auth/register-hotel", data);
      return res.json();
    },
    onSuccess: (data) => {
      // If backend returns a new token with updated role, use it!
      if (data?.token) {
        localStorage.setItem("token", data.token);
        if (data?.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
        }
        queryClient.invalidateQueries({ queryKey: ["/api/hotel"] });
        
        toast({
          title: "Success!",
          description: "Hotel registered! Your permissions have been updated.",
          duration: 3000,
        });
        
        // Redirect to dashboard with new permissions
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1500);
      } else {
        // Fallback: old backend without token return
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        queryClient.clear();
        
        toast({
          title: "Success!",
          description: "Hotel registered! Please login again to get updated permissions.",
          duration: 3000,
        });
        
        setTimeout(() => {
          window.location.href = "/";
        }, 1500);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to register hotel",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hotelName || !location || !description) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const userId = getUserIdFromToken() || user?.id;
    
    if (!userId) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to register a hotel. Please logout and login again.",
        variant: "destructive",
      });
      return;
    }

    registerMutation.mutate({
      adminId: userId.toString(),
      hotelName,
      location,
      description
    });
  };

  return (
    <>
      <Navbar />
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        {/* Debug info - remove after testing */}
        {token && (
          <Card className="mb-4 bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-blue-800">
                    <strong>Debug Info:</strong><br />
                    Logged in: {token ? "Yes" : "No"}<br />
                    User ID: {getUserIdFromToken() || "Not found"}<br />
                    User Object ID: {user?.id || "Not available"}<br />
                    <strong className="text-red-600">
                      Current Role: {(() => {
                        try {
                          const payload = JSON.parse(atob(token.split('.')[1]));
                          return payload.role;
                        } catch {
                          return "Unknown";
                        }
                      })()}
                    </strong>
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    localStorage.clear();
                    queryClient.clear();
                    window.location.href = "/";
                  }}
                >
                  Force Logout & Refresh
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle>Complete Hotel Setup</CardTitle>
            <CardDescription>
              Register your hotel to upgrade from GUEST to HOTEL_OWNER and unlock all features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hotelName">Hotel Name *</Label>
                <Input
                  id="hotelName"
                  value={hotelName}
                  onChange={(e) => setHotelName(e.target.value)}
                  placeholder="e.g., Grand Hotel & Suites"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setHotelLocation(e.target.value)}
                  placeholder="e.g., Lagos, Nigeria"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your hotel and its unique features..."
                  className="min-h-[120px]"
                  required
                />
              </div>

              <div className="bg-muted p-4 rounded-md">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> After registration, you'll be logged out automatically. 
                  Please login again to receive your HOTEL_OWNER permissions.
                </p>
              </div>
              
              <Button 
                type="submit" 
                disabled={registerMutation.isPending}
                className="w-full"
              >
                {registerMutation.isPending ? "Registering Hotel..." : "Register Hotel"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
