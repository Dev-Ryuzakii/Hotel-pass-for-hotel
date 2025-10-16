import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import {
  Check,
  X,
  Calendar,
  Users,
  Clock,
  Home,
  BadgeCheck,
  XCircle,
  Clock4,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import Navbar from "@/components/layout/navbar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

type BookingStatus = "pending" | "approved" | "rejected" | "completed";

interface Booking {
  id: number;
  roomId: number;
  roomName: string;
  guestName: string;
  guestEmail: string;
  checkIn: string;
  checkOut: string;
  numberOfGuests: number;
  totalPrice: number;
  status: BookingStatus;
  createdAt: string;
}

export default function BookingsPage() {
  const { toast } = useToast();
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<BookingStatus>("pending");
  const [filterStatus, setFilterStatus] = useState<BookingStatus | "all">("all");

  const { data: bookings = [], isLoading } = useQuery<Booking[]>({
    queryKey: ["/api/hotel/bookings"],
  });

  const updateBookingMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: BookingStatus }) => {
      return apiRequest("PATCH", "/api/hotel/bookings/status", { bookingId: id.toString(), status: status.toUpperCase() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hotel/bookings"] });
      toast({
        title: "Success",
        description: "Booking status updated successfully",
        variant: "default",
      });
      setStatusDialogOpen(false);
      setSelectedBooking(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating booking",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleStatusUpdate = (booking: Booking, status: BookingStatus) => {
    setSelectedBooking(booking);
    setSelectedStatus(status);
    setStatusDialogOpen(true);
  };

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500";
      case "approved":
        return "bg-green-500";
      case "rejected":
        return "bg-red-500";
      case "completed":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusIcon = (status: BookingStatus) => {
    switch (status) {
      case "pending":
        return <Clock4 className="h-4 w-4" />;
      case "approved":
        return <BadgeCheck className="h-4 w-4" />;
      case "rejected":
        return <XCircle className="h-4 w-4" />;
      case "completed":
        return <Check className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const filteredBookings = bookings.filter(
    (booking) => filterStatus === "all" || booking.status === filterStatus
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="bg-gray-100/80 min-h-screen p-8">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Bookings Management</h1>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Filter by status:</span>
              <Select
                value={filterStatus}
                onValueChange={(value) => setFilterStatus(value as BookingStatus | "all")}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Bookings</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant={filterStatus === "all" ? "default" : "outline"}
                  onClick={() => setFilterStatus("all")}
                  size="sm"
                >
                  All
                </Button>
                <Button
                  variant={filterStatus === "pending" ? "default" : "outline"}
                  onClick={() => setFilterStatus("pending")}
                  size="sm"
                >
                  Pending
                </Button>
                <Button
                  variant={filterStatus === "approved" ? "default" : "outline"}
                  onClick={() => setFilterStatus("approved")}
                  size="sm"
                >
                  Approved
                </Button>
                <Button
                  variant={filterStatus === "rejected" ? "default" : "outline"}
                  onClick={() => setFilterStatus("rejected")}
                  size="sm"
                >
                  Rejected
                </Button>
                <Button
                  variant={filterStatus === "completed" ? "default" : "outline"}
                  onClick={() => setFilterStatus("completed")}
                  size="sm"
                >
                  Completed
                </Button>
              </div>
            </div>

            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {filteredBookings.map((booking) => (
                <Card key={booking.id} className="overflow-hidden">
                  <CardHeader className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-2 w-2 rounded-full ${
                            booking.status === "pending"
                              ? "bg-yellow-500"
                              : booking.status === "approved"
                              ? "bg-green-500"
                              : booking.status === "rejected"
                              ? "bg-red-500"
                              : "bg-blue-500"
                          }`}
                        />
                        <span className="text-sm font-medium capitalize">
                          {booking.status}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(booking.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Guest</span>
                        <span className="text-sm">{booking.guestName}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Room</span>
                        <span className="text-sm">{booking.roomName}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Check-in</span>
                        <span className="text-sm">
                          {new Date(booking.checkIn).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Check-out</span>
                        <span className="text-sm">
                          {new Date(booking.checkOut).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Total</span>
                        <span className="text-sm font-medium">
                          ${booking.totalPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-3">
                    <div className="flex w-full items-center justify-end gap-2">
                      {booking.status === "pending" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusUpdate(booking, "rejected")}
                          >
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(booking, "approved")}
                          >
                            Approve
                          </Button>
                        </>
                      )}
                      {booking.status === "approved" && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusUpdate(booking, "completed")}
                        >
                          Complete
                        </Button>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>

          {filteredBookings.length === 0 && (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">No bookings found</p>
            </div>
          )}

          <AlertDialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Status Update</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to mark this booking as{" "}
                  {selectedStatus.toLowerCase()}? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() =>
                    selectedBooking &&
                    updateBookingMutation.mutate({
                      id: selectedBooking.id,
                      status: selectedStatus,
                    })
                  }
                  className={
                    selectedStatus === "rejected"
                      ? "bg-red-500 hover:bg-red-600"
                      : undefined
                  }
                >
                  Confirm
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </main>
    </>
  );
} 