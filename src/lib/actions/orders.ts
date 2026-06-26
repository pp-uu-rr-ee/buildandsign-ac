"use server";

import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
import { db } from "@/db";
import { orders, orderItems, products, productVariants, users } from "@/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { checkoutSchema, cartItemsSchema } from "@/lib/validations/checkout";
import { sendOrderReceipt } from "@/lib/email";
import { ensureSavedAddress } from "@/lib/actions/addresses";

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
  if (!session) {
    return { success: false, error: "Please log in to place an order." };
  }

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

  const variantIdSet = new Set(cartItems.map((i) => i.variantId));
  if (variantIdSet.size !== cartItems.length) {
    return { success: false, error: "Duplicate items in cart." };
  }

  // ── 2. Validate address (contact comes from account) ─────────────────────
  const raw = {
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
  const address = parsed.data;

  // Contact info is the account info — fetched fresh from DB so the client
  // can't override it via a hidden field.
  const [account] = await db
    .select({ name: users.name, email: users.email, phone: users.phone })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (!account) {
    return { success: false, error: "Account not found." };
  }
  if (!account.phone) {
    return {
      success: false,
      error: "Please add a phone number to your account before placing an order.",
    };
  }

  const data = {
    ...address,
    fullName: account.name,
    email: account.email,
    phone: account.phone,
  };

  // ── 3. Re-price from DB (don't trust client prices) + create inquiry ─────
  const SHIPPING_THRESHOLD = 500000;
  const SHIPPING_FLAT = 49900;

  type ValidatedItem = {
    productId: string;
    productVariantId: string;
    productName: string;
    productVariantSize: string;
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
      // Re-price by variantId. Join products so we can also snapshot the
      // series name and confirm the product is still active.
      const [row] = await db
        .select({
          variantId: productVariants.id,
          size: productVariants.size,
          sku: productVariants.sku,
          priceInSatang: productVariants.priceInSatang,
          productId: products.id,
          productName: products.name,
          productStatus: products.status,
        })
        .from(productVariants)
        .innerJoin(products, eq(products.id, productVariants.productId))
        .where(eq(productVariants.id, item.variantId))
        .limit(1);

      if (!row || row.productStatus !== "active") {
        throw new Error(`Product unavailable.`);
      }

      const lineTotal = row.priceInSatang * item.quantity;
      if (lineTotal < 0 || !Number.isSafeInteger(lineTotal)) {
        throw new Error("Invalid item total.");
      }
      subSum += lineTotal;

      validated.push({
        productId: row.productId,
        productVariantId: row.variantId,
        productName: row.productName,
        productVariantSize: row.size,
        productSku: row.sku,
        unitPriceInSatang: row.priceInSatang,
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

  // First-time address → save it to the customer's address book.
  if (session?.userId) {
    try {
      await ensureSavedAddress(session.userId, {
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        city: data.city,
        province: data.province,
        postalCode: data.postalCode,
      });
    } catch (e) {
      console.error("[address] ensureSavedAddress (order) failed:", e);
    }
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
 * Atomically decrements VARIANT stock and marks the order confirmed.
 */
export async function confirmOrderAtomic(
  orderId: string,
  items: { productVariantId: string; quantity: number }[]
) {
  await db.transaction(async (tx) => {
    for (const item of items) {
      const result = await tx
        .update(productVariants)
        .set({ stock: sql`${productVariants.stock} - ${item.quantity}` })
        .where(
          and(
            eq(productVariants.id, item.productVariantId),
            sql`${productVariants.stock} >= ${item.quantity}`
          )
        )
        .returning({ id: productVariants.id });

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
