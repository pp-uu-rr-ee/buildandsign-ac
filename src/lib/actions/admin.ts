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
  const valid = z.enum(["pending","confirmed","processing","shipped","delivered","cancelled"]).safeParse(status);
  if (!valid.success) return { error: "Invalid status" };
  await db.update(orders).set({ status: valid.data, updatedAt: new Date() }).where(eq(orders.id, orderId));
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

// ── Product (series-level) management ────────────────────────────────────────
// Price / stock / SKU live on `product_variants` and have their own actions
// below. The product (series) admin form only owns the series-shared fields.
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
  // NB: z.coerce.boolean() can't be used here — it does Boolean(value), and
  // Boolean("false") is `true` because any non-empty string is truthy.
  // We accept the literal strings "true"/"false" and transform manually.
  isFeatured: z
    .union([z.literal("true"), z.literal("false"), z.boolean()])
    .optional()
    .transform((v) => v === true || v === "true"),
  // Typed series-level specs (all optional). Stored as numeric/varchar/text.
  brand: z.string().optional(),
  eer: z.string().optional(), // numeric stored as string by Drizzle
  voltage: z.string().optional(),
  refrigerant: z.string().optional(),
  warrantyText: z.string().optional(),
  // Anything else (free-form key/value) goes into JSONB. SpecsEditor sends a
  // JSON string; parseSpecsJson() validates and trims.
  specifications: z.string().optional(),
});

function trimOrNull(s: string | undefined): string | null {
  if (!s) return null;
  const t = s.trim();
  return t ? t : null;
}

/**
 * Parse the specifications JSON string the form sends. Returns null when
 * empty or invalid, so the column stays NULL instead of `{}`.
 */
function parseSpecsJson(raw: string | undefined): Record<string, string> | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const entries = Object.entries(parsed as Record<string, unknown>)
        .filter(([k, v]) => k.trim() && typeof v === "string")
        .map(([k, v]) => [k.trim(), String(v)] as const);
      if (entries.length === 0) return null;
      return Object.fromEntries(entries);
    }
  } catch {
    // fall through to null
  }
  return null;
}

export type ProductFormResult =
  | { success: true }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

export type CreateProductResult =
  | { success: true; productId: string }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

const PRODUCT_FIELDS = [
  "name","nameTh","slug","shortDescription","shortDescriptionTh","description","descriptionTh",
  "category","status","isFeatured","specifications",
  "brand","eer","voltage","refrigerant","warrantyText",
];

export async function updateProductAction(
  _prev: ProductFormResult,
  formData: FormData
): Promise<ProductFormResult> {
  const id = formData.get("id") as string;
  const raw = Object.fromEntries(
    PRODUCT_FIELDS.map((k) => [k, formData.get(k)])
  );
  raw.isFeatured = formData.get("isFeatured") === "on" ? "true" : "false";

  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors as any };
  }

  const data = parsed.data;
  const {
    specifications,
    brand, eer, voltage, refrigerant, warrantyText,
    ...rest
  } = data;

  await db.update(products).set({
    ...rest,
    nameTh: trimOrNull(rest.nameTh),
    shortDescriptionTh: trimOrNull(rest.shortDescriptionTh),
    descriptionTh: trimOrNull(rest.descriptionTh),
    isFeatured: rest.isFeatured ?? false,
    brand: trimOrNull(brand),
    eer: trimOrNull(eer),
    voltage: trimOrNull(voltage),
    refrigerant: trimOrNull(refrigerant),
    warrantyText: trimOrNull(warrantyText),
    specifications: parseSpecsJson(specifications),
    updatedAt: new Date(),
  }).where(eq(products.id, id));

  revalidatePath("/admin/products");
  revalidatePath(`/products/${data.slug}`);
  return { success: true };
}

