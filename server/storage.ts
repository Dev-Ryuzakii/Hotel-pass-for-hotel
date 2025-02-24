import { type Hotel, type InsertHotel, type Room, type InsertRoom } from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // Hotel management
  getHotel(id: number): Promise<Hotel | undefined>;
  getHotelByEmail(email: string): Promise<Hotel | undefined>;
  createHotel(hotel: InsertHotel): Promise<Hotel>;

  // Room management
  getRooms(hotelId?: number): Promise<Room[]>;
  getRoom(id: number): Promise<Room | undefined>;
  createRoom(hotelId: number, room: InsertRoom): Promise<Room>;
  updateRoom(id: number, room: Partial<InsertRoom>): Promise<Room>;
  deleteRoom(id: number): Promise<void>;
  updateRoomAvailability(id: number, count: number): Promise<Room>;

  // Session store for authentication
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private hotels: Map<number, Hotel>;
  private rooms: Map<number, Room>;
  private currentHotelId: number;
  private currentRoomId: number;
  readonly sessionStore: session.Store;

  constructor() {
    this.hotels = new Map();
    this.rooms = new Map();
    this.currentHotelId = 1;
    this.currentRoomId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // Clear expired entries every 24h
    });
  }

  // Hotel methods
  async getHotel(id: number): Promise<Hotel | undefined> {
    return this.hotels.get(id);
  }

  async getHotelByEmail(email: string): Promise<Hotel | undefined> {
    return Array.from(this.hotels.values()).find(
      (hotel) => hotel.email === email
    );
  }

  async createHotel(insertHotel: InsertHotel): Promise<Hotel> {
    const id = this.currentHotelId++;
    const hotel: Hotel = { id, ...insertHotel, createdAt: new Date() };
    this.hotels.set(id, hotel);
    return hotel;
  }

  // Room methods
  async getRooms(hotelId?: number): Promise<Room[]> {
    const rooms = Array.from(this.rooms.values());
    return hotelId ? rooms.filter(room => room.hotelId === hotelId) : rooms;
  }

  async getRoom(id: number): Promise<Room | undefined> {
    return this.rooms.get(id);
  }

  async createRoom(hotelId: number, insertRoom: InsertRoom): Promise<Room> {
    const id = this.currentRoomId++;
    const room: Room = { 
      id, 
      hotelId, 
      ...insertRoom,
      createdAt: new Date(),
    };
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