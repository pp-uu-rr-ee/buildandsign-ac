"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, type SavedAddress } from "@/db/schema";
import { getSession } from "@/lib/session";
import { addressSchema, type AddressInput } from "@/lib/validations/address";

export type AddressResult =
  | { success: true }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

async function loadAddresses(userId: string): Promise<SavedAddress[]> {
  const [row] = await db
    .select({ saved: users.savedAddresses })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row?.saved ?? [];
}

async function persist(userId: string, list: SavedAddress[]) {
  await db
    .update(users)
    .set({ savedAddresses: list, updatedAt: new Date() })
    .where(eq(users.id, userId));
  revalidatePath("/account");
}

function parse(formData: FormData) {
  return addressSchema.safeParse({
    addressLine1: formData.get("addressLine1"),
    addressLine2: (formData.get("addressLine2") as string) || undefined,
    city: formData.get("city"),
    province: formData.get("province"),
    postalCode: formData.get("postalCode"),
  });
}

function fail(parsed: ReturnType<typeof parse>): AddressResult {
  return {
    success: false,
    error: "Please fix the errors below.",
    fieldErrors: (parsed as { error: { flatten: () => { fieldErrors: Record<string, string[]> } } })
      .error.flatten().fieldErrors,
  };
}

// ── Add ───────────────────────────────────────────────────────────────────────
export async function addAddressAction(
  _prev: AddressResult,
  formData: FormData
): Promise<AddressResult> {
  const session = await getSession();
  if (!session) return { success: false, error: "Please log in." };

  const parsed = parse(formData);
  if (!parsed.success) return fail(parsed);

  const list = await loadAddresses(session.userId);
  const next: SavedAddress = {
    id: randomUUID(),
    ...(parsed.data as AddressInput),
    isDefault: list.length === 0, // first address becomes the default
  };
  await persist(session.userId, [...list, next]);
  return { success: true };
}

// ── Update ────────────────────────────────────────────────────────────────────
export async function updateAddressAction(
  _prev: AddressResult,
  formData: FormData
): Promise<AddressResult> {
  const session = await getSession();
  if (!session) return { success: false, error: "Please log in." };

  const id = formData.get("id") as string | null;
  if (!id) return { success: false, error: "Missing address id." };

  const parsed = parse(formData);
  if (!parsed.success) return fail(parsed);

  const list = await loadAddresses(session.userId);
  if (!list.some((a) => a.id === id)) {
    return { success: false, error: "Address not found." };
  }
  const updated = list.map((a) =>
    a.id === id ? { ...a, ...(parsed.data as AddressInput) } : a
  );
  await persist(session.userId, updated);
  return { success: true };
}

// ── Delete ────────────────────────────────────────────────────────────────────
export async function deleteAddressAction(id: string): Promise<AddressResult> {
  const session = await getSession();
  if (!session) return { success: false, error: "Please log in." };

  const list = await loadAddresses(session.userId);
  const removed = list.find((a) => a.id === id);
  let next = list.filter((a) => a.id !== id);
  // If we deleted the default, promote the first remaining address.
  if (removed?.isDefault && next.length > 0 && !next.some((a) => a.isDefault)) {
    next = next.map((a, i) => ({ ...a, isDefault: i === 0 }));
  }
  await persist(session.userId, next);
  return { success: true };
}

// ── Set default ───────────────────────────────────────────────────────────────
export async function setDefaultAddressAction(id: string): Promise<AddressResult> {
  const session = await getSession();
  if (!session) return { success: false, error: "Please log in." };

  const list = await loadAddresses(session.userId);
  if (!list.some((a) => a.id === id)) {
    return { success: false, error: "Address not found." };
  }
  await persist(
    session.userId,
    list.map((a) => ({ ...a, isDefault: a.id === id }))
  );
  return { success: true };
}

/**
 * Called from the order/booking actions: if the customer has no saved
 * addresses yet, save the one they just used so it's offered next time.
 */
export async function ensureSavedAddress(
  userId: string,
  addr: AddressInput
): Promise<void> {
  const list = await loadAddresses(userId);
  if (list.length > 0) return;
  await db
    .update(users)
    .set({
      savedAddresses: [{ id: randomUUID(), ...addr, isDefault: true }],
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}
