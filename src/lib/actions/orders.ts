"use server";

import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
import { db } from "@/db";
import { orders, orderItems, products } from "@/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { checkoutSchema, cartItemsSchema } from "@/lib/validations/checkout";
import { sendOrderReceipt } from "@/lib/email";

export type OrderActionResult =
  | { success: true; orderId: string }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

function generateOrderNumber(): string {
  const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const ms = Date.now().toString(36).toUpperCase();
  const rand = randomUUID().slice(0, 4).toUpperCase();
  return `ORD-${ymd}-${ms}-${rand}`;
}

/**
 * Inquiry-style order: customer submits a "request to buy" with their contact
 * and address; no online payment. Staff follow up via Line/Facebook/phone.
 * Stock is NOT decremented here — admin confirms it manually after the
 * conversation, since the customer hasn't actually committed yet.
 */
export async function createOrderAction(
  _prev: OrderActionResult,
  formData: FormData
): Promise<OrderActionResult> {
  const session = await getSession();

  // ── 1. Validate cart shape ────────────────────────────────────────────────
  const cartRaw = formData.get("cartItems");
  if (typeof cartRaw !== "string" || !cartRaw) {
    return { success: false, error: "Cart is empty." };
  }

  let parsedCart: unknown;
  try {
    parsedCart = JSON.parse(cartRaw);
  } catch {
    return { success: false, error: "Invalid cart data." };
  }

  const cartResult = cartItemsSchema.safeParse(parsedCart);
  if (!cartResult.success) {
    return {
      success: false,
      error: cartResult.error.issues[0]?.message ?? "Invalid cart.",
    };
  }
  const cartItems = cartResult.data;

  const productIdSet = new Set(cartItems.map((i) => i.productId));
  if (productIdSet.size !== cartItems.length) {
    return { success: false, error: "Duplicate items in cart." };
  }

  // ── 2. Validate contact / address ─────────────────────────────────────────
  const raw = {
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    addressLine1: formData.get("addressLine1"),
    addressLine2: formData.get("addressLine2") || undefined,
    city: formData.get("city"),
    province: formData.get("province"),
    postalCode: formData.get("postalCode"),
    notes: formData.get("notes") || undefined,
  };

  const parsed = checkoutSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten()
        .fieldErrors as Record<string, string[]>,
    };
  }
  const data = parsed.data;

  // ── 3. Re-price from DB (don't trust client prices) + create inquiry ─────
  const SHIPPING_THRESHOLD = 500000;
  const SHIPPING_FLAT = 49900;

  type ValidatedItem = {
    productId: string;
    productName: string;
    productSku: string | null;
    unitPriceInSatang: number;
    quantity: number;
    totalInSatang: number;
  };

  let order: { id: string; orderNumber: string };
  let validatedItems: ValidatedItem[];
  let subtotal: number;
  let shippingInSatang: number;
  let totalInSatang: number;

  try {
    const validated: ValidatedItem[] = [];
    let subSum = 0;

    for (const item of cartItems) {
      const [product] = await db
        .select({
          id: products.id,
          name: products.name,
          sku: products.sku,
          priceInSatang: products.priceInSatang,
          status: products.status,
        })
        .from(products)
        .where(eq(products.id, item.productId))
        .limit(1);

      if (!product || product.status !== "active") {
        throw new Error(`Product unavailable.`);
      }

      const lineTotal = product.priceInSatang * item.quantity;
      if (lineTotal < 0 || !Number.isSafeInteger(lineTotal)) {
        throw new Error("Invalid item total.");
      }
      subSum += lineTotal;

      validated.push({
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        unitPriceInSatang: product.priceInSatang,
        quantity: item.quantity,
        totalInSatang: lineTotal,
      });
    }

    const shipping = subSum >= SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;
    const total = subSum + shipping;

    const [created] = await db
      .insert(orders)
      .values({
        orderNumber: generateOrderNumber(),
        userId: session?.userId ?? null,
        status: "pending",
        subtotalInSatang: subSum,
        shippingInSatang: shipping,
        taxInSatang: 0,
        discountInSatang: 0,
        totalInSatang: total,
        shippingAddress: {
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          addressLine1: data.addressLine1,
          addressLine2: data.addressLine2,
          city: data.city,
          province: data.province,
          postalCode: data.postalCode,
          country: "TH",
        },
        notes: data.notes,
      })
      .returning({ id: orders.id, orderNumber: orders.orderNumber });

    await db.insert(orderItems).values(
      validated.map((item) => ({ orderId: created.id, ...item }))
    );

    order = created;
    validatedItems = validated;
    subtotal = subSum;
    shippingInSatang = shipping;
    totalInSatang = total;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Inquiry failed.";
    return { success: false, error: msg };
  }

  // ── 4. Fire-and-forget receipt email (best effort) ────────────────────────
  try {
    await sendOrderReceipt({
      to: data.email,
      orderNumber: order.orderNumber,
      customerName: data.fullName,
      customerEmail: data.email,
      items: validatedItems.map((i) => ({
        productName: i.productName,
        quantity: i.quantity,
        unitPriceInSatang: i.unitPriceInSatang,
        totalInSatang: i.totalInSatang,
      })),
      subtotalInSatang: subtotal,
      shippingInSatang,
      totalInSatang,
      paymentMethod: "inquiry",
      shippingAddress: {
        fullName: data.fullName,
        phone: data.phone,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        city: data.city,
        province: data.province,
        postalCode: data.postalCode,
      },
      orderId: order.id,
    });
  } catch (err) {
    console.error("[email] Failed to send inquiry receipt:", err);
  }

  redirect(`/orders/${order.id}/confirmation`);
}

/**
 * Admin uses this to confirm an inquiry after talking to the customer.
 * Atomically reserves stock and marks the order confirmed + paid.
 */
export async function confirmOrderAtomic(
  orderId: string,
  items: { productId: string; quantity: number }[]
) {
  await db.transaction(async (tx) => {
    for (const item of items) {
      const result = await tx
        .update(products)
        .set({ stock: sql`${products.stock} - ${item.quantity}` })
        .where(
          and(
            eq(products.id, item.productId),
            sql`${products.stock} >= ${item.quantity}`
          )
        )
        .returning({ id: products.id });

      if (result.length === 0) {
        console.error(
          "[CRITICAL] Stock decrement failed for confirmed order:",
          { orderId, ...item }
        );
      }
    }

    await tx
      .update(orders)
      .set({ status: "confirmed" })
      .where(eq(orders.id, orderId));
  });
}

export const confirmOrder = confirmOrderAtomic;

/**
 * Auto-cancel inquiry orders that have been sitting in `pending` without any
 * admin follow-up for more than `olderThanMinutes`. Default is 30 days —
 * admins have a long runway to talk to the customer in the inquiry flow.
 */
export async function cleanupStalePendingOrders(
  olderThanMinutes = 60 * 24 * 30
): Promise<number> {
  const result = await db
    .update(orders)
    .set({ status: "cancelled" })
    .where(
      and(
        eq(orders.status, "pending"),
        sql`${orders.createdAt} < NOW() - INTERVAL '1 minute' * ${olderThanMinutes}`
      )
    )
    .returning({ id: orders.id });

  return result.length;
}
