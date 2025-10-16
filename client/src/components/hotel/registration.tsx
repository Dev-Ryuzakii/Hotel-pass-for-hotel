import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { registerHotel } from "@/lib/authService";
import { useAuth } from "@/hooks/use-auth";

export default function HotelRegistration() {
  const { hotel } = useAuth();
  const { toast } = useToast();
  const [hotelName, setHotelName] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  const registerMutation = useMutation({
    mutationFn: async (data: { adminId: string; hotelName: string; location: string; description: string }) => {
      return registerHotel(data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Hotel registered successfully",
      });
      setHotelName("");
      setLocation("");
      setDescription("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to register hotel",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsRegistering(false);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hotelName || !location || !description) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (!hotel) {
      toast({
        title: "Error",
        description: "You must be logged in to register a hotel",
        variant: "destructive",
      });
      return;
    }

    setIsRegistering(true);
    
    registerMutation.mutate({
      adminId: hotel.id.toString(),
      hotelName,
      location,
      description
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hotel Registration</CardTitle>
        <CardDescription>Register your hotel with our platform</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="hotelName">Hotel Name *</Label>
            <Input
              id="hotelName"
              value={hotelName}
              onChange={(e) => setHotelName(e.target.value)}
              placeholder="Enter your hotel name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter hotel location"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your hotel"
              className="min-h-[100px]"
            />
          </div>
          
          <Button 
            type="submit" 
            disabled={isRegistering}
            className="w-full"
          >
            {isRegistering ? "Registering..." : "Register Hotel"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}