import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["CUSTOMER", "WORKSHOP", "ADMIN"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  address: text("address"),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("CUSTOMER"),
  notificationsEnabled: boolean("notifications_enabled").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const vehicles = pgTable("vehicles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  version: text("version"),
  plate: text("plate"),
  mileage: integer("mileage"),
  fuel: text("fuel").notNull().default("Flex"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const workshops = pgTable("workshops", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id").references(() => users.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull().default("SP"),
  phone: text("phone"),
  rating: doublePrecision("rating").notNull().default(5),
  reviewCount: integer("review_count").notNull().default(0),
  distanceKm: doublePrecision("distance_km").notNull().default(0),
  isOpen: boolean("is_open").notNull().default(true),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const workshopServices = pgTable("workshop_services", {
  id: uuid("id").primaryKey().defaultRandom(),
  workshopId: uuid("workshop_id").notNull().references(() => workshops.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  priceFrom: integer("price_from").notNull().default(0),
  durationMinutes: integer("duration_minutes").notNull().default(60),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const serviceRequests = pgTable("service_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  protocol: text("protocol").notNull().unique(),
  customerId: uuid("customer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  vehicleId: uuid("vehicle_id").references(() => vehicles.id, { onDelete: "set null" }),
  workshopId: uuid("workshop_id").references(() => workshops.id, { onDelete: "set null" }),
  serviceType: text("service_type").notNull(),
  description: text("description").notNull(),
  preferredAt: timestamp("preferred_at", { withTimezone: true }),
  attachments: jsonb("attachments").$type<string[]>().notNull().default([]),
  status: text("status").notNull().default("REQUESTED"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const serviceOrders = pgTable("service_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestId: uuid("request_id").notNull().unique().references(() => serviceRequests.id, { onDelete: "cascade" }),
  customerId: uuid("customer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  workshopId: uuid("workshop_id").notNull().references(() => workshops.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  status: text("status").notNull().default("SCHEDULED"),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  priceInCents: integer("price_in_cents"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const quotes = pgTable("quotes", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestId: uuid("request_id").notNull().references(() => serviceRequests.id, { onDelete: "cascade" }),
  workshopId: uuid("workshop_id").notNull().references(() => workshops.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  totalPriceInCents: integer("total_price_in_cents").notNull(),
  status: text("status").notNull().default("PENDING"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  workshopId: uuid("workshop_id").notNull().references(() => workshops.id, { onDelete: "cascade" }),
  orderId: uuid("order_id").references(() => serviceOrders.id, { onDelete: "set null" }),
  rating: integer("rating").notNull(),
  comment: text("comment").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const savedWorkshops = pgTable("saved_workshops", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  workshopId: uuid("workshop_id").notNull().references(() => workshops.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("saved_workshops_user_workshop_unique").on(table.userId, table.workshopId)]);

export const towRequests = pgTable("tow_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  protocol: text("protocol").notNull().unique(),
  customerId: uuid("customer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  vehicleId: uuid("vehicle_id").references(() => vehicles.id, { onDelete: "set null" }),
  location: text("location").notNull(),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  problem: text("problem").notNull(),
  status: text("status").notNull().default("REQUESTED"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const diagnosticRequests = pgTable("diagnostic_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  vehicleId: uuid("vehicle_id").references(() => vehicles.id, { onDelete: "set null" }),
  symptom: text("symptom").notNull(),
  answers: jsonb("answers").$type<Record<string, string>>().notNull().default({}),
  possibleCauses: jsonb("possible_causes").$type<string[]>().notNull().default([]),
  attentionLevel: text("attention_level").notNull().default("LOW"),
  recommendation: text("recommendation").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  message: text("message").notNull(),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
