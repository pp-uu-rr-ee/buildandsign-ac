import { db } from "@/db";
import { orders, orderItems, bookings } from "@/db/schema";
import { desc, eq, count } from "drizzle-orm";

export async function getCustomerOrders(userId: string) {
  return db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      paymentStatus: orders.paymentStatus,
      totalInSatang: orders.totalInSatang,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt));
}

export async function getCustomerOrderWithItems(orderId: string, userId: string) {
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!order || order.userId !== userId) return null;

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  return { ...order, items };
}

export async function getCustomerBookings(userId: string) {
  return db
    .select({
      id: bookings.id,
      bookingNumber: bookings.bookingNumber,
      serviceType: bookings.serviceType,
      status: bookings.status,
      scheduledAt: bookings.scheduledAt,
      quotedPriceInSatang: bookings.quotedPriceInSatang,
      finalPriceInSatang: bookings.finalPriceInSatang,
      serviceAddress: bookings.serviceAddress,
      createdAt: bookings.createdAt,
    })
    .from(bookings)
    .where(eq(bookings.userId, userId))
    .orderBy(desc(bookings.scheduledAt));
}

export async function getCustomerStats(userId: string) {
  const [[{ totalOrders }], [{ totalBookings }]] = await Promise.all([
    db.select({ totalOrders: count() }).from(orders).where(eq(orders.userId, userId)),
    db.select({ totalBookings: count() }).from(bookings).where(eq(bookings.userId, userId)),
  ]);
  return { totalOrders, totalBookings };
}
