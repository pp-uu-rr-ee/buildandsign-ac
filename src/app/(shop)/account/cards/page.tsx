import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { getSession } from "@/lib/session";
import { db } from "@/db";
import { savedCards } from "@/db/schema";
import { eq } from "drizzle-orm";
import { SavedCardsManager } from "@/components/account/SavedCardsManager";

export const metadata = { title: "Saved Cards" };

export default async function SavedCardsPage() {
  const session = await getSession();
  if (!session) redirect("/login?callbackUrl=/account/cards");

  const cards = await db
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
    .orderBy(savedCards.createdAt);

  return (
    <div className="mx-auto max-w-lg px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-6">
        <Link
          href="/account"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          My Account
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Saved Cards</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
        Manage your saved payment cards.
      </p>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <SavedCardsManager cards={cards} />
      </div>

      <div className="mt-6 flex items-start gap-2 text-xs text-gray-400 dark:text-gray-500">
        <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-green-500" />
        <p>
          Cards are stored securely with Opn Payments. We never store your full card number.
          Removing a card here also removes it from our payment processor.
        </p>
      </div>
    </div>
  );
}
