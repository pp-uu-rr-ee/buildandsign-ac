import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  numeric,
  timestamp,
  pgEnum,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { products, productVariants } from "./products";

export const orderStatusEnum = pgEnum("order_status", [
  "pending",       // inquiry submitted, awaiting admin contact
  "confirmed",     // admin has confirmed the order after contact
  "processing",    // being packed
  "shipped",       // in transit
  "delivered",     // received by customer
  "cancelled",
]);

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderNumber: varchar("order_number", { length: 50 }).notNull().unique(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),

  status: orderStatusEnum("status").notNull().default("pending"),

  // Totals in satang (1 THB = 100 satang) — these are an estimate; final
  // price is confirmed by staff after the inquiry contact.
  subtotalInSatang: integer("subtotal_in_satang").notNull(),
  shippingInSatang: integer("shipping_in_satang").notNull().default(0),
  taxInSatang: integer("tax_in_satang").notNull().default(0),
  discountInSatang: integer("discount_in_satang").notNull().default(0),
  totalInSatang: integer("total_in_satang").notNull(),

  // Shipping address snapshotted at order time (denormalized intentionally)
  shippingAddress: jsonb("shipping_address")
    .$type<{
      fullName: string;
      email?: string;
      phone: string;
      addressLine1: string;
      addressLine2?: string;
      city: string;
      province: string;
      postalCode: string;
      country: string;
    }>()
    .notNull(),

  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id").references(() => products.id, {
    onDelete: "set null",
  }),
  productVariantId: uuid("product_variant_id").references(
    () => productVariants.id,
    { onDelete: "set null" }
  ),

  // Snapshot product details at purchase time — products may change later
  productName: varchar("product_name", { length: 255 }).notNull(),
  // Variant label snapshot (e.g. "1.5 HP") so historical orders stay readable
  // even if the variant row is deleted.
  productVariantSize: varchar("product_variant_size", { length: 50 }),
  productSku: varchar("product_sku", { length: 100 }),
  unitPriceInSatang: integer("unit_price_in_satang").notNull(),
  quantity: integer("quantity").notNull(),
  totalInSatang: integer("total_in_satang").notNull(),
});

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [orderItems.productVariantId],
    references: [productVariants.id],
  }),
}));
