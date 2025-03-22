import express, { Express, Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage as dbStorage } from "./storage";
import { insertRoomSchema, updateBookingStatusSchema, type Booking } from "@shared/schema";
import { setupAuth, hashPassword, comparePasswords } from "./auth";
import { randomBytes } from 'crypto';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';
import cors from 'cors';

// Configure multer for handling file uploads
const uploadStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), 'uploads');
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: uploadStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 15 // Maximum 15 files
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      cb(new Error('Invalid file type. Only JPEG, PNG and WebP are allowed'));
      return;
    }
    cb(null, true);
  }
});

// Middleware to check if user is authenticated
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

// Add CORS configuration
const app = express();
app.use(cors({
  origin: process.env.USER_APP_URL || 'http://localhost:5173', // Replace with your user app URL
  credentials: true
}));

export async function registerRoutes(app: Express) {
  // Setup authentication routes
  setupAuth(app);

  // Create HTTP server
  const server = createServer(app);

  // Serve uploaded files statically
  const uploadsPath = path.join(process.cwd(), 'uploads');
  // Create uploads directory if it doesn't exist
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsPath));

  // Image upload endpoint
  app.post("/api/upload/images", requireAuth, upload.array('images', 15), async (req: Request, res: Response) => {
    try {
      if (!req.files || !Array.isArray(req.files)) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      const files = req.files as Express.Multer.File[];
      const urls = files.map(file => {
        // Convert file path to URL
        return `/uploads/${file.filename}`;
      });

      res.json({ urls });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      res.status(500).json({ message: errorMessage });
    }
  });

  // Setup WebSocket server
  const wss = new WebSocketServer({ server, path: '/ws' });

  // WebSocket connection handling
  wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received:', data);
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
    });
  });

  // Broadcast room updates to all connected clients
  function broadcastRoomUpdate(room: any) {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'ROOM_UPDATE',
          room
        }));
      }
    });
  }

  // Hotel profile update
  app.patch("/api/hotel", requireAuth, async (req: Request, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const hotel = await dbStorage.getHotel(req.user.id);
      if (!hotel) {
        return res.status(404).json({ message: "Hotel not found" });
      }

      // Verify current password
      if (!(await comparePasswords(req.body.currentPassword, hotel.password))) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      const updateData = {
        name: req.body.name,
        email: req.body.email,
        address: req.body.address,
        city: req.body.city,
        phone: req.body.phone,
      };

      // Update password if provided
      if (req.body.newPassword) {
        updateData['password'] = await hashPassword(req.body.newPassword);
      }

      const updatedHotel = await dbStorage.updateHotel(req.user.id, updateData);
      const { password, ...safeHotel } = updatedHotel;
      res.json(safeHotel);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      res.status(400).json({ message: errorMessage });
    }
  });

  // Password reset request
  app.post("/api/forgot-password", async (req: Request, res: Response) => {
    try {
      const hotel = await dbStorage.getHotelByEmail(req.body.email);
      if (!hotel) {
        // For security, don't reveal if email exists
        return res.json({ message: "If your email is registered, you will receive reset instructions" });
      }

      // Generate reset token
      const resetToken = randomBytes(32).toString('hex');
      const resetExpiry = new Date(Date.now() + 3600000); // 1 hour

      await dbStorage.saveResetToken(hotel.id, resetToken, resetExpiry);

      // In a real application, send email with reset link
      // For now, just return success message
      res.json({ message: "Password reset instructions sent" });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      res.status(400).json({ message: errorMessage });
    }
  });

  // Public room routes (for booking page)
  app.get("/api/rooms", async (req:Request, res:Response) => {
    try {
      const rooms = await dbStorage.getRooms();
      res.json(rooms);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      res.status(500).json({ message: errorMessage });
    }
  });

  app.get("/api/rooms/:id", async (req: Request, res: Response) => {
    try {
      const room = await dbStorage.getRoom(parseInt(req.params.id));
      if (!room) return res.status(404).json({ message: "Room not found" });
      res.json(room);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      res.status(500).json({ message: errorMessage });
    }
  });

  // Protected hotel-specific room routes
  app.get("/api/hotel/rooms", requireAuth, async (req: Request, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const rooms = await dbStorage.getRooms(req.user.id);
      res.json(rooms);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      res.status(500).json({ message: errorMessage });
    }
  });

  app.post("/api/hotel/rooms", requireAuth, async (req: Request, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const result = insertRoomSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid room data", errors: result.error });
      }

      const room = await dbStorage.createRoom(req.user.id, result.data);
      broadcastRoomUpdate(room);
      res.status(201).json(room);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      res.status(500).json({ message: errorMessage });
    }
  });

  app.patch("/api/hotel/rooms/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const result = insertRoomSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid room data", errors: result.error });
      }

      const room = await dbStorage.getRoom(parseInt(req.params.id));
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }

      // Verify room belongs to the logged-in hotel
      if (room.hotelId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const updatedRoom = await dbStorage.updateRoom(parseInt(req.params.id), result.data);
      broadcastRoomUpdate(updatedRoom);
      res.json(updatedRoom);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      res.status(500).json({ message: errorMessage });
    }
  });

  app.delete("/api/hotel/rooms/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const room = await dbStorage.getRoom(parseInt(req.params.id));
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }

      // Verify room belongs to the logged-in hotel
      if (room.hotelId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }

      await dbStorage.deleteRoom(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      res.status(500).json({ message: errorMessage });
    }
  });

  app.patch("/api/hotel/rooms/:id/availability", requireAuth, async (req: Request, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const count = parseInt(req.body.count);
      if (isNaN(count)) {
        return res.status(400).json({ message: "Invalid count" });
      }

      const room = await dbStorage.getRoom(parseInt(req.params.id));
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }

      // Verify room belongs to the logged-in hotel
      if (room.hotelId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const updatedRoom = await dbStorage.updateRoomAvailability(parseInt(req.params.id), count);
      broadcastRoomUpdate(updatedRoom);
      res.json(updatedRoom);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      res.status(500).json({ message: errorMessage });
    }
  });

  // Protected hotel-specific booking routes
  app.get("/api/hotel/bookings", requireAuth, async (req: Request, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const bookings = await dbStorage.getBookings(req.user.id);
      res.json(bookings);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      res.status(500).json({ message: errorMessage });
    }
  });

  app.patch("/api/hotel/bookings/:id/status", requireAuth, async (req: Request, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const bookingId = parseInt(req.params.id);
      const { status } = updateBookingStatusSchema.parse(req.body);

      if (!["pending", "approved", "rejected", "completed"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const booking = await dbStorage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Verify booking belongs to the logged-in hotel
      if (booking.hotelId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const updatedBooking = await dbStorage.updateBookingStatus(bookingId, status);

      // If booking is approved, update room availability
      if (status === "approved") {
        const room = await dbStorage.getRoom(booking.roomId);
        if (!room) {
          return res.status(404).json({ message: "Room not found" });
        }
        await dbStorage.updateRoomAvailability(room.id, room.availableRooms - 1);
      }

      // Broadcast booking update to WebSocket clients
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'BOOKING_UPDATE',
            booking: updatedBooking
          }));
        }
      });

      res.json(updatedBooking);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      res.status(500).json({ message: errorMessage });
    }
  });

  // Public endpoints for user app
  app.get("/api/public/rooms", async (req: Request, res: Response) => {
    try {
      const rooms = await dbStorage.getRooms();
      // Only return available rooms
      const availableRooms = rooms.filter(room => room.isAvailable && room.availableRooms > 0);
      res.json(availableRooms);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      res.status(500).json({ message: errorMessage });
    }
  });

  app.get("/api/public/rooms/:id", async (req: Request, res: Response) => {
    try {
      const room = await dbStorage.getRoom(parseInt(req.params.id));
      if (!room) return res.status(404).json({ message: "Room not found" });
      res.json(room);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      res.status(500).json({ message: errorMessage });
    }
  });

  // Create booking (public endpoint)
  app.post("/api/public/bookings", async (req: Request, res: Response) => {
    try {
      const result = insertBookingSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid booking data", errors: result.error });
      }

      // Check if room is available
      const room = await dbStorage.getRoom(result.data.roomId);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      if (!room.isAvailable || room.availableRooms < result.data.numberOfRooms) {
        return res.status(400).json({ message: "Room is not available for the selected dates" });
      }

      // Create booking
      const booking = await dbStorage.createBooking({
        ...result.data,
        hotelId: room.hotelId,
        status: "pending",
        paymentStatus: "pending"
      });

      // Broadcast new booking to admin dashboard
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'BOOKING_CREATED',
            booking: {
              ...booking,
              room: room.name
            }
          }));
        }
      });

      res.status(201).json(booking);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      res.status(500).json({ message: errorMessage });
    }
  });

  // Get booking status (public endpoint)
  app.get("/api/public/bookings/:id", async (req: Request, res: Response) => {
    try {
      const booking = await dbStorage.getBooking(parseInt(req.params.id));
      if (!booking) return res.status(404).json({ message: "Booking not found" });
      res.json(booking);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      res.status(500).json({ message: errorMessage });
    }
  });

  return server;
}