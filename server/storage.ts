import { type Room, type InsertRoom } from "@shared/schema";

export interface IStorage {
  getRooms(): Promise<Room[]>;
  getRoom(id: number): Promise<Room | undefined>;
  createRoom(room: InsertRoom): Promise<Room>;
  updateRoom(id: number, room: Partial<InsertRoom>): Promise<Room>;
  deleteRoom(id: number): Promise<void>;
  updateRoomAvailability(id: number, count: number): Promise<Room>;
}

export class MemStorage implements IStorage {
  private rooms: Map<number, Room>;
  private currentId: number;

  constructor() {
    this.rooms = new Map();
    this.currentId = 1;
  }

  async getRooms(): Promise<Room[]> {
    return Array.from(this.rooms.values());
  }

  async getRoom(id: number): Promise<Room | undefined> {
    return this.rooms.get(id);
  }

  async createRoom(insertRoom: InsertRoom): Promise<Room> {
    const id = this.currentId++;
    const room: Room = { id, ...insertRoom };
    this.rooms.set(id, room);
    return room;
  }

  async updateRoom(id: number, update: Partial<InsertRoom>): Promise<Room> {
    const room = await this.getRoom(id);
    if (!room) throw new Error("Room not found");
    
    const updatedRoom = { ...room, ...update };
    this.rooms.set(id, updatedRoom);
    return updatedRoom;
  }

  async deleteRoom(id: number): Promise<void> {
    this.rooms.delete(id);
  }

  async updateRoomAvailability(id: number, count: number): Promise<Room> {
    const room = await this.getRoom(id);
    if (!room) throw new Error("Room not found");
    
    const availableRooms = Math.max(0, Math.min(room.totalRooms, room.availableRooms + count));
    const updatedRoom = { ...room, availableRooms };
    this.rooms.set(id, updatedRoom);
    return updatedRoom;
  }
}

export const storage = new MemStorage();
