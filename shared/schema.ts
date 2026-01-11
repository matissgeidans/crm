import { sql, relations } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum("user_role", ["driver", "admin"]);
export const tripStatusEnum = pgEnum("trip_status", ["draft", "submitted", "approved", "rejected"]);
export const clientStatusEnum = pgEnum("client_status", ["active", "inactive"]);

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").default("driver").notNull(),
  vehicleName: varchar("vehicle_name", { length: 255 }), 
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Clients table
export const clients = pgTable("clients", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 255 }).notNull(),
  contactEmail: varchar("contact_email", { length: 255 }),
  contactPhone: varchar("contact_phone", { length: 50 }),
  address: text("address"),
  ratePerKm: decimal("rate_per_km", { precision: 10, scale: 2 }).notNull().default("1.50"),
  status: clientStatusEnum("status").default("active").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Trips table
export const trips = pgTable("trips", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  tripNumber: varchar("trip_number", { length: 50 }),
  driverId: varchar("driver_id").notNull().references(() => users.id),
  clientId: integer("client_id").references(() => clients.id),
  manualClientName: varchar("manual_client_name", { length: 255 }),
  
  vehicleId: varchar("vehicle_id", { length: 100 }),
  cargoName: varchar("cargo_name", { length: 255 }),
  weightCategory: varchar("weight_category", { length: 50 }),
  licensePlate: varchar("license_plate", { length: 20 }).notNull(),
  
  distanceKm: decimal("distance_km", { precision: 10, scale: 2 }).notNull(),
  durationHours: decimal("duration_hours", { precision: 10, scale: 2 }),
  
  pickupLocation: text("pickup_location"),
  dropoffLocation: text("dropoff_location"),
  isTalaRiga: boolean("is_tala_riga").default(false),
  isPieriga: boolean("is_pieriga").default(false),
  
  hasRati: boolean("has_rati").default(false),
  hasTehniskaPalidziba: boolean("has_tehniska_palidziba").default(false),
  hasDarbsNakti: boolean("has_darbs_nakti").default(false),
  
  paymentType: varchar("payment_type", { length: 50 }),
  
  extraCosts: decimal("extra_costs", { precision: 10, scale: 2 }),
  extraCostsDescription: text("extra_costs_description"),
  
  tripDate: timestamp("trip_date").notNull().defaultNow(),
  notes: text("notes"),
  paymentNotes: text("payment_notes"),
  
  status: tripStatusEnum("status").default("draft").notNull(),
  adminNotes: text("admin_notes"),
  costCalculated: decimal("cost_calculated", { precision: 10, scale: 2 }),
  
  attachments: jsonb("attachments").default([]),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  trips: many(trips),
}));

export const clientsRelations = relations(clients, ({ many }) => ({
  trips: many(trips),
}));

export const tripsRelations = relations(trips, ({ one }) => ({
  driver: one(users, {
    fields: [trips.driverId],
    references: [users.id],
  }),
  client: one(clients, {
    fields: [trips.clientId],
    references: [clients.id],
  }),
}));

// Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTripSchema = createInsertSchema(trips).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  costCalculated: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;

export type Trip = typeof trips.$inferSelect;
export type InsertTrip = z.infer<typeof insertTripSchema>;

// Extended types with relations
export type TripWithRelations = Trip & {
  driver?: User;
  client?: Client;
};
