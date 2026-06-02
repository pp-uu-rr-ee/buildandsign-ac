"use server";

import { redirect } from "next/navigation";
import { db } from "@/db";
import { orders, orderItems, products } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { checkoutSchema } from "@/lib/validations/checkout";
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

  // Parse cart items passed as JSON from the client
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

  // Validate stock for each item and compute totals
  const SHIPPING_THRESHOLD = 500000;
  const SHIPPING_FLAT = 49900;

  let subtotal = 0;
  const validatedItems: {
    productId: string;
    productName: string;
    productSku: string | null;
    unitPriceInCents: number;
    quantity: number;
    totalInCents: number;
  }[] = [];

  for (const item of cartItems) {
    const [product] = await db
      .select({ id: products.id, stock: products.stock, name: products.name, sku: products.sku, priceInCents: products.priceInCents })
      .from(products)
      .where(eq(products.id, item.productId))
      .limit(1);

    if (!product) return { success: false, error: `Product not found: ${item.name}` };
    if (product.stock < item.quantity)
      return { success: false, error: `"${product.name}" only has ${product.stock} units in stock.` };

    const lineTotal = product.priceInCents * item.quantity;
    subtotal += lineTotal;

    validatedItems.push({
      productId: product.id,
      productName: product.name,
      productSku: product.sku,
      unitPriceInCents: product.priceInCents,
      quantity: item.quantity,
      totalInCents: lineTotal,
    });
  }

  const shippingInCents = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;
  const totalInCents = subtotal + shippingInCents;

  // Create order + items in a transaction
  const [order] = await db
    .insert(orders)
    .values({
      orderNumber: generateOrderNumber(),
      userId: session?.userId ?? null,
      status: "pending",
      paymentStatus: "unpaid",
      paymentMethod: data.paymentMethod,
      subtotalInCents: subtotal,
      shippingInCents,
      taxInCents: 0,
      discountInCents: 0,
      totalInCents,
      shippingAddress: {
        fullName: data.fullName,
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
    .returning({ id: orders.id });

  await db.insert(orderItems).values(
    validatedItems.map((item) => ({ orderId: order.id, ...item }))
  );

  // Decrement stock atomically
  for (const item of validatedItems) {
    await db
      .update(products)
      .set({ stock: sql`${products.stock} - ${item.quantity}` })
      .where(eq(products.id, item.productId));
  }

  redirect(`/orders/${order.id}/confirmation`);
}
