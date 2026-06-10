import type {
  users,
  products,
  productImages,
  productVariants,
  orders,
  orderItems,
  bookings,
  technicians,
  posts,
  productCategoryEnum,
} from "@/db/schema";

export type ProductCategoryEnum = (typeof productCategoryEnum.enumValues)[number];

// ─── Inferred DB types ───────────────────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type ProductImage = typeof productImages.$inferSelect;
export type ProductVariant = typeof productVariants.$inferSelect;
export type NewProductVariant = typeof productVariants.$inferInsert;

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;

export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;

export type Technician = typeof technicians.$inferSelect;

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;

// ─── Composite / joined types ────────────────────────────────────────────────
export type ProductWithImages = Product & { images: ProductImage[] };
export type ProductWithVariants = Product & {
  images: ProductImage[];
  variants: ProductVariant[];
};

export type OrderWithItems = Order & {
  items: OrderItem[];
  user: User | null;
};

export type BookingWithDetails = Booking & {
  user: User | null;
  technician: (Technician & { user: User }) | null;
};

// ─── Cart (client-side only, not persisted to DB) ────────────────────────────
// Cart is keyed by variantId — each size of a series is a separate line item.
export type CartItem = {
  variantId: string;
  productId: string;
  name: string;            // product (series) name snapshot
  size: string;            // variant size snapshot, e.g. "1.5 HP"
  slug: string;            // product slug for link
  imageUrl: string | null;
  unitPriceInSatang: number;
  quantity: number;
};

export type Cart = {
  items: CartItem[];
  totalInSatang: number;
  itemCount: number;
};

// ─── Availability slot returned by the booking engine ────────────────────────
export type TimeSlot = {
  technicianId: string;
  technicianName: string;
  date: string;         // ISO date "YYYY-MM-DD"
  startTime: string;    // "HH:MM"
  endTime: string;      // "HH:MM"
  isAvailable: boolean;
};
