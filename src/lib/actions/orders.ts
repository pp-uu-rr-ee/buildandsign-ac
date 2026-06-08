"use server";

import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
import { db } from "@/db";
import { orders, orderItems, products, users, savedCards } from "@/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { checkoutSchema, cartItemsSchema } from "@/lib/validations/checkout";
import { sendOrderReceipt } from "@/lib/email";
import {
  createCharge,
  createCustomerWithCard,
  addCardToCustomer,
} from "@/lib/payment/opn";

export type OrderActionResult =
  | { success: true; orderId: string }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

function generateOrderNumber(): string {
  // Date (compact) + millisecond timestamp + 4 random hex.
  // Unique within a single process even at >1000/s, and very unlikely to
  // collide across replicas.
  const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const ms = Date.now().toString(36).toUpperCase();
  const rand = randomUUID().slice(0, 4).toUpperCase();
  return `ORD-${ymd}-${ms}-${rand}`;
}

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

  // Reject duplicate productIds (would double-count in stock check)
  const productIdSet = new Set(cartItems.map((i) => i.productId));
  if (productIdSet.size !== cartItems.length) {
    return { success: false, error: "Duplicate items in cart." };
  }

  // ── 2. Validate checkout form fields ──────────────────────────────────────
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
      fieldErrors: parsed.error.flatten()
        .fieldErrors as Record<string, string[]>,
    };
  }

  const data = parsed.data;

  // ── 3. Re-price + atomic stock reserve (transaction) ──────────────────────
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

  // For card payments we reserve stock *after* the charge succeeds (not here),
  // so we run a lighter transaction: only verify stock + create order.
  // For COD we reserve stock atomically inside the same transaction.
  const isCardPayment = data.paymentMethod === "card";

  let order: { id: string; orderNumber: string };
  let validatedItems: ValidatedItem[];
  let subtotal: number;
  let shippingInSatang: number;
  let totalInSatang: number;

  try {
    ({ order, validatedItems, subtotal, shippingInSatang, totalInSatang } =
      await db.transaction(async (tx) => {
        const validated: ValidatedItem[] = [];
        let subSum = 0;

        for (const item of cartItems) {
          // Lock the row to prevent concurrent buyers from overselling.
          const [product] = await tx
            .select({
              id: products.id,
              stock: products.stock,
              name: products.name,
              sku: products.sku,
              priceInSatang: products.priceInSatang,
              status: products.status,
            })
            .from(products)
            .where(eq(products.id, item.productId))
            .for("update")
            .limit(1);

          if (!product || product.status !== "active") {
            throw new Error(`Product unavailable.`);
          }
          if (product.stock < item.quantity) {
            throw new Error(
              `"${product.name}" only has ${product.stock} units in stock.`
            );
          }

          const lineTotal = product.priceInSatang * item.quantity;
          // sanity check — guards against overflow if a bad price ever lands in DB
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

        const shipping =
          subSum >= SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;
        const total = subSum + shipping;

        // For COD: decrement stock atomically. The conditional WHERE clause
        // protects against any race that slipped past the FOR UPDATE lock
        // (e.g. with a different isolation level).
        if (!isCardPayment) {
          for (const item of validated) {
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
              throw new Error(
                `"${item.productName}" went out of stock during checkout.`
              );
            }
          }
        }

        const [created] = await tx
          .insert(orders)
          .values({
            orderNumber: generateOrderNumber(),
            userId: session?.userId ?? null,
            status: isCardPayment ? "pending" : "confirmed",
            paymentStatus: "unpaid",
            paymentMethod: data.paymentMethod,
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

        await tx.insert(orderItems).values(
          validated.map((item) => ({ orderId: created.id, ...item }))
        );

        return {
          order: created,
          validatedItems: validated,
          subtotal: subSum,
          shippingInSatang: shipping,
          totalInSatang: total,
        };
      }));
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Checkout failed.";
    return { success: false, error: msg };
  }

  // ── 4. Card payment branch ────────────────────────────────────────────────
  if (isCardPayment) {
    const savedCardId =
      (formData.get("savedCardId") as string | null)?.trim() || "";
    const opnToken =
      (formData.get("opnToken") as string | null)?.trim() || "";
    const rememberCard = formData.get("rememberCard") === "true";

    let chargeCardParam: string | undefined;
    let chargeCustomerParam: string | undefined;

    if (savedCardId) {
      // Saved card — REQUIRE session AND ownership match.
      if (!session) {
        await failOrder(order.id);
        return {
          success: false,
          error: "Please log in to use a saved card.",
        };
      }

      const [savedCard] = await db
        .select({ opnCardId: savedCards.opnCardId })
        .from(savedCards)
        .where(
          and(
            eq(savedCards.id, savedCardId),
            eq(savedCards.userId, session.userId)
          )
        )
        .limit(1);

      const [user] = await db
        .select({ opnCustomerId: users.opnCustomerId })
        .from(users)
        .where(eq(users.id, session.userId))
        .limit(1);

      if (!savedCard || !user?.opnCustomerId) {
        await failOrder(order.id);
        return {
          success: false,
          error: "Saved card not found. Please use a new card.",
        };
      }

      chargeCardParam = savedCard.opnCardId;
      chargeCustomerParam = user.opnCustomerId;
    } else {
      // New card flow
      if (!opnToken) {
        await failOrder(order.id);
        return {
          success: false,
          error: "Card token missing. Please try again.",
        };
      }

      if (rememberCard && session) {
        try {
          const result = await attachCardToUser(session.userId, opnToken, {
            email: data.email,
            name: data.fullName,
          });
          chargeCardParam = result.cardId;
          chargeCustomerParam = result.customerId;
        } catch (err) {
          await failOrder(order.id);
          const msg =
            err instanceof Error ? err.message : "Failed to save card.";
          return { success: false, error: msg };
        }
      } else {
        chargeCardParam = opnToken;
      }
    }

    // ── 5. Create the charge ─────────────────────────────────────────────
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
      await failOrder(order.id);
      const message =
        err instanceof Error ? err.message : "Payment failed.";
      return { success: false, error: message };
    }

    // Save paymentReference IMMEDIATELY so the return handler / webhook can find us.
    await db
      .update(orders)
      .set({ paymentReference: charge.id })
      .where(eq(orders.id, order.id));

    if (charge.status === "failed" || charge.status === "expired") {
      await failOrder(order.id);
      return {
        success: false,
        error:
          charge.failure_message ??
          "Payment declined. Please try a different card.",
      };
    }

    if (charge.status === "successful") {
      // Validate that the charge actually matches our order before confirming.
      if (
        charge.amount !== totalInSatang ||
        charge.currency.toUpperCase() !== "THB" ||
        charge.metadata?.orderId !== order.id
      ) {
        await failOrder(order.id);
        console.error(
          "[opn] charge/order mismatch:",
          { chargeId: charge.id, expected: { totalInSatang, orderId: order.id } }
        );
        return {
          success: false,
          error: "Payment validation failed. Please contact support.",
        };
      }

      try {
        await confirmOrderAtomic(order.id, validatedItems);
      } catch (err) {
        // CRITICAL: money was taken but stock reservation failed.
        // Don't tell the user it failed — that's worse. Log and alert ops.
        console.error(
          "[CRITICAL] Charge succeeded but order confirm failed:",
          { orderId: order.id, chargeId: charge.id, err }
        );
        // We still redirect to the confirmation page so the user gets a record.
        // Ops will reconcile this manually via the alert.
      }

      try {
        await sendOrderReceipt(
          buildReceiptPayload(
            order,
            data,
            validatedItems,
            subtotal,
            shippingInSatang,
            totalInSatang
          )
        );
      } catch (err) {
        console.error("[email] Failed to send order receipt:", err);
      }

      redirect(`/orders/${order.id}/confirmation`);
    }

    // pending → 3DS redirect.
    // Stock is NOT yet decremented; webhook or return handler will do that.
    if (!charge.authorize_uri) {
      await failOrder(order.id);
      return {
        success: false,
        error: "Payment requires verification but no redirect URL was returned.",
      };
    }
    redirect(charge.authorize_uri);
  }

  // ── 6. Manual (COD) — stock already reserved in transaction ──────────────
  try {
    await sendOrderReceipt(
      buildReceiptPayload(
        order,
        data,
        validatedItems,
        subtotal,
        shippingInSatang,
        totalInSatang
      )
    );
  } catch (err) {
    console.error("[email] Failed to send order receipt:", err);
  }

  redirect(`/orders/${order.id}/confirmation`);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function failOrder(orderId: string) {
  try {
    await db
      .update(orders)
      .set({ status: "cancelled", paymentStatus: "failed" })
      .where(eq(orders.id, orderId));
  } catch (err) {
    console.error("[orders] failOrder DB error:", err);
  }
}

/**
 * Attach a tokenized card to the user's Opn customer, creating the customer
 * if needed. Returns the Opn card id + customer id ready to use in createCharge.
 */
async function attachCardToUser(
  userId: string,
  tokenId: string,
  customerInfo: { email: string; name: string }
): Promise<{ cardId: string; customerId: string }> {
  const [user] = await db
    .select({ opnCustomerId: users.opnCustomerId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  let opnCustomerId = user?.opnCustomerId ?? null;
  let opnCard;

  if (!opnCustomerId) {
    const { customer, card } = await createCustomerWithCard({
      email: customerInfo.email,
      name: customerInfo.name,
      tokenId,
    });
    opnCustomerId = customer.id;
    opnCard = card;
    // Race-safe: only write if still null. If two concurrent calls race,
    // one customer becomes orphan but DB stays consistent.
    await db
      .update(users)
      .set({ opnCustomerId })
      .where(and(eq(users.id, userId), sql`${users.opnCustomerId} IS NULL`));
  } else {
    opnCard = await addCardToCustomer(opnCustomerId, tokenId);
  }

  // Count existing saved cards to decide isDefault
  const existing = await db
    .select({ id: savedCards.id })
    .from(savedCards)
    .where(eq(savedCards.userId, userId));

  await db
    .insert(savedCards)
    .values({
      userId,
      opnCardId: opnCard.id,
      last4: opnCard.last_digits,
      brand: opnCard.brand,
      expMonth: opnCard.expiration_month,
      expYear: opnCard.expiration_year,
      isDefault: existing.length === 0,
    })
    .onConflictDoNothing();

  return { cardId: opnCard.id, customerId: opnCustomerId };
}

/**
 * Decrement stock and mark order confirmed + paid — atomically per item.
 * Used by both the inline card flow and the /api/payment/return + webhook
 * handlers. Idempotent at the order level (caller should skip if already paid).
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
        // Stock went negative — log and continue (don't roll back; the
        // customer already paid). Ops needs to reconcile manually.
        console.error(
          "[CRITICAL] Stock decrement failed for paid order:",
          { orderId, ...item }
        );
      }
    }

    await tx
      .update(orders)
      .set({ status: "confirmed", paymentStatus: "paid" })
      .where(eq(orders.id, orderId));
  });
}

/**
 * Legacy export name kept for backwards compatibility with the existing
 * payment return route. New callers should use `confirmOrderAtomic`.
 */
export const confirmOrder = confirmOrderAtomic;

/**
 * Cancel any pending+unpaid card-payment orders older than the given window.
 * Card orders create a DB row *before* the user finishes 3DS, so anyone who
 * abandons checkout leaves a zombie. Run this from a cron route every ~15 min.
 *
 * Returns the number of orders cancelled.
 */
export async function cleanupStalePendingOrders(
  olderThanMinutes = 30
): Promise<number> {
  const result = await db
    .update(orders)
    .set({ status: "cancelled", paymentStatus: "failed" })
    .where(
      and(
        eq(orders.status, "pending"),
        eq(orders.paymentStatus, "unpaid"),
        sql`${orders.createdAt} < NOW() - INTERVAL '1 minute' * ${olderThanMinutes}`
      )
    )
    .returning({ id: orders.id });

  return result.length;
}

function buildReceiptPayload(
  order: { id: string; orderNumber: string },
  data: {
    email: string;
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    province: string;
    postalCode: string;
    paymentMethod: string;
  },
  items: {
    productName: string;
    quantity: number;
    unitPriceInSatang: number;
    totalInSatang: number;
  }[],
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
