import { Express, Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertRoomSchema } from "@shared/schema";
import { setupAuth, hashPassword, comparePasswords } from "./auth";
import { randomBytes } from 'crypto';

// Middleware to check if user is authenticated
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

export async function registerRoutes(app: Express) {
  // Setup authentication routes
  setupAuth(app);

  // Create HTTP server
  const server = createServer(app);

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

      const hotel = await storage.getHotel(req.user.id);
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

      const updatedHotel = await storage.updateHotel(req.user.id, updateData);
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
      const hotel = await storage.getHotelByEmail(req.body.email);
      if (!hotel) {
        // For security, don't reveal if email exists
        return res.json({ message: "If your email is registered, you will receive reset instructions" });
      }

      // Generate reset token
      const resetToken = randomBytes(32).toString('hex');
      const resetExpiry = new Date(Date.now() + 3600000); // 1 hour

      await storage.saveResetToken(hotel.id, resetToken, resetExpiry);

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
      const rooms = await storage.getRooms();
      res.json(rooms);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      res.status(500).json({ message: errorMessage });
    }
  });

  app.get("/api/rooms/:id", async (req: Request, res: Response) => {
    try {
      const room = await storage.getRoom(parseInt(req.params.id));
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
      const rooms = await storage.getRooms(req.user.id);
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

      const room = await storage.createRoom(req.user.id, result.data);
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

      const room = await storage.getRoom(parseInt(req.params.id));
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }

      // Verify room belongs to the logged-in hotel
      if (room.hotelId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const updatedRoom = await storage.updateRoom(parseInt(req.params.id), result.data);
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
      const room = await storage.getRoom(parseInt(req.params.id));
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }

      // Verify room belongs to the logged-in hotel
      if (room.hotelId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }

      await storage.deleteRoom(parseInt(req.params.id));
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

      const room = await storage.getRoom(parseInt(req.params.id));
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }

      // Verify room belongs to the logged-in hotel
      if (room.hotelId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const updatedRoom = await storage.updateRoomAvailability(parseInt(req.params.id), count);
      broadcastRoomUpdate(updatedRoom);
      res.json(updatedRoom);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      res.status(500).json({ message: errorMessage });
    }
  });

  return server;
}