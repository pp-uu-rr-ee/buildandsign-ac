import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
  boolean,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { orders } from "./orders";
import { bookings } from "./bookings";

export const userRoleEnum = pgEnum("user_role", [
  "customer",
  "admin",
  "technician",
]);

/** One entry in a customer's saved address book. Name/phone come from the
 *  account, so only the location fields live here. */
export type SavedAddress = {
  id: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  province: string;
  postalCode: string;
  isDefault?: boolean;
};

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  phone: varchar("phone", { length: 20 }),
  role: userRoleEnum("role").notNull().default("customer"),
  emailVerified: boolean("email_verified").notNull().default(false),
  avatarUrl: text("avatar_url"),
  // Customer address book — reused across checkout and booking.
  savedAddresses: jsonb("saved_addresses")
    .$type<SavedAddress[]>()
    .notNull()
    .default([]),
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

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: varchar("token", { length: 128 }).notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    usedAt: timestamp("used_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("password_reset_tokens_user_idx").on(t.userId)]
);

// Import here to avoid circular deps — technicians references users
import { technicians } from "./technicians";
