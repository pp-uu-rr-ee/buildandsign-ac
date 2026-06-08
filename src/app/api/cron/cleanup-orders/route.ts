import { NextResponse } from "next/server";
import { cleanupStalePendingOrders } from "@/lib/actions/orders";
import { cleanupStalePendingBookings } from "@/lib/actions/bookings";

/**
 * Cron endpoint — cancels abandoned pending+unpaid card-payment
 * orders AND bookings. Trigger every 15 minutes from your cron provider
 * (Vercel Cron, Upstash, GitHub Actions, etc).
 *
 * Auth: send header `X-Cron-Secret: <CRON_SECRET>`.
 * If CRON_SECRET is unset the endpoint refuses all requests.
 */
export async function POST(request: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 503 }
    );
  }

  const provided =
    request.headers.get("x-cron-secret") ??
    request.headers.get("X-Cron-Secret");

  if (provided !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [ordersCancelled, bookingsCancelled] = await Promise.all([
      cleanupStalePendingOrders(30),
      cleanupStalePendingBookings(30),
    ]);
    return NextResponse.json({
      ok: true,
      orders: ordersCancelled,
      bookings: bookingsCancelled,
    });
  } catch (err) {
    console.error("[cron] cleanup failed:", err);
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
}

// Also allow GET for ease of manual checks
export async function GET(request: Request) {
  return POST(request);
}
