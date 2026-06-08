import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, bookings } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  retrieveCharge,
  verifyWebhookSecret,
  type OpnEvent,
  type OpnCharge,
} from "@/lib/payment/opn";
import { confirmOrderAtomic } from "@/lib/actions/orders";
import { markDepositPaid, markBalancePaid } from "@/lib/actions/bookings";
import { sendOrderReceipt } from "@/lib/email";

/**
 * Opn Payments webhook handler — server-to-server source of truth.
 *
 * Configure in the Opn dashboard:
 *   URL:    https://<your-domain>/api/payment/webhook
 *   Header: X-Webhook-Secret = <PAYMENT_WEBHOOK_SECRET>
 *   Events: charge.complete (at minimum)
 *
 * Handles BOTH order and booking charges, dispatched by charge metadata:
 *   - metadata.orderId        → order
 *   - metadata.bookingId      → booking (kind = "deposit" | "balance")
 *
 * Idempotent: each handler skips when target is already in the target status.
 */
export async function POST(request: Request) {
  // ── 1. Verify shared secret ──────────────────────────────────────────────
  const secretHeader =
    request.headers.get("x-webhook-secret") ??
    request.headers.get("X-Webhook-Secret");

  if (!verifyWebhookSecret(secretHeader)) {
    console.warn("[webhook] unauthorized request");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── 2. Parse event payload ───────────────────────────────────────────────
  let event: OpnEvent;
  try {
    event = (await request.json()) as OpnEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (event.object !== "event" || !event.key) {
    return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  }

  if (!event.key.startsWith("charge.")) {
    return NextResponse.json({ ok: true, ignored: event.key });
  }

  // Always re-fetch from Opn — never trust the webhook body alone.
  const eventData = event.data as OpnCharge | undefined;
  const chargeId = eventData?.id;
  if (!chargeId || typeof chargeId !== "string") {
    return NextResponse.json({ error: "No charge id" }, { status: 400 });
  }

  let charge: OpnCharge;
  try {
    charge = await retrieveCharge(chargeId);
  } catch (err) {
    console.error("[webhook] retrieveCharge failed:", err);
    return NextResponse.json({ error: "Charge fetch failed" }, { status: 502 });
  }

  // ── 3. Dispatch by metadata ──────────────────────────────────────────────
  if (charge.metadata?.bookingId) {
    return handleBookingCharge(charge);
  }
  if (charge.metadata?.orderId) {
    return handleOrderCharge(charge);
  }

  console.warn("[webhook] charge missing both orderId and bookingId metadata:", chargeId);
  return NextResponse.json({ ok: true, ignored: "no metadata" });
}

// ─── Order charges ──────────────────────────────────────────────────────────

async function handleOrderCharge(charge: OpnCharge): Promise<Response> {
  const orderId = charge.metadata!.orderId;

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!order) {
    console.warn("[webhook] order not found:", orderId);
    return NextResponse.json({ ok: true, ignored: "no order" });
  }

  if (order.paymentReference && order.paymentReference !== charge.id) {
    console.error("[webhook] order paymentReference mismatch:", {
      orderId: order.id,
      onOrder: order.paymentReference,
      fromWebhook: charge.id,
    });
    return NextResponse.json({ error: "Charge mismatch" }, { status: 409 });
  }

  if (
    charge.amount !== order.totalInSatang ||
    charge.currency.toUpperCase() !== "THB"
  ) {
    console.error("[webhook] order amount/currency mismatch:", {
      orderId: order.id,
      chargeAmount: charge.amount,
      orderTotal: order.totalInSatang,
      currency: charge.currency,
    });
    return NextResponse.json({ error: "Amount mismatch" }, { status: 409 });
  }

  if (charge.status === "successful" && order.paymentStatus !== "paid") {
    if (!order.paymentReference) {
      await db
        .update(orders)
        .set({ paymentReference: charge.id })
        .where(eq(orders.id, order.id));
    }

    const items = await db
      .select({
        productId: orderItems.productId,
        quantity: orderItems.quantity,
      })
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id));

    const nonNullItems = items.filter(
      (i): i is { productId: string; quantity: number } => i.productId !== null
    );

    try {
      await confirmOrderAtomic(order.id, nonNullItems);
    } catch (err) {
      console.error("[CRITICAL] webhook confirmOrderAtomic failed:", err);
      return NextResponse.json({ error: "Confirm failed" }, { status: 500 });
    }

    const addr = order.shippingAddress;
    if (addr?.email) {
      const allItems = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id));

      try {
        await sendOrderReceipt({
          to: addr.email,
          orderNumber: order.orderNumber,
          customerName: addr.fullName,
          customerEmail: addr.email,
          items: allItems.map((i) => ({
            productName: i.productName,
            quantity: i.quantity,
            unitPriceInSatang: i.unitPriceInSatang,
            totalInSatang: i.totalInSatang,
          })),
          subtotalInSatang: order.subtotalInSatang,
          shippingInSatang: order.shippingInSatang,
          totalInSatang: order.totalInSatang,
          paymentMethod: order.paymentMethod ?? "card",
          shippingAddress: {
            fullName: addr.fullName,
            phone: addr.phone,
            addressLine1: addr.addressLine1,
            addressLine2: addr.addressLine2,
            city: addr.city,
            province: addr.province,
            postalCode: addr.postalCode,
          },
          orderId: order.id,
        });
      } catch (err) {
        console.error("[email] order receipt failed in webhook:", err);
      }
    }

    return NextResponse.json({ ok: true, kind: "order", confirmed: order.id });
  }

  if (
    (charge.status === "failed" || charge.status === "expired") &&
    order.status !== "cancelled"
  ) {
    await db
      .update(orders)
      .set({ status: "cancelled", paymentStatus: "failed" })
      .where(eq(orders.id, order.id));
    return NextResponse.json({ ok: true, kind: "order", cancelled: order.id });
  }

  return NextResponse.json({ ok: true, kind: "order", noop: true });
}

