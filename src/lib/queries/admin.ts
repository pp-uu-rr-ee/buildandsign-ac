import { db } from "@/db";
import {
  orders, orderItems, bookings, products,
  technicians, users, productImages,
} from "@/db/schema";
import { desc, eq, sql, and, ilike, count, gte, lt } from "drizzle-orm";

// ── Dashboard stats ──────────────────────────────────────────────────────────
export async function getDashboardStats() {
  const [
    [{ totalOrders }],
    [{ pendingOrders }],
    [{ totalRevenue }],
    [{ totalBookings }],
    [{ pendingBookings }],
    [{ totalProducts }],
    [{ lowStock }],
    [{ totalCustomers }],
  ] = await Promise.all([
    db.select({ totalOrders: count() }).from(orders),
    db.select({ pendingOrders: count() }).from(orders).where(eq(orders.status, "pending")),
    db.select({ totalRevenue: sql<number>`coalesce(sum(total_in_satang),0)::int` }).from(orders).where(eq(orders.paymentStatus, "paid")),
    db.select({ totalBookings: count() }).from(bookings),
    db.select({ pendingBookings: count() }).from(bookings).where(eq(bookings.status, "pending")),
    db.select({ totalProducts: count() }).from(products),
    db.select({ lowStock: count() }).from(products).where(sql`stock <= low_stock_threshold AND status = 'active'`),
    db.select({ totalCustomers: count() }).from(users).where(eq(users.role, "customer")),
  ]);

  return { totalOrders, pendingOrders, totalRevenue, totalBookings, pendingBookings, totalProducts, lowStock, totalCustomers };
}

// ── Recent orders ────────────────────────────────────────────────────────────
export async function getRecentOrders(limit = 8) {
  return db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      paymentStatus: orders.paymentStatus,
      totalInSatang: orders.totalInSatang,
      customerName: orders.shippingAddress,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .orderBy(desc(orders.createdAt))
    .limit(limit);
}

// ── Orders list (paginated + filterable) ─────────────────────────────────────
export async function getOrders({ page = 1, limit = 15, status }: { page?: number; limit?: number; status?: string }) {
  const where = status ? eq(orders.status, status as any) : undefined;
  const offset = (page - 1) * limit;

  const [rows, [{ total }]] = await Promise.all([
    db.select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      paymentStatus: orders.paymentStatus,
      paymentMethod: orders.paymentMethod,
      totalInSatang: orders.totalInSatang,
      shippingAddress: orders.shippingAddress,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(where)
    .orderBy(desc(orders.createdAt))
    .limit(limit)
    .offset(offset),

    db.select({ total: count() }).from(orders).where(where),
  ]);

  return { rows, total, pages: Math.ceil(total / limit), page };
}

export async function getOrderById(id: string) {
  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) return null;
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
  return { ...order, items };
}

// ── Bookings list (paginated + filterable) ───────────────────────────────────
export async function getBookings({ page = 1, limit = 15, status }: { page?: number; limit?: number; status?: string }) {
  const where = status ? eq(bookings.status, status as any) : undefined;
  const offset = (page - 1) * limit;

  const [rows, [{ total }]] = await Promise.all([
    db.select({
      id: bookings.id,
      bookingNumber: bookings.bookingNumber,
      serviceType: bookings.serviceType,
      status: bookings.status,
      scheduledAt: bookings.scheduledAt,
      durationMinutes: bookings.durationMinutes,
      serviceAddress: bookings.serviceAddress,
      quotedPriceInSatang: bookings.quotedPriceInSatang,
      technicianName: users.name,
      technicianId: bookings.technicianId,
    })
    .from(bookings)
    .leftJoin(technicians, eq(technicians.id, bookings.technicianId))
    .leftJoin(users, eq(users.id, technicians.userId))
    .where(where)
    .orderBy(desc(bookings.scheduledAt))
    .limit(limit)
    .offset(offset),

    db.select({ total: count() }).from(bookings).where(where),
  ]);

  return { rows, total, pages: Math.ceil(total / limit), page };
}

export async function getBookingById(id: string) {
  const [row] = await db
    .select({
      booking: bookings,
      technicianName: users.name,
    })
    .from(bookings)
    .leftJoin(technicians, eq(technicians.id, bookings.technicianId))
    .leftJoin(users, eq(users.id, technicians.userId))
    .where(eq(bookings.id, id))
    .limit(1);
  return row ?? null;
}

