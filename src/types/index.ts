import type {
  users,
  products,
  productImages,
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

export type OrderWithItems = Order & {
  items: OrderItem[];
  user: User | null;
};

export type BookingWithDetails = Booking & {
  user: User | null;
  technician: (Technician & { user: User }) | null;
};

// ─── Cart (client-side only, not persisted to DB) ────────────────────────────
export type CartItem = {
  productId: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  unitPriceInCents: number;
  quantity: number;
};

export type Cart = {
  items: CartItem[];
  totalInCents: number;
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
