import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import RoomForm from "@/components/rooms/room-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Pencil, Trash2, MoreVertical, ImageIcon } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Room } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";

export default function Rooms() {
  const { toast } = useToast();
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const { data: rooms, isLoading } = useQuery<Room[]>({
    queryKey: ["/api/hotel/rooms"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/hotel/rooms/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hotel/rooms"] });
      toast({ title: "Room deleted successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting room",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const updateAvailabilityMutation = useMutation({
    mutationFn: async ({ id, count }: { id: number; count: number }) => {
      await apiRequest("PATCH", `/api/hotel/rooms/${id}/availability`, { count });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hotel/rooms"] });
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

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Rooms</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedRoom(null)}>Add Room</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedRoom ? "Edit Room" : "Add New Room"}</DialogTitle>
            </DialogHeader>
            <RoomForm
              room={selectedRoom}
              onSuccess={() => {
                setIsOpen(false);
                setSelectedRoom(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms?.map((room) => (
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
                    <DropdownMenuItem onClick={() => {
                      setSelectedRoom(room);
                      setIsOpen(true);
                    }}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => 
                      updateAvailabilityMutation.mutate({ 
                        id: room.id, 
                        count: 1 
                      })
                    }>
                      Mark Available
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => 
                      updateAvailabilityMutation.mutate({ 
                        id: room.id, 
                        count: -1 
                      })
                    }>
                      Mark Booked
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => deleteMutation.mutate(room.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
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
                  <p className="font-medium">${room.price}</p>
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
    </div>
  );
}