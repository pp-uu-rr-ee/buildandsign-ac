"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { savedCards, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { deleteCustomerCard } from "@/lib/payment/opn";

export type CardActionResult =
  | { success: true }
  | { success: false; error: string };

export async function deleteCardAction(
  _prev: CardActionResult,
  formData: FormData
): Promise<CardActionResult> {
  const session = await getSession();
  if (!session) return { success: false, error: "Not authenticated." };

  const cardId = formData.get("cardId") as string;
  if (!cardId) return { success: false, error: "Card ID missing." };

  const [card] = await db
    .select()
    .from(savedCards)
    .where(and(eq(savedCards.id, cardId), eq(savedCards.userId, session.userId)))
    .limit(1);

  if (!card) return { success: false, error: "Card not found." };

  const [user] = await db
    .select({ opnCustomerId: users.opnCustomerId })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  // Delete from Opn (best-effort)
  if (user?.opnCustomerId) {
    try {
      await deleteCustomerCard(user.opnCustomerId, card.opnCardId);
    } catch {
      // Card may already be removed from Opn side — continue
    }
  }

  await db.delete(savedCards).where(eq(savedCards.id, cardId));

  revalidatePath("/account/cards");
  return { success: true };
}

export async function setDefaultCardAction(
  _prev: CardActionResult,
  formData: FormData
): Promise<CardActionResult> {
  const session = await getSession();
  if (!session) return { success: false, error: "Not authenticated." };

  const cardId = formData.get("cardId") as string;
  if (!cardId) return { success: false, error: "Card ID missing." };

  const [card] = await db
    .select({ id: savedCards.id })
    .from(savedCards)
    .where(and(eq(savedCards.id, cardId), eq(savedCards.userId, session.userId)))
    .limit(1);

  if (!card) return { success: false, error: "Card not found." };

  // Clear existing defaults then set this one
  await db
    .update(savedCards)
    .set({ isDefault: false })
    .where(eq(savedCards.userId, session.userId));

  await db
    .update(savedCards)
    .set({ isDefault: true })
    .where(eq(savedCards.id, cardId));

  revalidatePath("/account/cards");
  return { success: true };
}
