import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Banknote, Users, TrendingUp, ArrowUpRight, ArrowDownRight, Percent } from "lucide-react";
import type { Room } from "@shared/schema";
import { cn } from "@/lib/utils";

interface StatsCardsProps {
  rooms: Room[];
  bookings: {
    id: string;
    price: number;
    createdAt: Date;
    status: "pending" | "confirmed" | "cancelled";
  }[];
}

export default function StatsCards({ rooms, bookings }: StatsCardsProps) {
  // Calculate total rooms and availability
  const totalRooms = rooms.reduce((acc, room) => acc + room.totalRooms, 0);
  const availableRooms = rooms.reduce((acc, room) => acc + room.availableRooms, 0);
  const bookedRooms = totalRooms - availableRooms;
  const occupancyRate = totalRooms ? (bookedRooms / totalRooms) * 100 : 0;

  // Calculate revenue
  const totalRevenue = bookings
    .filter(booking => booking.status === "confirmed")
    .reduce((acc, booking) => acc + booking.price, 0);

  // Calculate average price
  const averagePrice = rooms.length > 0
    ? rooms.reduce((acc, room) => acc + room.price, 0) / rooms.length
    : 0;

  // Calculate booking rate (confirmed bookings / total bookings)
  const totalBookings = bookings.length;
  const confirmedBookings = bookings.filter(b => b.status === "confirmed").length;
  const bookingRate = totalBookings > 0 ? (confirmedBookings / totalBookings) * 100 : 0;

  // Calculate trends (comparing with previous period)
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const currentMonthRevenue = bookings
    .filter(b => b.status === "confirmed" && new Date(b.createdAt) >= lastMonth)
    .reduce((acc, b) => acc + b.price, 0);

  const lastMonthRevenue = bookings
    .filter(b => b.status === "confirmed" && new Date(b.createdAt) < lastMonth && new Date(b.createdAt) >= new Date(lastMonth.getFullYear(), lastMonth.getMonth() - 1))
    .reduce((acc, b) => acc + b.price, 0);

  const revenueTrend = lastMonthRevenue > 0
    ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
    : 0;

  const currentWeekBookings = bookings.filter(b => new Date(b.createdAt) >= lastWeek).length;
  const lastWeekBookings = bookings.filter(b => new Date(b.createdAt) < lastWeek && new Date(b.createdAt) >= new Date(lastWeek.getTime() - 7 * 24 * 60 * 60 * 1000)).length;

  const bookingsTrend = lastWeekBookings > 0
    ? ((currentWeekBookings - lastWeekBookings) / lastWeekBookings) * 100
    : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="h-[180px]">
        <CardHeader className="flex flex-row justify-between space-y-0 pb-1">
          <CardTitle className="text-base font-medium">Revenue</CardTitle>
          <Banknote className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="flex flex-col items-start justify-center space-y-2 pt-0">
          <div className="text-3xl font-bold">₦{totalRevenue.toLocaleString()}</div>
          <div className={cn("flex items-center gap-1 text-sm",
            revenueTrend >= 0 ? "text-green-600" : "text-red-600")}>
            {revenueTrend >= 0 ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
            <span>{Math.abs(revenueTrend).toFixed(1)}% from last month</span>
          </div>
        </CardContent>
      </Card>

      <Card className="h-[180px]">
        <CardHeader className="flex flex-row justify-between space-y-0 pb-1">
          <CardTitle className="text-base font-medium">Booked Rooms</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="flex flex-col items-start justify-center space-y-2 pt-0">
          <div className="text-3xl font-bold">{bookedRooms}</div>
          <div className={cn("flex items-center gap-1 text-sm",
            bookingsTrend >= 0 ? "text-green-600" : "text-red-600")}>
            {bookingsTrend >= 0 ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
            <span>{Math.abs(bookingsTrend).toFixed(1)}% from last week</span>
          </div>
        </CardContent>
      </Card>

      <Card className="h-[180px]">
        <CardHeader className="flex flex-row justify-between space-y-0 pb-1">
          <CardTitle className="text-base font-medium">Average Price</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="flex flex-col items-start justify-center space-y-2 pt-0">
          <div className="text-3xl font-bold">₦{averagePrice.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">
            Per room per night
          </div>
        </CardContent>
      </Card>

      <Card className="h-[180px]">
        <CardHeader className="flex flex-row justify-between space-y-0 pb-1">
          <CardTitle className="text-base font-medium">Occupancy Rate</CardTitle>
          <Percent className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="flex flex-col items-start justify-center space-y-2 pt-0">
          <div className="text-3xl font-bold">{occupancyRate.toFixed(1)}%</div>
          <div className="text-sm text-muted-foreground">
            {bookedRooms} of {totalRooms} rooms booked
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
