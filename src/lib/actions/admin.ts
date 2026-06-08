"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { orders, bookings, products, users, technicians } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getSession } from "@/lib/session";

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

// ── Technicians ──────────────────────────────────────────────────────────────

export type TechnicianActionResult =
  | { success: true; technicianId: string }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

const technicianSchema = z.object({
  name: z.string().min(2, "Name is required").max(120),
  email: z.string().email("Valid email required").max(254),
  phone: z
    .string()
    .regex(/^[0-9+\s\-()]{7,20}$/, "Invalid phone number")
    .max(20),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72),
  bio: z.string().max(500).optional(),
  status: z.enum(["active", "inactive", "on_leave"]),
  specializations: z
    .array(z.enum(["cleaning", "repair", "installation", "inspection"]))
    .min(1, "Choose at least one specialization"),
});

const DEFAULT_WEEKLY_SCHEDULE = {
  "0": null, // Sunday off
  "1": { startTime: "08:00", endTime: "18:00", slotDurationMinutes: 60 },
  "2": { startTime: "08:00", endTime: "18:00", slotDurationMinutes: 60 },
  "3": { startTime: "08:00", endTime: "18:00", slotDurationMinutes: 60 },
  "4": { startTime: "08:00", endTime: "18:00", slotDurationMinutes: 60 },
  "5": { startTime: "08:00", endTime: "18:00", slotDurationMinutes: 60 },
  "6": { startTime: "08:00", endTime: "14:00", slotDurationMinutes: 60 },
};

export async function createTechnicianAction(
  _prev: TechnicianActionResult,
  formData: FormData
): Promise<TechnicianActionResult> {
  // Admin guard — middleware already protects /admin routes but defense-in-depth.
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { success: false, error: "Unauthorized." };
  }

  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    bio: formData.get("bio") || undefined,
    status: formData.get("status") ?? "active",
    specializations: formData.getAll("specializations"),
  };

  const parsed = technicianSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten()
        .fieldErrors as Record<string, string[]>,
    };
  }
  const data = parsed.data;

  // Pre-check duplicate email (gives a friendlier error than the unique constraint)
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, data.email.toLowerCase()))
    .limit(1);
  if (existing) {
    return {
      success: false,
      error: "Email already in use.",
      fieldErrors: { email: ["Email already in use."] },
    };
  }

  try {
    const technicianId = await db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({
          name: data.name,
          email: data.email.toLowerCase(),
          passwordHash: await bcrypt.hash(data.password, 12),
          role: "technician",
          phone: data.phone,
          emailVerified: true,
        })
        .returning({ id: users.id });

      const [tech] = await tx
        .insert(technicians)
        .values({
          userId: user.id,
          status: data.status,
          bio: data.bio,
          specializations: data.specializations,
          weeklySchedule: DEFAULT_WEEKLY_SCHEDULE,
        })
        .returning({ id: technicians.id });

      return tech.id;
    });

    revalidatePath("/admin/technicians");
    return { success: true, technicianId };
  } catch (err) {
    console.error("[admin] createTechnicianAction failed:", err);
    return { success: false, error: "Failed to create technician." };
  }
}
