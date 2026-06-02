import type { Metadata } from "next";
import { CartPageClient } from "@/components/shop/CartPageClient";

export const metadata: Metadata = { title: "Your Cart" };

export default function CartPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Cart</h1>
      <CartPageClient />
    </div>
  );
}
