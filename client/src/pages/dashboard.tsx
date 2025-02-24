import { useQuery } from "@tanstack/react-query";
import StatsCards from "@/components/dashboard/stats-cards";
import RoomStatus from "@/components/dashboard/room-status";
import type { Room } from "@shared/schema";

export default function Dashboard() {
  const { data: rooms, isLoading } = useQuery<Room[]>({
    queryKey: ["/api/rooms"],
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
      </div>

      <StatsCards rooms={rooms || []} />
      
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Room Status</h2>
        <RoomStatus rooms={rooms || []} />
      </div>
    </div>
  );
}
