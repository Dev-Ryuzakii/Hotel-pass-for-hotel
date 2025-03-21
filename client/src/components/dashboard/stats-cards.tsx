import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Banknote, Users, TrendingUp, ArrowUpRight, ArrowDownRight, Percent } from "lucide-react";
import type { Room } from "@shared/schema";
import { cn } from "@/lib/utils";

interface StatsCardsProps {
  rooms: Room[];
}

export default function StatsCards({ rooms }: StatsCardsProps) {
  //  const totalRooms = rooms.reduce((acc, room) => acc + room.totalRooms, 0);
  // const availableRooms = rooms.reduce((acc, room) => acc + room.availableRooms, 0);
  // const occupancyRate = totalRooms ? ((totalRooms - availableRooms) / totalRooms) * 100 : 0;
  // const averagePrice = rooms.reduce((acc, room) => acc + room.price, 0) / rooms.length || 0;
  // Dummy data with trends
  const revenue = {
    value: 2450000,
    trend: 12.5,
    isPositive: true
  };
  const bookings = {
    value: 85,
    trend: 8.2,
    isPositive: true
  };
  const avgPrice = {
    value: 45000,
    trend: -2.4,
    isPositive: false
  };
  const retention = {
    value: 92.8,
    trend: 4.1,
    isPositive: true
  };

  return (
    <div className="grid gap-1 md:grid-cols-2 lg:grid-cols-4">
      <Card className="h-[180px] w-[350px]">
        <CardHeader className="flex flex-row justify-between space-y-0 pb-1">
          <CardTitle className="text-base font-medium">Revenue</CardTitle>
          <Banknote className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="flex flex-col items-start justify-center space-y-2 pt-0">
          <div className="text-3xl font-bold">₦{revenue.value.toLocaleString()}</div>
          <div className={cn("flex items-center gap-1 text-sm",
            revenue.isPositive ? "text-green-600" : "text-red-600")}>
            {revenue.isPositive ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
            <span>{Math.abs(revenue.trend)}% from last month</span>
          </div>
        </CardContent>
      </Card>

      <Card className="h-[180px] w-[350px]">
        <CardHeader className="flex flex-row justify-between space-y-0 pb-1">
          <CardTitle className="text-base font-medium">Booked Rooms</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="flex flex-col items-start justify-center space-y-2 pt-0">
          <div className="text-3xl font-bold">{bookings.value}</div>
          <div className={cn("flex items-center gap-1 text-sm",
            bookings.isPositive ? "text-green-600" : "text-red-600")}>
            {bookings.isPositive ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
            <span>{Math.abs(bookings.trend)}% from last week</span>
          </div>
        </CardContent>
      </Card>

      <Card className="h-[180px] w-[350px]">
        <CardHeader className="flex flex-row justify-between space-y-0 pb-1">
          <CardTitle className="text-base font-medium">Average Price</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="flex flex-col items-start justify-center space-y-2 pt-0">
          <div className="text-3xl font-bold">₦{avgPrice.value.toLocaleString()}</div>
          <div className={cn("flex items-center gap-1 text-sm",
            avgPrice.isPositive ? "text-green-600" : "text-red-600")}>
            {avgPrice.isPositive ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
            <span>{Math.abs(avgPrice.trend)}% from last month</span>
          </div>
        </CardContent>
      </Card>

      <Card className="h-[180px] w-[350px]">
        <CardHeader className="flex flex-row justify-between space-y-0 pb-1">
          <CardTitle className="text-base font-medium">Retention Rate</CardTitle>
          <Percent className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="flex flex-col items-start justify-center space-y-2 pt-0">
          <div className="text-3xl font-bold">{retention.value}%</div>
          <div className={cn("flex items-center gap-1 text-sm",
            retention.isPositive ? "text-green-600" : "text-red-600")}>
            {retention.isPositive ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
            <span>{Math.abs(retention.trend)}% from last month</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}