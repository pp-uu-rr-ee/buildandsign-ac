import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { retrieveCharge } from "@/lib/payment/opn";
import { confirmOrderAtomic } from "@/lib/actions/orders";
import { sendOrderReceipt } from "@/lib/email";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const chargeId = url.searchParams.get("charge_id");

  if (!chargeId || !/^chrg_[a-zA-Z0-9]+$/.test(chargeId)) {
    return NextResponse.redirect(new URL("/checkout?error=invalid", APP_URL));
  }

  // ── 1. Fetch the charge from Opn (source of truth, not the URL) ──────────
  let charge;
  try {
    charge = await retrieveCharge(chargeId);
  } catch (err) {
    console.error("[payment/return] retrieveCharge failed:", err);
    return NextResponse.redirect(
      new URL("/checkout?error=payment_error", APP_URL)
    );
  }

  // ── 2. Find the order ─ must be matched on metadata, not just the id ────
  const expectedOrderId = charge.metadata?.orderId;
  if (!expectedOrderId) {
    console.error("[payment/return] charge missing orderId metadata:", chargeId);
    return NextResponse.redirect(
      new URL("/checkout?error=order_not_found", APP_URL)
    );
  }

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, expectedOrderId))
    .limit(1);

  if (!order) {
    console.error("[payment/return] order not found:", expectedOrderId);
    return NextResponse.redirect(
      new URL("/checkout?error=order_not_found", APP_URL)
    );
  }

  // ── 3. Verify charge actually belongs to this order ──────────────────────
  if (order.paymentReference && order.paymentReference !== charge.id) {
    console.error("[payment/return] paymentReference mismatch:", {
      orderId: order.id,
      onOrder: order.paymentReference,
      fromReturn: charge.id,
    });
    return NextResponse.redirect(
      new URL("/checkout?error=payment_mismatch", APP_URL)
    );
  }

  if (charge.amount !== order.totalInSatang) {
    console.error("[payment/return] amount mismatch:", {
      orderId: order.id,
      chargeAmount: charge.amount,
      orderTotal: order.totalInSatang,
    });
    return NextResponse.redirect(
      new URL("/checkout?error=payment_mismatch", APP_URL)
    );
  }

  if (charge.currency.toUpperCase() !== "THB") {
    console.error("[payment/return] currency mismatch:", {
      orderId: order.id,
      chargeCurrency: charge.currency,
    });
    return NextResponse.redirect(
      new URL("/checkout?error=payment_mismatch", APP_URL)
    );
  }

  // ── 4. Handle status ─────────────────────────────────────────────────────
  if (charge.status === "failed" || charge.status === "expired") {
    if (order.status !== "cancelled") {
      await db
        .update(orders)
        .set({ status: "cancelled", paymentStatus: "failed" })
        .where(eq(orders.id, order.id));
    }
    return NextResponse.redirect(
      new URL("/checkout?error=payment_failed", APP_URL)
    );
  }

  if (charge.status === "successful" && order.paymentStatus !== "paid") {
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
      console.error(
        "[CRITICAL] confirmOrderAtomic failed in return handler:",
        { orderId: order.id, err }
      );
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
        console.error("[email] receipt send failed after 3DS:", err);
      }
    }
  }

  return NextResponse.redirect(
    new URL(`/orders/${order.id}/confirmation`, APP_URL)
  );
}
