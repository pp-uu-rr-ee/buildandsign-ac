import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  pgEnum,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { orderItems } from "./orders";

export const productCategoryEnum = pgEnum("product_category", [
  "split",
  "window",
  "portable",
  "central",
  "cassette",
  "ducted",
]);

export const productStatusEnum = pgEnum("product_status", [
  "active",
  "draft",
  "archived",
  "out_of_stock",
]);

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  shortDescription: text("short_description"),
  sku: varchar("sku", { length: 100 }).unique(),
  category: productCategoryEnum("category").notNull(),
  status: productStatusEnum("status").notNull().default("draft"),

  // Pricing — stored as cents (integer) to avoid float precision issues
  priceInCents: integer("price_in_cents").notNull(),
  comparePriceInCents: integer("compare_price_in_cents"), // original/crossed-out price

  stock: integer("stock").notNull().default(0),
  lowStockThreshold: integer("low_stock_threshold").notNull().default(5),

  // Specifications stored as flexible JSON (BTU, EER, dimensions, brand, etc.)
  specifications: jsonb("specifications").$type<Record<string, string>>(),

  // SEO
  metaTitle: varchar("meta_title", { length: 160 }),
  metaDescription: varchar("meta_description", { length: 320 }),

  isFeatured: boolean("is_featured").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const productImages = pgTable("product_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  altText: varchar("alt_text", { length: 255 }),
  isPrimary: boolean("is_primary").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const productsRelations = relations(products, ({ many }) => ({
  images: many(productImages),
  orderItems: many(orderItems),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
}));
