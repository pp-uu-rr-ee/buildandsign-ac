import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  pgEnum,
  jsonb,
  integer,
  time,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { bookings } from "./bookings";

export const technicianStatusEnum = pgEnum("technician_status", [
  "active",
  "inactive",
  "on_leave",
]);

// Represents a technician's profile (linked 1-to-1 with a user of role=technician)
export const technicians = pgTable("technicians", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),

  status: technicianStatusEnum("status").notNull().default("active"),
  bio: text("bio"),

  // Services this technician is certified for
  specializations: jsonb("specializations")
    .$type<("cleaning" | "repair" | "installation" | "inspection")[]>()
    .notNull()
    .default([]),

  // Configurable weekly schedule — keys are 0=Sun ... 6=Sat
  // Each day has working hours or null if day off
  weeklySchedule: jsonb("weekly_schedule")
    .$type<
      Record<
        string,
        { startTime: string; endTime: string; slotDurationMinutes: number } | null
      >
    >()
    .notNull()
    .default({}),

  // Rating aggregates (updated via trigger or background job)
  totalRatings: integer("total_ratings").notNull().default(0),
  averageRating: integer("average_rating").notNull().default(0), // stored as x10 (e.g. 45 = 4.5)

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Explicit blocked/unavailable date ranges (vacation, sick leave, etc.)
export const technicianUnavailabilities = pgTable(
  "technician_unavailabilities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    technicianId: uuid("technician_id")
      .notNull()
      .references(() => technicians.id, { onDelete: "cascade" }),
    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date").notNull(),
    reason: varchar("reason", { length: 255 }),
  }
);

export const techniciansRelations = relations(
  technicians,
  ({ one, many }) => ({
    user: one(users, {
      fields: [technicians.userId],
      references: [users.id],
    }),
    bookings: many(bookings),
    unavailabilities: many(technicianUnavailabilities),
  })
);

export const technicianUnavailabilitiesRelations = relations(
  technicianUnavailabilities,
  ({ one }) => ({
    technician: one(technicians, {
      fields: [technicianUnavailabilities.technicianId],
      references: [technicians.id],
    }),
  })
);