export async function createProductAction(
  _prev: CreateProductResult,
  formData: FormData
): Promise<CreateProductResult> {
  const raw = Object.fromEntries(
    PRODUCT_FIELDS.map((k) => [k, formData.get(k)])
  );
  raw.isFeatured = formData.get("isFeatured") === "on" ? "true" : "false";

  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors as any };
  }

  const data = parsed.data;
  const {
    specifications,
    brand, eer, voltage, refrigerant, warrantyText,
    ...rest
  } = data;

  const [product] = await db.insert(products).values({
    ...rest,
    nameTh: trimOrNull(rest.nameTh),
    shortDescriptionTh: trimOrNull(rest.shortDescriptionTh),
    isFeatured: rest.isFeatured ?? false,
    brand: trimOrNull(brand),
    eer: trimOrNull(eer),
    voltage: trimOrNull(voltage),
    refrigerant: trimOrNull(refrigerant),
    warrantyText: trimOrNull(warrantyText),
    specifications: parseSpecsJson(specifications),
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

// ── Variant management ──────────────────────────────────────────────────────
const variantSchema = z.object({
  size: z.string().trim().min(1, "Size is required").max(50),
  sortOrder: z.coerce.number().int().min(0),
  sku: z.string().trim().max(100).optional().or(z.literal("")),
  priceInBaht: z.coerce.number().positive("Price must be positive"),
  comparePriceInBaht: z.coerce.number().positive().optional().or(z.literal("")),
  stock: z.coerce.number().int().min(0),
  lowStockThreshold: z.coerce.number().int().min(0),
  // Typed variant-level specs
  coolingCapacityBtu: z.coerce.number().int().min(0).optional().or(z.literal("")),
  noiseLevelDb: z.string().optional(),
  energyRating: z.string().optional(),
  roomSizeSqm: z.string().trim().max(30).optional(),
});

function readVariantTypedFields(formData: FormData) {
  return {
    coolingCapacityBtu: formData.get("coolingCapacityBtu") || "",
    noiseLevelDb: formData.get("noiseLevelDb") || "",
    energyRating: formData.get("energyRating") || "",
    roomSizeSqm: formData.get("roomSizeSqm") || "",
  };
}

function buildVariantTypedValues(parsed: {
  coolingCapacityBtu?: number | "";
  noiseLevelDb?: string;
  energyRating?: string;
  roomSizeSqm?: string;
}) {
  return {
    coolingCapacityBtu:
      typeof parsed.coolingCapacityBtu === "number" && parsed.coolingCapacityBtu > 0
        ? parsed.coolingCapacityBtu
        : null,
    noiseLevelDb: trimOrNull(parsed.noiseLevelDb),
    energyRating: trimOrNull(parsed.energyRating),
    roomSizeSqm: trimOrNull(parsed.roomSizeSqm),
  };
}

export type VariantActionResult =
  | { success: true }
  | { success: false; error: string };

export async function addVariantAction(
  productId: string,
  formData: FormData
): Promise<VariantActionResult> {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { success: false, error: "Unauthorized." };
  }

  const raw = {
    size: formData.get("size"),
    sortOrder: formData.get("sortOrder") || "0",
    sku: formData.get("sku") || "",
    priceInBaht: formData.get("priceInBaht"),
    comparePriceInBaht: formData.get("comparePriceInBaht") || "",
    stock: formData.get("stock") || "0",
    lowStockThreshold: formData.get("lowStockThreshold") || "5",
    ...readVariantTypedFields(formData),
  };

  const parsed = variantSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid variant.",
    };
  }

  const { productVariants } = await import("@/db/schema");
  await db.insert(productVariants).values({
    productId,
    size: parsed.data.size,
    sortOrder: parsed.data.sortOrder,
    sku: parsed.data.sku ? parsed.data.sku : null,
    priceInSatang: Math.round(parsed.data.priceInBaht * 100),
    comparePriceInSatang:
      parsed.data.comparePriceInBaht !== "" && parsed.data.comparePriceInBaht
        ? Math.round(Number(parsed.data.comparePriceInBaht) * 100)
        : null,
    stock: parsed.data.stock,
    lowStockThreshold: parsed.data.lowStockThreshold,
    ...buildVariantTypedValues(parsed.data),
  });

  revalidatePath("/admin/products");
  return { success: true };
}

export async function updateVariantAction(
  variantId: string,
  formData: FormData
): Promise<VariantActionResult> {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { success: false, error: "Unauthorized." };
  }

  const raw = {
    size: formData.get("size"),
    sortOrder: formData.get("sortOrder") || "0",
    sku: formData.get("sku") || "",
    priceInBaht: formData.get("priceInBaht"),
    comparePriceInBaht: formData.get("comparePriceInBaht") || "",
    stock: formData.get("stock") || "0",
    lowStockThreshold: formData.get("lowStockThreshold") || "5",
    ...readVariantTypedFields(formData),
  };

  const parsed = variantSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid variant.",
    };
  }

  const { productVariants } = await import("@/db/schema");
  await db
    .update(productVariants)
    .set({
      size: parsed.data.size,
      sortOrder: parsed.data.sortOrder,
      sku: parsed.data.sku ? parsed.data.sku : null,
      priceInSatang: Math.round(parsed.data.priceInBaht * 100),
      comparePriceInSatang:
        parsed.data.comparePriceInBaht !== "" && parsed.data.comparePriceInBaht
          ? Math.round(Number(parsed.data.comparePriceInBaht) * 100)
          : null,
      stock: parsed.data.stock,
      lowStockThreshold: parsed.data.lowStockThreshold,
      ...buildVariantTypedValues(parsed.data),
      updatedAt: new Date(),
    })
    .where(eq((await import("@/db/schema")).productVariants.id, variantId));

  revalidatePath("/admin/products");
  return { success: true };
}

export async function deleteVariantAction(
  variantId: string
): Promise<VariantActionResult> {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { success: false, error: "Unauthorized." };
  }

  const { productVariants } = await import("@/db/schema");
  await db.delete(productVariants).where(eq(productVariants.id, variantId));

  revalidatePath("/admin/products");
  return { success: true };
}

export type DeleteProductResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Hard-delete a product. order_items.product_id has ON DELETE SET NULL so
 * historical orders keep their product-name snapshot. product_images cascade.
 * R2 image blobs are left as orphans (cheap; can be reaped later).
 */
export async function deleteProductAction(id: string): Promise<DeleteProductResult> {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { success: false, error: "Unauthorized." };
  }

  try {
    const result = await db
      .delete(products)
      .where(eq(products.id, id))
      .returning({ id: products.id, slug: products.slug });

    if (result.length === 0) {
      return { success: false, error: "Product not found." };
    }

    revalidatePath("/admin/products");
    revalidatePath("/products");
    revalidatePath(`/products/${result[0].slug}`);
    return { success: true };
  } catch (err) {
    console.error("[admin] deleteProductAction failed:", err);
    return { success: false, error: "Failed to delete product." };
  }
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
