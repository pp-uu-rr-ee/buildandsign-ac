import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  pgEnum,
  jsonb,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { technicians } from "./technicians";

export const serviceTypeEnum = pgEnum("service_type", [
  "cleaning",       // routine AC cleaning/maintenance
  "repair",         // diagnosis and repair
  "installation",   // new unit installation
  "inspection",     // general inspection / health check
]);

export const bookingStatusEnum = pgEnum("booking_status", [
  "pending",        // submitted, awaiting confirmation
  "confirmed",      // technician and time slot locked in
  "in_progress",    // technician checked in on-site
  "completed",      // job done
  "cancelled",
  "no_show",        // customer wasn't home
]);

export const bookings = pgTable("bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingNumber: varchar("booking_number", { length: 50 }).notNull().unique(),

  // Who booked
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),

  // Which technician is assigned (null = unassigned / auto-assign pending)
  technicianId: uuid("technician_id").references(() => technicians.id, {
    onDelete: "set null",
  }),

  serviceType: serviceTypeEnum("service_type").notNull(),
  status: bookingStatusEnum("status").notNull().default("pending"),

  // Scheduled window
  scheduledAt: timestamp("scheduled_at").notNull(),
  durationMinutes: integer("duration_minutes").notNull().default(60),

  // Pricing in cents (quoted at booking time)
  quotedPriceInCents: integer("quoted_price_in_cents"),
  finalPriceInCents: integer("final_price_in_cents"),

  // Service location — captured at booking time
  serviceAddress: jsonb("service_address")
    .$type<{
      fullName: string;
      phone: string;
      addressLine1: string;
      addressLine2?: string;
      city: string;
      province: string;
      postalCode: string;
    }>()
    .notNull(),

  // AC unit details provided by customer
  acUnitDetails: jsonb("ac_unit_details").$type<{
    brand?: string;
    model?: string;
    yearInstalled?: number;
    type?: string; // split, window, etc.
    notes?: string;
  }>(),

  // Optional: linked to a product purchase (installation of a purchased unit)
  linkedOrderId: uuid("linked_order_id"),

  customerNotes: text("customer_notes"),
  technicianNotes: text("technician_notes"),

  // Review left by customer after completion
  reviewRating: integer("review_rating"), // 1–5
  reviewComment: text("review_comment"),
  reviewedAt: timestamp("reviewed_at"),

  reminderSentAt: timestamp("reminder_sent_at"),
  completedAt: timestamp("completed_at"),
  cancelledAt: timestamp("cancelled_at"),
  cancellationReason: text("cancellation_reason"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const bookingsRelations = relations(bookings, ({ one }) => ({
  user: one(users, { fields: [bookings.userId], references: [users.id] }),
  technician: one(technicians, {
    fields: [bookings.technicianId],
    references: [technicians.id],
  }),
}));
