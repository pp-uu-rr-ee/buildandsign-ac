import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  pgEnum,
  jsonb,
  numeric,
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

/**
 * A product represents a *series* (e.g. "Carrier Inverter Split Type"). The
 * customer-facing fields below are shared across all sizes/configurations.
 * Concrete buyable SKUs live in `product_variants`.
 */
export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  nameTh: varchar("name_th", { length: 255 }),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  descriptionTh: text("description_th"),
  shortDescription: text("short_description"),
  shortDescriptionTh: text("short_description_th"),
  category: productCategoryEnum("category").notNull(),
  status: productStatusEnum("status").notNull().default("draft"),

  // ── Typed series-level specs ─────────────────────────────────────────────
  // These are filterable/searchable so we keep them as real columns.
  brand: varchar("brand", { length: 100 }),
  // EER as decimal for sorting (e.g. 12.50). Drizzle returns numerics as
  // strings — formatters handle the cast.
  eer: numeric("eer", { precision: 5, scale: 2 }),
  voltage: varchar("voltage", { length: 60 }),
  refrigerant: varchar("refrigerant", { length: 20 }),
  warrantyText: text("warranty_text"),

  // Anything else goes into JSONB — keeps the schema future-proof for specs
  // we didn't think of (WiFi, smart features, color options, etc.).
  specifications: jsonb("specifications").$type<Record<string, string>>(),

  // SEO
  metaTitle: varchar("meta_title", { length: 160 }),
  metaDescription: varchar("meta_description", { length: 320 }),

  isFeatured: boolean("is_featured").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * One buyable SKU of a product series. Stores the size-specific price, stock,
 * and any spec values that differ per variant.
 */
export const productVariants = pgTable("product_variants", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),

  // Display label for the variant — e.g. "1.0 HP", "1.5 HP", "2.0 HP".
  size: varchar("size", { length: 50 }).notNull(),
  // Smaller = shown first in the picker.
  sortOrder: integer("sort_order").notNull().default(0),

  sku: varchar("sku", { length: 100 }).unique(),

  priceInSatang: integer("price_in_satang").notNull(),
  comparePriceInSatang: integer("compare_price_in_satang"),

  stock: integer("stock").notNull().default(0),
  lowStockThreshold: integer("low_stock_threshold").notNull().default(5),

  // ── Typed variant-level specs ────────────────────────────────────────────
  // The most-displayed numbers for AC sizing — kept as real columns so we can
  // filter ("9,000–12,000 BTU") and sort.
  coolingCapacityBtu: integer("cooling_capacity_btu"),
  noiseLevelDb: numeric("noise_level_db", { precision: 4, scale: 1 }),
  // Thai energy efficiency label, picked per size from a fixed set:
  // "5", "5*", "5**", "5***". Asterisks render as star icons on the storefront.
  energyRating: varchar("energy_rating", { length: 50 }),
  // Recommended room size in square metres. Stored as varchar so admins can
  // enter ranges like "25-30" or "Up to 18" — they're displayed verbatim and
  // we don't need to sort/filter on it.
  roomSizeSqm: varchar("room_size_sqm", { length: 30 }),

  // Variant-specific specs that don't fit the typed columns above (color,
  // extra features, etc.). Merged with the typed values on display.
  specifications: jsonb("specifications").$type<Record<string, string>>(),

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
  variants: many(productVariants),
  orderItems: many(orderItems),
}));

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
}));
