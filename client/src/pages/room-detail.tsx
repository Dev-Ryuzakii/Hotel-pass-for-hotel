import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Room } from "@shared/schema";
import Navbar from "@/components/layout/navbar";

export default function RoomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();

  const { data: room, isLoading, error } = useQuery<Room>({
    queryKey: [`/api/hotel/properties/${id}`],
    queryFn: async () => {
      // Check if id is valid before making the request
      if (!id || id === 'undefined') {
        throw new Error('Invalid room ID');
      }
      const response = await apiRequest("GET", `/api/hotel/properties/${id}`);
      return response.json();
    },
    enabled: !!(id && id !== 'undefined'),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    // Check if it's an invalid ID error
    const errorMessage = (error as Error)?.message || "Failed to load room details. Please try again.";
    const isInvalidId = !id || id === 'undefined' || errorMessage.includes('Invalid room ID');
    
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold">{isInvalidId ? "Invalid Room ID" : "Error loading room"}</h2>
          <p className="text-muted-foreground">
            {isInvalidId 
              ? "The room ID is invalid or missing. Please go back and select a valid room." 
              : errorMessage}
          </p>
          <Button onClick={() => setLocation("/rooms")} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Rooms
          </Button>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Room not found</h2>
          <p className="text-muted-foreground">The requested room could not be found.</p>
          <Button onClick={() => setLocation("/rooms")} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Rooms
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => setLocation("/rooms")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Rooms
          </Button>
          <Button onClick={() => setLocation(`/rooms/edit/${id}`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Room
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Room Images */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{room.name}</CardTitle>
              </CardHeader>
              <CardContent>
                {room.images && room.images.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {room.images.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`${room.name} - Image ${index + 1}`}
                        className="w-full h-64 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
                    <span className="text-muted-foreground">No images available</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Room Details */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Room Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold">Description</h3>
                  <p className="text-muted-foreground">{room.description}</p>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold">Price</h3>
                    <p className="text-2xl font-bold text-primary">₦{room.price.toLocaleString()}/night</p>
                  </div>
                  <div>
                    <h3 className="font-semibold">Type</h3>
                    <Badge variant="secondary">{room.type}</Badge>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold">Capacity</h3>
                    <p>{room.capacity} persons</p>
                  </div>
                  <div>
                    <h3 className="font-semibold">Availability</h3>
                    <p>{room.availableRooms}/{room.totalRooms} rooms</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-2">Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    {room.amenities && room.amenities.length > 0 ? (
                      room.amenities.map((amenity, index) => (
                        <Badge key={index} variant="outline">
                          {amenity}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-muted-foreground">No amenities listed</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}