import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { retrieveCharge } from "@/lib/payment/opn";
import { confirmOrder } from "@/lib/actions/orders";
import { sendOrderReceipt } from "@/lib/email";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const chargeId = url.searchParams.get("charge_id");

  if (!chargeId) {
    return NextResponse.redirect(new URL("/checkout", APP_URL));
  }

  let charge;
  try {
    charge = await retrieveCharge(chargeId);
  } catch {
    return NextResponse.redirect(new URL("/checkout?error=payment_error", APP_URL));
  }

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.paymentReference, chargeId))
    .limit(1);

  if (!order) {
    return NextResponse.redirect(new URL("/checkout?error=order_not_found", APP_URL));
  }

  if (charge.status === "failed" || charge.status === "expired") {
    await db
      .update(orders)
      .set({ status: "cancelled", paymentStatus: "failed" })
      .where(eq(orders.id, order.id));
    return NextResponse.redirect(
      new URL(`/checkout?error=payment_failed`, APP_URL)
    );
  }

  if (charge.status === "successful" && order.paymentStatus === "unpaid") {
    const items = await db
      .select({ productId: orderItems.productId, quantity: orderItems.quantity })
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id));

    const nonNullItems = items.filter(
      (i): i is { productId: string; quantity: number } => i.productId !== null
    );

    await confirmOrder(order.id, nonNullItems);

    const addr = order.shippingAddress;
    if (addr.email) {
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
        console.error("[email] Failed to send order receipt after 3DS:", err);
      }
    }
  }

  return NextResponse.redirect(
    new URL(`/orders/${order.id}/confirmation`, APP_URL)
  );
}
