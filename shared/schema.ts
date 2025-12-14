import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, real, index, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export const airports = pgTable("airports", {
  code: varchar("code", { length: 3 }).primaryKey(),
  name: text("name").notNull(),
  city: text("city").notNull(),
  country: text("country").notNull(),
});

export type Airport = typeof airports.$inferSelect;

export const airlines = pgTable("airlines", {
  code: varchar("code", { length: 3 }).primaryKey(),
  name: text("name").notNull(),
  logo: text("logo"),
});

export type Airline = typeof airlines.$inferSelect;

export const flights = pgTable("flights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  flightNumber: text("flight_number").notNull(),
  airlineCode: varchar("airline_code", { length: 3 }).notNull(),
  departureAirport: varchar("departure_airport", { length: 3 }).notNull(),
  arrivalAirport: varchar("arrival_airport", { length: 3 }).notNull(),
  departureTime: text("departure_time").notNull(),
  arrivalTime: text("arrival_time").notNull(),
  duration: text("duration").notNull(),
  stops: integer("stops").notNull().default(0),
  stopDetails: text("stop_details"),
  basePrice: real("base_price").notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  baggageIncluded: boolean("baggage_included").notNull().default(true),
  availableSeats: integer("available_seats").notNull().default(150),
  departureDate: text("departure_date").notNull(),
});

export const insertFlightSchema = createInsertSchema(flights).omit({ id: true });
export type InsertFlight = z.infer<typeof insertFlightSchema>;
export type Flight = typeof flights.$inferSelect;

export const fareTypes = pgTable("fare_types", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  priceMultiplier: real("price_multiplier").notNull().default(1),
  carryOn: text("carry_on").notNull(),
  checkedBag: text("checked_bag").notNull(),
  seatSelection: boolean("seat_selection").notNull().default(false),
  changeFee: text("change_fee").notNull(),
  cancellationFee: text("cancellation_fee").notNull(),
  mileageAccrual: text("mileage_accrual").notNull(),
});

export type FareType = typeof fareTypes.$inferSelect;

export const seats = pgTable("seats", {
  id: varchar("id").primaryKey(),
  flightId: varchar("flight_id").notNull(),
  row: integer("row").notNull(),
  column: varchar("column", { length: 1 }).notNull(),
  type: varchar("type", { length: 20 }).notNull().default("standard"),
  price: real("price").notNull().default(0),
  occupied: boolean("occupied").notNull().default(false),
});

export const insertSeatSchema = createInsertSchema(seats);
export type InsertSeat = z.infer<typeof insertSeatSchema>;
export type Seat = typeof seats.$inferSelect;

export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reference: varchar("reference", { length: 10 }).notNull().unique(),
  flightId: varchar("flight_id").notNull(),
  fareTypeId: varchar("fare_type_id").notNull(),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone"),
  totalAmount: real("total_amount").notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  paymentMethod: varchar("payment_method", { length: 20 }),
  paymentId: text("payment_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertBookingSchema = createInsertSchema(bookings).omit({ 
  id: true, 
  reference: true, 
  createdAt: true 
});
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;

export const passengers = pgTable("passengers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  gender: varchar("gender", { length: 10 }).notNull(),
  dateOfBirth: text("date_of_birth").notNull(),
  nationality: text("nationality"),
  documentType: varchar("document_type", { length: 20 }).notNull().default("passport"),
  documentNumber: text("document_number"),
  documentExpiry: text("document_expiry"),
  seatId: varchar("seat_id"),
});

export const insertPassengerSchema = createInsertSchema(passengers).omit({ id: true });
export type InsertPassenger = z.infer<typeof insertPassengerSchema>;
export type Passenger = typeof passengers.$inferSelect;

export const flightSearchSchema = z.object({
  origin: z.string().min(3).max(3),
  destination: z.string().min(3).max(3),
  departureDate: z.string(),
  returnDate: z.string().optional(),
  passengers: z.number().min(1).max(9).default(1),
  cabinClass: z.enum(["economy", "premium", "business", "first"]).default("economy"),
  tripType: z.enum(["one-way", "round-trip", "multi-city"]).default("round-trip"),
});

export type FlightSearch = z.infer<typeof flightSearchSchema>;

export const bookingRequestSchema = z.object({
  flightId: z.string(),
  fareTypeId: z.string(),
  contactEmail: z.string().email(),
  contactPhone: z.string().optional(),
  passengers: z.array(z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    gender: z.string(),
    dateOfBirth: z.string(),
    nationality: z.string().optional(),
    documentType: z.string().default("passport"),
    documentNumber: z.string().optional(),
    documentExpiry: z.string().optional(),
    seatId: z.string().optional(),
  })),
  selectedSeats: z.array(z.string()).optional(),
});

export type BookingRequest = z.infer<typeof bookingRequestSchema>;
