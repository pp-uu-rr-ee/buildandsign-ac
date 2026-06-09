import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckoutForm } from "@/components/shop/CheckoutForm";
import { getT } from "@/lib/helpers/lang";
import { getSession } from "@/lib/session";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const t = await getT();
  const session = await getSession();
  if (!session) redirect("/login?callbackUrl=/checkout");

  const [account] = await db
    .select({ name: users.name, email: users.email, phone: users.phone })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (!account) redirect("/login");

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        {t.checkout.title}
      </h1>
      <CheckoutForm
        accountName={account.name}
        accountEmail={account.email}
        accountPhone={account.phone}
      />
    </div>
  );
}