// ── Products admin ───────────────────────────────────────────────────────────
export async function getAdminProducts({ page = 1, limit = 15, search }: { page?: number; limit?: number; search?: string }) {
  const where = search ? ilike(products.name, `%${search}%`) : undefined;
  const offset = (page - 1) * limit;

  const [rows, [{ total }]] = await Promise.all([
    db.select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      category: products.category,
      status: products.status,
      priceInSatang: products.priceInSatang,
      stock: products.stock,
      lowStockThreshold: products.lowStockThreshold,
      isFeatured: products.isFeatured,
      createdAt: products.createdAt,
      primaryImage: { url: productImages.url },
    })
    .from(products)
    .leftJoin(productImages, and(eq(productImages.productId, products.id), eq(productImages.isPrimary, true)))
    .where(where)
    .orderBy(desc(products.createdAt))
    .limit(limit)
    .offset(offset),

    db.select({ total: count() }).from(products).where(where),
  ]);

  return { rows, total, pages: Math.ceil(total / limit), page };
}

// ── Technicians admin ────────────────────────────────────────────────────────
export async function getAdminTechnicians() {
  return db
    .select({
      id: technicians.id,
      status: technicians.status,
      specializations: technicians.specializations,
      averageRating: technicians.averageRating,
      totalRatings: technicians.totalRatings,
      name: users.name,
      email: users.email,
      phone: users.phone,
      createdAt: technicians.createdAt,
    })
    .from(technicians)
    .innerJoin(users, eq(users.id, technicians.userId))
    .orderBy(users.name);
}

// ── Calendar ─────────────────────────────────────────────────────────────────

export type CalendarBooking = {
  id: string;
  bookingNumber: string;
  serviceType: string;
  status: string;
  scheduledAt: Date;
  durationMinutes: number;
  customerName: string;
  customerCity: string;
  customerPhone: string;
  technicianId: string | null;
  technicianName: string | null;
  technicianPhone: string | null;
  technicianStatus: string | null;
  technicianSpecializations: string[] | null;
  technicianRating: number | null; // 0–50 (x10)
  technicianTotalRatings: number | null;
};

/**
 * Returns bookings whose scheduledAt falls within [start, end).
 * Optionally restricted to a single technician (used by the technician portal).
 */
export async function getCalendarBookings(opts: {
  start: Date;
  end: Date;
  technicianId?: string | null;
}): Promise<CalendarBooking[]> {
  const filters = [
    gte(bookings.scheduledAt, opts.start),
    lt(bookings.scheduledAt, opts.end),
  ];
  if (opts.technicianId) {
    filters.push(eq(bookings.technicianId, opts.technicianId));
  }

  const rows = await db
    .select({
      id: bookings.id,
      bookingNumber: bookings.bookingNumber,
      serviceType: bookings.serviceType,
      status: bookings.status,
      scheduledAt: bookings.scheduledAt,
      durationMinutes: bookings.durationMinutes,
      serviceAddress: bookings.serviceAddress,
      technicianId: bookings.technicianId,
      technicianName: users.name,
      technicianPhone: users.phone,
      technicianStatus: technicians.status,
      technicianSpecializations: technicians.specializations,
      technicianRating: technicians.averageRating,
      technicianTotalRatings: technicians.totalRatings,
    })
    .from(bookings)
    .leftJoin(technicians, eq(technicians.id, bookings.technicianId))
    .leftJoin(users, eq(users.id, technicians.userId))
    .where(and(...filters))
    .orderBy(bookings.scheduledAt);

  return rows.map((r) => ({
    id: r.id,
    bookingNumber: r.bookingNumber,
    serviceType: r.serviceType,
    status: r.status,
    scheduledAt: r.scheduledAt,
    durationMinutes: r.durationMinutes,
    customerName: r.serviceAddress.fullName,
    customerCity: r.serviceAddress.city,
    customerPhone: r.serviceAddress.phone,
    technicianId: r.technicianId,
    technicianName: r.technicianName ?? null,
    technicianPhone: r.technicianPhone ?? null,
    technicianStatus: r.technicianStatus ?? null,
    technicianSpecializations:
      (r.technicianSpecializations as string[] | null) ?? null,
    technicianRating: r.technicianRating ?? null,
    technicianTotalRatings: r.technicianTotalRatings ?? null,
  }));
}

/**
 * Resolve the technician profile id for a given userId (used in the
 * technician portal to scope queries).
 */
export async function getTechnicianIdForUser(
  userId: string
): Promise<string | null> {
  const [row] = await db
    .select({ id: technicians.id })
    .from(technicians)
    .where(eq(technicians.userId, userId))
    .limit(1);
  return row?.id ?? null;
}

// ── Selectors ────────────────────────────────────────────────────────────────
export async function getActiveTechnicianOptions() {
  const rows = await db
    .select({ id: technicians.id, name: users.name })
    .from(technicians)
    .innerJoin(users, eq(users.id, technicians.userId))
    .where(eq(technicians.status, "active"));
  return rows;
}
