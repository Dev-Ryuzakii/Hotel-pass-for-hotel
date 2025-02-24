import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  capacity: integer("capacity").notNull(),
  price: integer("price").notNull(),
  description: text("description").notNull(),
  amenities: text("amenities").array().notNull(),
  imageUrl: text("image_url").notNull(),
  isAvailable: boolean("is_available").notNull().default(true),
  totalRooms: integer("total_rooms").notNull(),
  availableRooms: integer("available_rooms").notNull(),
});

export const insertRoomSchema = createInsertSchema(rooms)
  .omit({ id: true })
  .extend({
    amenities: z.array(z.string()),
    totalRooms: z.number().min(1, "Must have at least 1 room"),
    availableRooms: z.number(),
  });

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
