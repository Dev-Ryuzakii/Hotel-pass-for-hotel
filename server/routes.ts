import type { Express } from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { insertRoomSchema } from "@shared/schema";
import { setupAuth } from "./auth";

// Middleware to check if user is authenticated
function requireAuth(req: Express.Request, res: Express.Response, next: Express.NextFunction) {
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

  // Public room routes (for booking page)
  app.get("/api/rooms", async (req, res) => {
    const rooms = await storage.getRooms();
    res.json(rooms);
  });

  app.get("/api/rooms/:id", async (req, res) => {
    const room = await storage.getRoom(parseInt(req.params.id));
    if (!room) return res.status(404).json({ message: "Room not found" });
    res.json(room);
  });

  // Protected hotel-specific room routes
  app.get("/api/hotel/rooms", requireAuth, async (req, res) => {
    const rooms = await storage.getRooms(req.user.id);
    res.json(rooms);
  });

  app.post("/api/hotel/rooms", requireAuth, async (req, res) => {
    const result = insertRoomSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid room data", errors: result.error });
    }

    const room = await storage.createRoom(req.user.id, result.data);
    broadcastRoomUpdate(room);
    res.status(201).json(room);
  });

  app.patch("/api/hotel/rooms/:id", requireAuth, async (req, res) => {
    const result = insertRoomSchema.partial().safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid room data", errors: result.error });
    }

    try {
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
      res.status(404).json({ message: "Room not found" });
    }
  });

  app.delete("/api/hotel/rooms/:id", requireAuth, async (req, res) => {
    try {
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
      res.status(404).json({ message: "Room not found" });
    }
  });

  app.patch("/api/hotel/rooms/:id/availability", requireAuth, async (req, res) => {
    const count = parseInt(req.body.count);
    if (isNaN(count)) {
      return res.status(400).json({ message: "Invalid count" });
    }

    try {
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
      res.status(404).json({ message: "Room not found" });
    }
  });

  return server;
}