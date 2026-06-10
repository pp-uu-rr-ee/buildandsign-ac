"use client";

import Link from "next/link";
import Image from "next/image";
import { Trash2, ShoppingCart, ArrowRight } from "lucide-react";
import { useCart, cartTotal } from "@/lib/store/cart";
import { formatPrice } from "@/lib/helpers/price";
import { useLanguage } from "@/components/providers/LanguageProvider";

const SHIPPING_THRESHOLD = 500000; // ₱5,000 — free shipping above this
const SHIPPING_FLAT = 49900;       // ₱499

export function CartPageClient() {
  const { items, removeItem, updateQty, clearCart } = useCart();
  const { t, lang } = useLanguage();
  const subtotal = cartTotal(items);
  const shipping = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;
  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
        <ShoppingCart className="h-16 w-16 text-gray-200" />
        <h2 className="text-xl font-semibold text-gray-700">Your cart is empty</h2>
        <p className="text-gray-400 text-sm">Add some AC units to get started.</p>
        <Link
          href="/products"
          className="mt-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
      {/* Items */}
      <div className="lg:col-span-2 space-y-1">
        <div className="flex justify-end mb-2">
          <button
            onClick={clearCart}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            Clear cart
          </button>
        </div>

        {items.map((item) => (
          <div
            key={item.variantId}
            className="flex gap-4 py-5 border-b border-gray-100"
          >
            {/* Image */}
            <div className="relative h-24 w-24 rounded-xl border border-gray-200 bg-gray-50 overflow-hidden shrink-0">
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                  <ShoppingCart className="h-8 w-8" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <Link
                href={`/products/${item.slug}`}
                className="font-medium text-gray-900 hover:text-blue-600 transition-colors line-clamp-2"
              >
                {item.name}
                {item.size && (
                  <span className="ml-1.5 text-sm font-semibold text-blue-600">
                    · {item.size}
                  </span>
                )}
              </Link>
              <p className="text-sm text-gray-500 mt-0.5">
                {formatPrice(item.unitPriceInSatang)} each
              </p>

              <div className="flex items-center justify-between mt-3">
                {/* Qty */}
                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => updateQty(item.variantId, item.quantity - 1)}
                    className="px-3 py-1.5 text-gray-500 hover:bg-gray-100 transition-colors"
                  >
                    −
                  </button>
                  <span className="px-4 py-1.5 text-sm font-semibold border-x border-gray-200 min-w-[2.5rem] text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQty(item.variantId, item.quantity + 1)}
                    className="px-3 py-1.5 text-gray-500 hover:bg-gray-100 transition-colors"
                  >
                    +
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-900">
                    {formatPrice(item.unitPriceInSatang * item.quantity)}
                  </span>
                  <button
                    onClick={() => removeItem(item.variantId)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                    aria-label="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Order summary */}
      <aside>
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 sticky top-24 space-y-4">
          <h2 className="font-semibold text-gray-900">Order Summary</h2>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Shipping</span>
              <span>
                {shipping === 0 ? (
                  <span className="text-green-600 font-medium">Free</span>
                ) : (
                  formatPrice(shipping)
                )}
              </span>
            </div>
            {shipping > 0 && (
              <p className="text-xs text-gray-400">
                Free shipping on orders over {formatPrice(SHIPPING_THRESHOLD)}.
              </p>
            )}
          </div>

          <div className="border-t border-gray-200 pt-4 flex justify-between font-semibold text-gray-900">
            <span>Total</span>
            <span className="text-lg">{formatPrice(total)}</span>
          </div>

          <Link
            href="/checkout"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
          >
            {t.cart.proceedCheckout}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="text-xs text-gray-400 text-center">
            {lang === "th"
              ? "ไม่มีการชำระเงินออนไลน์ ทีมงานจะติดต่อกลับ"
              : "No online payment — our team will contact you."}
          </p>

          <Link
            href="/products"
            className="block text-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Continue shopping
          </Link>
        </div>
      </aside>
    </div>
  );
}
