import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import StatsCards from "@/components/dashboard/stats-cards";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import RoomForm from "@/components/rooms/room-form";
import { useWebSocket } from "@/hooks/use-websocket";
import type { Room } from "@shared/schema";
import Navbar from "@/components/layout/navbar";
import { Table, Pagination } from 'antd';

// Sample data
const data = [
  {
    key: '1',
    room: '101',
    name: 'John Doe',
    email: 'john@example.com',
    status: 'Confirmed',
    price: '$100',
    time: '2023-10-01 12:00',
  },
  {
    key: '2',
    room: '102',
    name: 'Jane Smith',
    email: 'jane@example.com',
    status: 'Pending',
    price: '$120',
    time: '2023-10-02 14:00',
  },
  {
    key: '3',
    room: '103',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    status: 'Cancelled',
    price: '$90',
    time: '2023-10-03 16:00',
  },
  {
    key: '4',
    room: '104',
    name: 'Bob Brown',
    email: 'bob@example.com',
    status: 'Confirmed',
    price: '$110',
    time: '2023-10-04 18:00',
  },
  {
    key: '5',
    room: '105',
    name: 'Charlie Davis',
    email: 'charlie@example.com',
    status: 'Pending',
    price: '$130',
    time: '2023-10-05 20:00',
  },
  {
    key: '6',
    room: '106',
    name: 'David Evans',
    email: 'david@example.com',
    status: 'Confirmed',
    price: '$140',
    time: '2023-10-06 22:00',
  },
  {
    key: '7',
    room: '107',
    name: 'Eva Green',
    email: 'eva@example.com',
    status: 'Pending',
    price: '$150',
    time: '2023-10-07 10:00',
  },
  {
    key: '8',
    room: '108',
    name: 'Frank Harris',
    email: 'frank@example.com',
    status: 'Cancelled',
    price: '$160',
    time: '2023-10-08 12:00',
  },
  {
    key: '9',
    room: '109',
    name: 'Grace Lee',
    email: 'grace@example.com',
    status: 'Confirmed',
    price: '$170',
    time: '2023-10-09 14:00',
  },
  {
    key: '10',
    room: '110',
    name: 'Henry Miller',
    email: 'henry@example.com',
    status: 'Pending',
    price: '$180',
    time: '2023-10-10 16:00',
  },
  {
    key: '11',
    room: '111',
    name: 'Ivy Nelson',
    email: 'ivy@example.com',
    status: 'Cancelled',
    price: '$190',
    time: '2023-10-11 18:00',
  },
  {
    key: '12',
    room: '112',
    name: 'Jack Owens',
    email: 'jack@example.com',
    status: 'Confirmed',
    price: '$200',
    time: '2023-10-12 20:00',
  },
  // ...more sample data...
];

const Dashboard = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const columns = [
    {
      title: 'Rooms',
      dataIndex: 'room',
      key: 'room',
    },
    {
      title: 'Name of the person who booked',
      dataIndex: 'name',
      key: 'name',
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
    },
    {
      title: 'Time',
      dataIndex: 'time',
      key: 'time',
    },
  ];

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  interface Booking {
    id: string;
    room: string;
    customerName: string;
    email: string;
    status: "pending" | "confirmed" | "cancelled";
    price: number;
    createdAt: Date;
  }

  const dummyData: Booking[] = [
    {
      id: "1",
      room: "Deluxe Suite 101",
      customerName: "John Doe",
      email: "john@example.com",
      status: "confirmed",
      price: 45000,
      createdAt: new Date("2024-03-20T10:00:00"),
    },
    // Add more dummy data...
  ];

  const [isOpen, setIsOpen] = useState(false);
  const { data: rooms, isLoading } = useQuery<Room[]>({
    queryKey: ["/api/hotel/rooms"],
  });

  // Initialize WebSocket connection
  useWebSocket();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="">
      <Navbar />
      <main className="bg-gray-100/80 p-8">
        <div className="bg-[#6A3CB5] overflow-hidden my-4 rounded-lg mb-8 p-8">
          {/* Main content */}
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl text-white font-bold tracking-tight mb-2">Hi [Business name / Name]</h2>
                <p className="text-gray-200">Create your first event to get started.</p>
              </div>
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button variant="secondary" size="lg" className="bg-white text-[#8B5CF6] hover:bg-gray-100">
                    <Plus className="h-5 w-5 mr-2" />
                    Add Room
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add New Room</DialogTitle>
                  </DialogHeader>
                  <RoomForm
                    onSuccess={() => {
                      setIsOpen(false);
                    }}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <StatsCards rooms={rooms || []} />

        <div className="bg-white rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-4">Bookings</h1>
          <Table
            columns={columns}
            dataSource={data.slice((currentPage - 1) * pageSize, currentPage * pageSize)}
            pagination={false}
            bordered
            className="mb-4"
          />
          <div className="flex justify-end">
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={data.length}
              onChange={handlePageChange}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;