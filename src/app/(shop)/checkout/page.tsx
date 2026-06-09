import type { Metadata } from "next";
import { CheckoutForm } from "@/components/shop/CheckoutForm";
import { getT } from "@/lib/helpers/lang";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const t = await getT();
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        {t.checkout.title}
      </h1>
      <CheckoutForm />
    </div>
  );
}
