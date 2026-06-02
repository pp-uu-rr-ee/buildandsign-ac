import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { orders } from "./orders";
import { bookings } from "./bookings";

export const userRoleEnum = pgEnum("user_role", [
  "customer",
  "admin",
  "technician",
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  phone: varchar("phone", { length: 20 }),
  role: userRoleEnum("role").notNull().default("customer"),
  emailVerified: boolean("email_verified").notNull().default(false),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ many, one }) => ({
  orders: many(orders),
  bookings: many(bookings),
  // A user who is a technician has one technician profile
  technicianProfile: one(technicians, {
    fields: [users.id],
    references: [technicians.userId],
  }),
}));

// Import here to avoid circular deps — technicians references users
import { technicians } from "./technicians";
