"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { orders, bookings, products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

// ── Order status ─────────────────────────────────────────────────────────────
export async function updateOrderStatusAction(orderId: string, status: string) {
  const valid = z.enum(["pending","confirmed","processing","shipped","delivered","cancelled","refunded"]).safeParse(status);
  if (!valid.success) return { error: "Invalid status" };
  await db.update(orders).set({ status: valid.data, updatedAt: new Date() }).where(eq(orders.id, orderId));
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}

export async function updatePaymentStatusAction(orderId: string, paymentStatus: string) {
  const valid = z.enum(["unpaid","paid","partial","refunded","failed"]).safeParse(paymentStatus);
  if (!valid.success) return { error: "Invalid status" };
  await db.update(orders).set({ paymentStatus: valid.data, updatedAt: new Date() }).where(eq(orders.id, orderId));
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}

// ── Booking management ───────────────────────────────────────────────────────
export async function updateBookingStatusAction(bookingId: string, status: string) {
  const valid = z.enum(["pending","confirmed","in_progress","completed","cancelled","no_show"]).safeParse(status);
  if (!valid.success) return { error: "Invalid status" };

  const updates: Record<string, unknown> = { status: valid.data, updatedAt: new Date() };
  if (valid.data === "completed") updates.completedAt = new Date();
  if (valid.data === "cancelled") updates.cancelledAt = new Date();

  await db.update(bookings).set(updates as any).where(eq(bookings.id, bookingId));
  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${bookingId}`);
}

export async function assignTechnicianAction(bookingId: string, technicianId: string) {
  await db
    .update(bookings)
    .set({ technicianId, status: "confirmed", updatedAt: new Date() })
    .where(eq(bookings.id, bookingId));
  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${bookingId}`);
}

// ── Product management ───────────────────────────────────────────────────────
const productSchema = z.object({
  name: z.string().min(2),
  nameTh: z.string().optional(),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only"),
  shortDescription: z.string().optional(),
  shortDescriptionTh: z.string().optional(),
  description: z.string().optional(),
  descriptionTh: z.string().optional(),
  category: z.enum(["split","window","portable","central","cassette","ducted"]),
  status: z.enum(["active","draft","archived","out_of_stock"]),
  // User enters peso amounts; multiply by 100 to store as centavos
  priceInPesos: z.coerce.number().positive("Price must be a positive number"),
  comparePriceInPesos: z.coerce.number().positive().optional().or(z.literal("")),
  stock: z.coerce.number().int().min(0),
  isFeatured: z.coerce.boolean().optional(),
});

export type ProductFormResult =
  | { success: true }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

export type CreateProductResult =
  | { success: true; productId: string }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

export async function updateProductAction(
  _prev: ProductFormResult,
  formData: FormData
): Promise<ProductFormResult> {
  const id = formData.get("id") as string;
  const raw = Object.fromEntries(
    ["name","nameTh","slug","shortDescription","shortDescriptionTh","description","descriptionTh",
     "category","status","priceInPesos","comparePriceInPesos","stock","isFeatured"]
      .map((k) => [k, formData.get(k)])
  );
  raw.isFeatured = formData.get("isFeatured") === "on" ? "true" : "false";

  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors as any };
  }

  const { priceInPesos, comparePriceInPesos, ...rest } = parsed.data;
  await db.update(products).set({
    ...rest,
    nameTh: rest.nameTh || null,
    shortDescriptionTh: rest.shortDescriptionTh || null,
    descriptionTh: rest.descriptionTh || null,
    priceInSatang: Math.round(priceInPesos * 100),
    comparePriceInSatang: comparePriceInPesos !== "" && comparePriceInPesos
      ? Math.round(Number(comparePriceInPesos) * 100)
      : null,
    isFeatured: rest.isFeatured ?? false,
    updatedAt: new Date(),
  }).where(eq(products.id, id));

  revalidatePath("/admin/products");
  revalidatePath(`/products/${rest.slug}`);
  return { success: true };
}

export async function createProductAction(
  _prev: CreateProductResult,
  formData: FormData
): Promise<CreateProductResult> {
  const raw = Object.fromEntries(
    ["name","nameTh","slug","shortDescription","shortDescriptionTh",
     "category","status","priceInPesos","comparePriceInPesos","stock","isFeatured"]
      .map((k) => [k, formData.get(k)])
  );
  raw.isFeatured = formData.get("isFeatured") === "on" ? "true" : "false";

  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors as any };
  }

  const { priceInPesos, comparePriceInPesos, ...rest } = parsed.data;

  const [product] = await db.insert(products).values({
    ...rest,
    nameTh: rest.nameTh || null,
    shortDescriptionTh: rest.shortDescriptionTh || null,
    priceInSatang: Math.round(priceInPesos * 100),
    comparePriceInSatang: comparePriceInPesos !== "" && comparePriceInPesos
      ? Math.round(Number(comparePriceInPesos) * 100)
      : null,
    isFeatured: rest.isFeatured ?? false,
  }).returning({ id: products.id });

  revalidatePath("/admin/products");
  revalidatePath("/products");
  return { success: true, productId: product.id };
}

export async function toggleProductStatusAction(id: string, currentStatus: string) {
  const next = currentStatus === "active" ? "archived" : "active";
  await db.update(products).set({ status: next as any, updatedAt: new Date() }).where(eq(products.id, id));
  revalidatePath("/admin/products");
}
