import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
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

export const insertHotelSchema = createInsertSchema(hotels)
  .omit({ id: true, createdAt: true })
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

export type Hotel = typeof hotels.$inferSelect;
export type InsertHotel = z.infer<typeof insertHotelSchema>;
export type Room = typeof rooms.$inferSelect;
export type InsertRoom = z.infer<typeof insertRoomSchema>;

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