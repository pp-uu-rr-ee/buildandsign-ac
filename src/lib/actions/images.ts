"use server";

import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { productImages } from "@/db/schema";
import { uploadToR2, deleteFromR2 } from "@/lib/storage";

// ── Upload image server-side (file → Next.js → R2, no CORS needed) ────────────
export async function uploadProductImageAction(
  productId: string,
  formData: FormData
): Promise<{ url: string; key: string } | { error: string }> {
  try {
    const file = formData.get("file") as File | null;
    if (!file || file.size === 0) return { error: "No file provided." };
    if (file.size > 10 * 1024 * 1024) return { error: "File exceeds the 10 MB limit." };

    const buffer = Buffer.from(await file.arrayBuffer());
    const { key, publicUrl } = await uploadToR2(productId, buffer, file.type);
    return { url: publicUrl, key };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Upload failed." };
  }
}

// ── Save image record after successful upload ─────────────────────────────────
export async function saveProductImageAction(
  productId: string,
  url: string,
  key: string,
  altText: string | null,
  makePrimary: boolean
): Promise<{ error?: string }> {
  try {
    if (makePrimary) {
      await db
        .update(productImages)
        .set({ isPrimary: false })
        .where(eq(productImages.productId, productId));
    }

    const existing = await db
      .select({ id: productImages.id })
      .from(productImages)
      .where(eq(productImages.productId, productId));

    await db.insert(productImages).values({
      productId,
      url,
      altText,
      isPrimary: makePrimary || existing.length === 0, // first image is always primary
      sortOrder: existing.length,
    });

    revalidatePath(`/admin/products/${productId}/edit`);
    revalidatePath("/admin/products");
    revalidatePath("/products");
    return {};
  } catch {
    return { error: "Failed to save image." };
  }
}

// ── Set an image as primary ───────────────────────────────────────────────────
export async function setPrimaryImageAction(
  imageId: string,
  productId: string
): Promise<void> {
  await db
    .update(productImages)
    .set({ isPrimary: false })
    .where(eq(productImages.productId, productId));

  await db
    .update(productImages)
    .set({ isPrimary: true })
    .where(and(eq(productImages.id, imageId), eq(productImages.productId, productId)));

  revalidatePath(`/admin/products/${productId}/edit`);
  revalidatePath("/products");
}

// ── Delete an image ───────────────────────────────────────────────────────────
export async function deleteProductImageAction(
  imageId: string,
  productId: string,
  key: string
): Promise<{ error?: string }> {
  try {
    await db
      .delete(productImages)
      .where(and(eq(productImages.id, imageId), eq(productImages.productId, productId)));

    // Delete from R2 — best-effort, don't fail the whole request if it errors
    try {
      if (key) await deleteFromR2(key);
    } catch {
      // R2 delete failed but DB record is gone — acceptable
    }

    // If deleted image was primary, promote the next one
    const remaining = await db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, productId));

    const hasPrimary = remaining.some((img) => img.isPrimary);
    if (!hasPrimary && remaining.length > 0) {
      await db
        .update(productImages)
        .set({ isPrimary: true })
        .where(eq(productImages.id, remaining[0].id));
    }

    revalidatePath(`/admin/products/${productId}/edit`);
    revalidatePath("/admin/products");
    revalidatePath("/products");
    return {};
  } catch {
    return { error: "Failed to delete image." };
  }
}
