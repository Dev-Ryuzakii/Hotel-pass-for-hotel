import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import StatsCards from "@/components/dashboard/stats-cards";
import { useWebSocket } from "@/hooks/use-websocket";
import type { Room } from "@shared/schema";
import Navbar from "@/components/layout/navbar";
import { Table, Pagination } from 'antd';
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";

interface Booking {
  id: string;
  room: string;
  customerName: string;
  email: string;
  status: "pending" | "confirmed" | "cancelled";
  price: number;
  createdAt: Date;
}

const Dashboard = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const { user } = useAuth();
  const hotelName = user?.hotelName || "";

  const { data: rooms, isLoading: roomsLoading } = useQuery<Room[]>({
    queryKey: ["/api/hotel/rooms"],
  });

  const { data: bookings, isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ["/api/hotel/bookings"],
  });

  const columns = [
    {
      title: 'Rooms',
      dataIndex: 'room',
      key: 'room',
    },
    {
      title: 'Name of the person who booked',
      dataIndex: 'customerName',
      key: 'customerName',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => `₦${price.toLocaleString()}`,
    },
    {
      title: 'Time',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: Date) => new Date(date).toLocaleString(),
    },
  ];

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Initialize WebSocket connection
  useWebSocket();

  if (roomsLoading || bookingsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="">
      <Navbar />
      <main className="bg-gray-100/80 p-8 min-h-screen">
        <div className="bg-[#6A3CB5] overflow-hidden my-4 rounded-lg mb-8 p-8">
          {/* Main content */}
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl text-white font-bold tracking-tight mb-2">Hi, {hotelName}</h2>
                <p className="text-gray-200">Welcome to your dashboard.</p>
              </div>
            </div>
          </div>
        </div>

        <StatsCards rooms={rooms || []} bookings={bookings || []} />

        <div className="bg-white rounded-lg p-6 my-10">
          <h1 className="text-2xl font-bold mb-4">Bookings</h1>
          <Table
            columns={columns}
            dataSource={bookings?.slice((currentPage - 1) * pageSize, currentPage * pageSize)}
            pagination={false}
            bordered
          />
          <div className="mt-4 flex justify-end">
            <Pagination
              current={currentPage}
              total={bookings?.length || 0}
              pageSize={pageSize}
              onChange={handlePageChange}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;