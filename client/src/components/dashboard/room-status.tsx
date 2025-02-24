import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Room } from "@shared/schema";

interface RoomStatusProps {
  rooms: Room[];
}

export default function RoomStatus({ rooms }: RoomStatusProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Room Type</TableHead>
            <TableHead>Total Rooms</TableHead>
            <TableHead>Available</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rooms.map((room) => (
            <TableRow key={room.id}>
              <TableCell className="font-medium">{room.name}</TableCell>
              <TableCell>{room.totalRooms}</TableCell>
              <TableCell>{room.availableRooms}</TableCell>
              <TableCell>${room.price}</TableCell>
              <TableCell>
                <Badge
                  variant={room.availableRooms > 0 ? "success" : "destructive"}
                >
                  {room.availableRooms > 0 ? "Available" : "Fully Booked"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