// ─── Booking charges (deposit OR balance) ───────────────────────────────────

async function handleBookingCharge(charge: OpnCharge): Promise<Response> {
  const bookingId = charge.metadata!.bookingId;
  const kind = charge.metadata?.kind;

  if (kind !== "deposit" && kind !== "balance") {
    console.warn("[webhook] booking charge missing kind metadata:", charge.id);
    return NextResponse.json({ ok: true, ignored: "no kind" });
  }

  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (!booking) {
    console.warn("[webhook] booking not found:", bookingId);
    return NextResponse.json({ ok: true, ignored: "no booking" });
  }

  // Cross-check the right payment reference field for this kind
  const expectedRef =
    kind === "deposit"
      ? booking.depositPaymentReference
      : booking.balancePaymentReference;

  if (expectedRef && expectedRef !== charge.id) {
    console.error("[webhook] booking paymentReference mismatch:", {
      bookingId: booking.id,
      kind,
      onBooking: expectedRef,
      fromWebhook: charge.id,
    });
    return NextResponse.json({ error: "Charge mismatch" }, { status: 409 });
  }

  const expectedAmount =
    kind === "deposit" ? booking.depositInSatang : booking.balanceInSatang;

  if (
    expectedAmount == null ||
    charge.amount !== expectedAmount ||
    charge.currency.toUpperCase() !== "THB"
  ) {
    console.error("[webhook] booking amount/currency mismatch:", {
      bookingId: booking.id,
      kind,
      chargeAmount: charge.amount,
      expectedAmount,
      currency: charge.currency,
    });
    return NextResponse.json({ error: "Amount mismatch" }, { status: 409 });
  }

  // Lock-in paymentReference if not set (race between webhook + return URL)
  if (!expectedRef) {
    const ref =
      kind === "deposit"
        ? { depositPaymentReference: charge.id }
        : { balancePaymentReference: charge.id };
    await db.update(bookings).set(ref).where(eq(bookings.id, booking.id));
  }

  // ── Successful charge ─────────────────────────────────────────────────
  const currentStatus =
    kind === "deposit"
      ? booking.depositPaymentStatus
      : booking.balancePaymentStatus;

  if (charge.status === "successful" && currentStatus !== "paid") {
    try {
      if (kind === "deposit") {
        await markDepositPaid(booking.id);
      } else {
        await markBalancePaid(booking.id);
      }
    } catch (err) {
      console.error(`[CRITICAL] webhook mark${kind}Paid failed:`, err);
      return NextResponse.json({ error: "Mark-paid failed" }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      kind: `booking-${kind}`,
      confirmed: booking.id,
    });
  }

  if (charge.status === "failed" || charge.status === "expired") {
    if (kind === "deposit" && booking.status !== "cancelled") {
      await db
        .update(bookings)
        .set({ status: "cancelled", depositPaymentStatus: "failed" })
        .where(eq(bookings.id, booking.id));
    } else if (kind === "balance" && booking.balancePaymentStatus !== "failed") {
      await db
        .update(bookings)
        .set({ balancePaymentStatus: "failed" })
        .where(eq(bookings.id, booking.id));
    }
    return NextResponse.json({
      ok: true,
      kind: `booking-${kind}`,
      cancelled: booking.id,
    });
  }

  return NextResponse.json({ ok: true, kind: `booking-${kind}`, noop: true });
}
