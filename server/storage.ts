import { type Hotel, type InsertHotel, type Room, type InsertRoom, type InsertBooking } from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";

const MemoryStore = createMemoryStore(session);

interface Booking {
  id: number;
  hotelId: number;
  roomId: number;
  roomName: string;
  guestName: string;
  guestEmail: string;
  checkIn: string;
  checkOut: string;
  numberOfGuests: number;
  totalPrice: number;
  status: "pending" | "approved" | "rejected" | "completed";
  createdAt: string;
}

export interface IStorage {
  // Hotel management
  getHotel(id: number): Promise<Hotel | undefined>;
  getHotelByEmail(email: string): Promise<Hotel | undefined>;
  createHotel(hotel: InsertHotel): Promise<Hotel>;
  updateHotel(id: number, hotel: Partial<Hotel>): Promise<Hotel>;
  saveResetToken(hotelId: number, token: string, expiry: Date): Promise<void>;
  getResetToken(token: string): Promise<{ hotelId: number, expiry: Date } | undefined>;

  // Room management
  getRooms(hotelId?: number): Promise<Room[]>;
  getRoom(id: number): Promise<Room | undefined>;
  createRoom(hotelId: number, room: InsertRoom): Promise<Room>;
  updateRoom(id: number, room: Partial<InsertRoom>): Promise<Room>;
  deleteRoom(id: number): Promise<void>;
  updateRoomAvailability(id: number, count: number): Promise<Room>;

  // Booking management
  getBookings(hotelId: number): Promise<Booking[]>;
  getBooking(id: number): Promise<Booking | undefined>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBookingStatus(id: number, status: Booking['status']): Promise<Booking>;

  // Session store for authentication
  sessionStore: session.Store;
}

interface ResetToken {
  hotelId: number;
  token: string;
  expiry: Date;
}

export class MemStorage implements IStorage {
  private hotels: Map<number, Hotel>;
  private rooms: Map<number, Room>;
  private bookings: Map<number, Booking>;
  private resetTokens: Map<string, ResetToken>;
  private currentHotelId: number;
  private currentRoomId: number;
  private currentBookingId: number;
  readonly sessionStore: session.Store;

  constructor() {
    this.hotels = new Map();
    this.rooms = new Map();
    this.bookings = new Map();
    this.resetTokens = new Map();
    this.currentHotelId = 1;
    this.currentRoomId = 1;
    this.currentBookingId = 1;
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

  async updateHotel(id: number, update: Partial<Hotel>): Promise<Hotel> {
    const hotel = await this.getHotel(id);
    if (!hotel) throw new Error("Hotel not found");

    const updatedHotel = { ...hotel, ...update };
    this.hotels.set(id, updatedHotel);
    return updatedHotel;
  }

  async saveResetToken(hotelId: number, token: string, expiry: Date): Promise<void> {
    this.resetTokens.set(token, { hotelId, token, expiry });
  }

  async getResetToken(token: string): Promise<{ hotelId: number; expiry: Date } | undefined> {
    const resetToken = this.resetTokens.get(token);
    if (!resetToken || resetToken.expiry < new Date()) {
      return undefined;
    }
    return { hotelId: resetToken.hotelId, expiry: resetToken.expiry };
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

  async getBookings(hotelId: number): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(
      (booking) => booking.hotelId === hotelId
    );
  }

  async getBooking(id: number): Promise<Booking | undefined> {
    return this.bookings.get(id);
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const newBooking: Booking = {
      id: this.currentBookingId++,
      ...booking,
      createdAt: new Date().toISOString(),
    };
    this.bookings.set(newBooking.id, newBooking);
    return newBooking;
  }

  async updateBookingStatus(id: number, status: Booking['status']): Promise<Booking> {
    const booking = await this.getBooking(id);
    if (!booking) throw new Error("Booking not found");

    const updatedBooking = { ...booking, status };
    this.bookings.set(id, updatedBooking);
    return updatedBooking;
  }
}

export const storage = new MemStorage();