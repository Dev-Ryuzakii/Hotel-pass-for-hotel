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
import RoomForm from "@/components/rooms/room-form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil, Trash2 } from "lucide-react";
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

      {/* Mobile view: Cards */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {rooms?.map((room) => (
          <Card key={room.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{room.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Type</span>
                <span>{room.type}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Price</span>
                <span>${room.price}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Capacity</span>
                <span>{room.capacity} persons</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Available/Total</span>
                <span>{room.availableRooms}/{room.totalRooms}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={room.availableRooms > 0 ? "default" : "destructive"}>
                  {room.availableRooms > 0 ? "Available" : "Fully Booked"}
                </Badge>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSelectedRoom(room);
                    setIsOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteMutation.mutate(room.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop view: Table */}
      <div className="hidden md:block">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Available/Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rooms?.map((room) => (
                <TableRow key={room.id}>
                  <TableCell className="font-medium">{room.name}</TableCell>
                  <TableCell>{room.type}</TableCell>
                  <TableCell>${room.price}</TableCell>
                  <TableCell>{room.capacity} persons</TableCell>
                  <TableCell>
                    {room.availableRooms}/{room.totalRooms}
                  </TableCell>
                  <TableCell>
                    <Badge variant={room.availableRooms > 0 ? "default" : "destructive"}>
                      {room.availableRooms > 0 ? "Available" : "Fully Booked"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedRoom(room);
                          setIsOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(room.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}