import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ImageIcon, MoreVertical } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Room } from "@shared/schema";

interface RoomStatusProps {
  rooms: Room[];
}

export default function RoomStatus({ rooms }: RoomStatusProps) {
  const { toast } = useToast();

  const updateAvailabilityMutation = useMutation({
    mutationFn: async ({ id, count }: { id: number; count: number }) => {
      await apiRequest("PATCH", `/api/hotel/properties/${id}/availability`, { count });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hotel/properties"] });
      toast({ title: "Room availability updated" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating availability",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {rooms.map((room) => (
        <Card key={room.id} className="relative">
          {room.images.length > 0 && (
            <img
              src={room.images[0]}
              alt={room.name}
              className="w-full h-48 object-cover rounded-t-lg"
            />
          )}
          {!room.images.length && (
            <div className="w-full h-48 bg-muted flex items-center justify-center rounded-t-lg">
              <ImageIcon className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
          <CardHeader className="pt-4">
            <div className="flex justify-between items-start">
              <CardTitle className="text-xl">{room.name}</CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => updateAvailabilityMutation.mutate({ id: room.id, count: 1 })}
                  >
                    Mark Available
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => updateAvailabilityMutation.mutate({ id: room.id, count: -1 })}
                  >
                    Mark Booked
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-muted-foreground">Type</p>
                <p className="font-medium">{room.type}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Price</p>
                <p className="font-medium">₦{room.price.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Capacity</p>
                <p className="font-medium">{room.capacity} persons</p>
              </div>
              <div>
                <p className="text-muted-foreground">Availability</p>
                <p className="font-medium">{room.availableRooms}/{room.totalRooms}</p>
              </div>
            </div>
            <div className="mt-2">
              <Badge variant={room.availableRooms > 0 ? "default" : "destructive"}>
                {room.availableRooms > 0 ? "Available" : "Fully Booked"}
              </Badge>
            </div>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-muted-foreground line-clamp-2">{room.description}</p>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}