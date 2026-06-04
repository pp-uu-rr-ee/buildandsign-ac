import type { Metadata } from "next";
import { CheckoutForm } from "@/components/shop/CheckoutForm";
import { getT } from "@/lib/helpers/lang";
import { getSession } from "@/lib/session";
import { db } from "@/db";
import { savedCards } from "@/db/schema";
import { eq } from "drizzle-orm";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const t = await getT();
  const publicKey = process.env.PAYMENT_PUBLIC_KEY ?? "";
  const session = await getSession();

  const userSavedCards = session
    ? await db
        .select({
          id: savedCards.id,
          last4: savedCards.last4,
          brand: savedCards.brand,
          expMonth: savedCards.expMonth,
          expYear: savedCards.expYear,
          isDefault: savedCards.isDefault,
        })
        .from(savedCards)
        .where(eq(savedCards.userId, session.userId))
        .orderBy(savedCards.createdAt)
    : [];

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        {t.checkout.title}
      </h1>
      <CheckoutForm
        opnPublicKey={publicKey}
        savedCards={userSavedCards}
        isLoggedIn={!!session}
      />
    </div>
  );
}
