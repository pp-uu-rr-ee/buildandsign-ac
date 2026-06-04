"use server";

import { redirect } from "next/navigation";
import { db } from "@/db";
import { orders, orderItems, products, users, savedCards } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { checkoutSchema } from "@/lib/validations/checkout";
import { sendOrderReceipt } from "@/lib/email";
import {
  createCharge,
  createCustomerWithCard,
  addCardToCustomer,
} from "@/lib/payment/opn";
import type { CartItem } from "@/types";

export type OrderActionResult =
  | { success: true; orderId: string }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

function generateOrderNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(Math.random() * 90000 + 10000);
  return `ORD-${date}-${rand}`;
}

export async function createOrderAction(
  _prev: OrderActionResult,
  formData: FormData
): Promise<OrderActionResult> {
  const session = await getSession();

  const cartRaw = formData.get("cartItems");
  if (!cartRaw) return { success: false, error: "Cart is empty." };

  let cartItems: CartItem[];
  try {
    cartItems = JSON.parse(cartRaw as string);
  } catch {
    return { success: false, error: "Invalid cart data." };
  }

  if (!cartItems.length) return { success: false, error: "Cart is empty." };

  const raw = {
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    addressLine1: formData.get("addressLine1"),
    addressLine2: formData.get("addressLine2") || undefined,
    city: formData.get("city"),
    province: formData.get("province"),
    postalCode: formData.get("postalCode"),
    paymentMethod: formData.get("paymentMethod"),
    notes: formData.get("notes") || undefined,
  };

  const parsed = checkoutSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const data = parsed.data;

  const SHIPPING_THRESHOLD = 500000;
  const SHIPPING_FLAT = 49900;

  let subtotal = 0;
  const validatedItems: {
    productId: string;
    productName: string;
    productSku: string | null;
    unitPriceInSatang: number;
    quantity: number;
    totalInSatang: number;
  }[] = [];

  for (const item of cartItems) {
    const [product] = await db
      .select({ id: products.id, stock: products.stock, name: products.name, sku: products.sku, priceInSatang: products.priceInSatang })
      .from(products)
      .where(eq(products.id, item.productId))
      .limit(1);

    if (!product) return { success: false, error: `Product not found: ${item.name}` };
    if (product.stock < item.quantity)
      return { success: false, error: `"${product.name}" only has ${product.stock} units in stock.` };

    const lineTotal = product.priceInSatang * item.quantity;
    subtotal += lineTotal;
    validatedItems.push({
      productId: product.id,
      productName: product.name,
      productSku: product.sku,
      unitPriceInSatang: product.priceInSatang,
      quantity: item.quantity,
      totalInSatang: lineTotal,
    });
  }

  const shippingInSatang = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;
  const totalInSatang = subtotal + shippingInSatang;

  // Create order first (pending/unpaid) for all payment methods
  const [order] = await db
    .insert(orders)
    .values({
      orderNumber: generateOrderNumber(),
      userId: session?.userId ?? null,
      status: "pending",
      paymentStatus: "unpaid",
      paymentMethod: data.paymentMethod,
      subtotalInSatang: subtotal,
      shippingInSatang,
      taxInSatang: 0,
      discountInSatang: 0,
      totalInSatang,
      shippingAddress: {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        city: data.city,
        province: data.province,
        postalCode: data.postalCode,
        country: "PH",
      },
      notes: data.notes,
    })
    .returning({ id: orders.id, orderNumber: orders.orderNumber });

  await db.insert(orderItems).values(
    validatedItems.map((item) => ({ orderId: order.id, ...item }))
  );

  // ── Card payment via Opn Payments ─────────────────────────────────────────
  if (data.paymentMethod === "card") {
    const savedCardId = (formData.get("savedCardId") as string | null)?.trim();
    const opnToken = (formData.get("opnToken") as string | null)?.trim();
    const rememberCard = formData.get("rememberCard") === "true";

    let chargeCardParam: string | undefined;
    let chargeCustomerParam: string | undefined;

    // ── Using a saved card ────────────────────────────────────────────────
    if (savedCardId) {
      if (!session) {
        await db.update(orders).set({ status: "cancelled" }).where(eq(orders.id, order.id));
        return { success: false, error: "Please log in to use a saved card." };
      }

      const [savedCard] = await db
        .select({ opnCardId: savedCards.opnCardId })
        .from(savedCards)
        .where(eq(savedCards.id, savedCardId))
        .limit(1);

      const [user] = await db
        .select({ opnCustomerId: users.opnCustomerId })
        .from(users)
        .where(eq(users.id, session.userId))
        .limit(1);

      if (!savedCard || !user?.opnCustomerId) {
        await db.update(orders).set({ status: "cancelled" }).where(eq(orders.id, order.id));
        return { success: false, error: "Saved card not found. Please use a new card." };
      }

      chargeCardParam = savedCard.opnCardId;
      chargeCustomerParam = user.opnCustomerId;

    // ── New card ──────────────────────────────────────────────────────────
    } else {
      if (!opnToken) {
        await db.update(orders).set({ status: "cancelled" }).where(eq(orders.id, order.id));
        return { success: false, error: "Card token missing. Please try again." };
      }

      if (rememberCard && session) {
        // Attach card to Opn customer (creates customer if needed) and save reference to DB
        const [user] = await db
          .select({ opnCustomerId: users.opnCustomerId })
          .from(users)
          .where(eq(users.id, session.userId))
          .limit(1);

        let opnCustomerId = user?.opnCustomerId ?? null;
        let opnCard;

        try {
          if (!opnCustomerId) {
            const { customer, card } = await createCustomerWithCard({
              email: data.email,
              name: data.fullName,
              tokenId: opnToken,
            });
            opnCustomerId = customer.id;
            opnCard = card;
            await db.update(users).set({ opnCustomerId }).where(eq(users.id, session.userId));
          } else {
            opnCard = await addCardToCustomer(opnCustomerId, opnToken);
          }
        } catch (err) {
          await db.update(orders).set({ status: "cancelled" }).where(eq(orders.id, order.id));
          const msg = err instanceof Error ? err.message : "Failed to save card.";
          return { success: false, error: msg };
        }

        // Count existing saved cards to decide isDefault
        const existingCount = await db
          .select({ id: savedCards.id })
          .from(savedCards)
          .where(eq(savedCards.userId, session.userId));

        await db
          .insert(savedCards)
          .values({
            userId: session.userId,
            opnCardId: opnCard.id,
            last4: opnCard.last_digits,
            brand: opnCard.brand,
            expMonth: opnCard.expiration_month,
            expYear: opnCard.expiration_year,
            isDefault: existingCount.length === 0,
          })
          .onConflictDoNothing();

        chargeCardParam = opnCard.id;
        chargeCustomerParam = opnCustomerId;
      } else {
        chargeCardParam = opnToken;
      }
    }

    let charge;
    try {
      charge = await createCharge({
        amount: totalInSatang,
        currency: "THB",
        card: chargeCardParam,
        customer: chargeCustomerParam,
        capture: true,
        description: `Order ${order.orderNumber}`,
        returnUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/return`,
        metadata: { orderId: order.id },
      });
    } catch (err) {
      await db.update(orders).set({ status: "cancelled", paymentStatus: "failed" }).where(eq(orders.id, order.id));
      const message = err instanceof Error ? err.message : "Payment failed.";
      return { success: false, error: message };
    }

    await db.update(orders).set({ paymentReference: charge.id }).where(eq(orders.id, order.id));

    if (charge.status === "failed" || charge.status === "expired") {
      await db.update(orders).set({ status: "cancelled", paymentStatus: "failed" }).where(eq(orders.id, order.id));
      return {
        success: false,
        error: charge.failure_message ?? "Payment declined. Please try a different card.",
      };
    }

    if (charge.status === "successful") {
      await confirmOrder(order.id, validatedItems);
      try {
        await sendOrderReceipt(buildReceiptPayload(order, data, validatedItems, subtotal, shippingInSatang, totalInSatang));
      } catch (err) {
        console.error("[email] Failed to send order receipt:", err);
      }
      redirect(`/orders/${order.id}/confirmation`);
    }

    // Pending — 3DS redirect
    redirect(charge.authorize_uri!);
  }

  // ── Manual payment methods (COD) ─────────────────────────────────────────
  for (const item of validatedItems) {
    await db
      .update(products)
      .set({ stock: sql`${products.stock} - ${item.quantity}` })
      .where(eq(products.id, item.productId));
  }
  await db.update(orders).set({ status: "confirmed" }).where(eq(orders.id, order.id));

  try {
    await sendOrderReceipt(buildReceiptPayload(order, data, validatedItems, subtotal, shippingInSatang, totalInSatang));
  } catch (err) {
    console.error("[email] Failed to send order receipt:", err);
  }

  redirect(`/orders/${order.id}/confirmation`);
}

/** Decrement stock and mark order confirmed + paid. Used by the action and the payment return handler. */
export async function confirmOrder(
  orderId: string,
  items: { productId: string; quantity: number }[]
) {
  for (const item of items) {
    await db
      .update(products)
      .set({ stock: sql`${products.stock} - ${item.quantity}` })
      .where(eq(products.id, item.productId));
  }
  await db
    .update(orders)
    .set({ status: "confirmed", paymentStatus: "paid" })
    .where(eq(orders.id, orderId));
}

function buildReceiptPayload(
  order: { id: string; orderNumber: string },
  data: { email: string; fullName: string; phone: string; addressLine1: string; addressLine2?: string; city: string; province: string; postalCode: string; paymentMethod: string },
  items: { productName: string; quantity: number; unitPriceInSatang: number; totalInSatang: number }[],
  subtotalInSatang: number,
  shippingInSatang: number,
  totalInSatang: number
) {
  return {
    to: data.email,
    orderNumber: order.orderNumber,
    customerName: data.fullName,
    customerEmail: data.email,
    items: items.map((i) => ({
      productName: i.productName,
      quantity: i.quantity,
      unitPriceInSatang: i.unitPriceInSatang,
      totalInSatang: i.totalInSatang,
    })),
    subtotalInSatang,
    shippingInSatang,
    totalInSatang,
    paymentMethod: data.paymentMethod,
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
  };
}
