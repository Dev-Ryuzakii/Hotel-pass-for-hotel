import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertRoomSchema } from "@shared/schema";

export async function registerRoutes(app: Express) {
  app.get("/api/rooms", async (req, res) => {
    const rooms = await storage.getRooms();
    res.json(rooms);
  });

  app.get("/api/rooms/:id", async (req, res) => {
    const room = await storage.getRoom(parseInt(req.params.id));
    if (!room) return res.status(404).json({ message: "Room not found" });
    res.json(room);
  });

  app.post("/api/rooms", async (req, res) => {
    const result = insertRoomSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid room data", errors: result.error });
    }
    
    const room = await storage.createRoom(result.data);
    res.status(201).json(room);
  });

  app.patch("/api/rooms/:id", async (req, res) => {
    const result = insertRoomSchema.partial().safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid room data", errors: result.error });
    }

    try {
      const room = await storage.updateRoom(parseInt(req.params.id), result.data);
      res.json(room);
    } catch (error) {
      res.status(404).json({ message: "Room not found" });
    }
  });

  app.delete("/api/rooms/:id", async (req, res) => {
    try {
      await storage.deleteRoom(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      res.status(404).json({ message: "Room not found" });
    }
  });

  app.patch("/api/rooms/:id/availability", async (req, res) => {
    const count = parseInt(req.body.count);
    if (isNaN(count)) {
      return res.status(400).json({ message: "Invalid count" });
    }

    try {
      const room = await storage.updateRoomAvailability(parseInt(req.params.id), count);
      res.json(room);
    } catch (error) {
      res.status(404).json({ message: "Room not found" });
    }
  });

  return createServer(app);
}
