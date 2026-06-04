import {
  pgTable,
  uuid,
  varchar,
  integer,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";

export const savedCards = pgTable(
  "saved_cards",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    opnCardId: varchar("opn_card_id", { length: 255 }).notNull().unique(),
    last4: varchar("last4", { length: 4 }).notNull(),
    brand: varchar("brand", { length: 50 }),
    expMonth: integer("exp_month").notNull(),
    expYear: integer("exp_year").notNull(),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("saved_cards_user_idx").on(t.userId)]
);

export const savedCardsRelations = relations(savedCards, ({ one }) => ({
  user: one(users, { fields: [savedCards.userId], references: [users.id] }),
}));
