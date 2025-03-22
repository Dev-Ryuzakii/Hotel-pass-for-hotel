import { pgTable, text, serial, integer, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const hotels = pgTable("hotels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  phone: text("phone").notNull(),
  walletBalance: decimal("wallet_balance").notNull().default("0"),
  bankName: text("bank_name"),
  bankAccountNumber: text("bank_account_number"),
  bankAccountName: text("bank_account_name"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  hotelId: integer("hotel_id").notNull().references(() => hotels.id),
  name: text("name").notNull(),
  type: text("type").notNull(),
  capacity: integer("capacity").notNull(),
  price: integer("price").notNull(),
  description: text("description").notNull(),
  amenities: text("amenities").array().notNull(),
  images: text("images").array().notNull(),
  isAvailable: boolean("is_available").notNull().default(true),
  totalRooms: integer("total_rooms").notNull(),
  availableRooms: integer("available_rooms").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").notNull().references(() => rooms.id),
  hotelId: integer("hotel_id").notNull().references(() => hotels.id),
  userId: text("user_id").notNull(), // External user ID from auth system
  checkIn: timestamp("check_in").notNull(),
  checkOut: timestamp("check_out").notNull(),
  numberOfRooms: integer("number_of_rooms").notNull(),
  totalAmount: decimal("total_amount").notNull(),
  status: text("status").notNull(), // pending, confirmed, cancelled
  paymentStatus: text("payment_status").notNull(), // pending, paid, refunded
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const walletTransactions = pgTable("wallet_transactions", {
  id: serial("id").primaryKey(),
  hotelId: integer("hotel_id").notNull().references(() => hotels.id),
  type: text("type").notNull(), // credit, debit
  amount: decimal("amount").notNull(),
  description: text("description").notNull(),
  reference: text("reference").notNull(),
  status: text("status").notNull(), // pending, completed, failed
  paystackReference: text("paystack_reference"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertHotelSchema = createInsertSchema(hotels)
  .omit({ id: true, createdAt: true, walletBalance: true })
  .extend({
    password: z.string().min(6, "Password must be at least 6 characters"),
    email: z.string().email("Invalid email address"),
  });

export const insertRoomSchema = createInsertSchema(rooms)
  .omit({ id: true, hotelId: true, createdAt: true })
  .extend({
    amenities: z.array(z.string()),
    images: z.array(z.string()).min(1, "At least one image is required").max(5, "Maximum 5 images allowed"),
    totalRooms: z.number().min(1, "Must have at least 1 room"),
    availableRooms: z.number(),
  });

export const insertBookingSchema = createInsertSchema(bookings)
  .omit({ id: true, hotelId: true, createdAt: true })
  .extend({
    checkIn: z.string().transform(str => new Date(str)),
    checkOut: z.string().transform(str => new Date(str)),
  });

export const insertWalletTransactionSchema = createInsertSchema(walletTransactions)
  .omit({ id: true, createdAt: true });

export type Hotel = typeof hotels.$inferSelect;
export type InsertHotel = z.infer<typeof insertHotelSchema>;
export type Room = typeof rooms.$inferSelect;
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type WalletTransaction = typeof walletTransactions.$inferSelect;
export type InsertWalletTransaction = z.infer<typeof insertWalletTransactionSchema>;

export const roomTypes = [
  "Standard",
  "Deluxe",
  "Suite",
  "Executive Suite",
  "Presidential Suite",
] as const;

export const amenityOptions = [
  "Wi-Fi",
  "TV",
  "Mini Bar",
  "Room Service",
  "Air Conditioning",
  "Safe",
  "Coffee Maker",
  "Balcony",
] as const;

export const bookingStatus = ["pending", "approved", "rejected", "completed"] as const;

export const paymentStatus = [
  "pending",
  "paid",
  "refunded",
] as const;

export const transactionTypes = [
  "credit",
  "debit",
] as const;

export const transactionStatus = [
  "pending",
  "completed",
  "failed",
] as const;

export const bookingSchema = insertBookingSchema.extend({
  id: z.number(),
  hotelId: z.number(),
  roomName: z.string(),
  status: z.enum(bookingStatus),
  createdAt: z.string(),
});

export const updateBookingStatusSchema = z.object({
  status: z.enum(bookingStatus),
});