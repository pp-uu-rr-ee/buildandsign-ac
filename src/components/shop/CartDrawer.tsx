"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useCart, cartTotal, cartCount } from "@/lib/store/cart";
import { formatPrice } from "@/lib/helpers/price";
import { useLanguage } from "@/components/providers/LanguageProvider";

export function CartDrawer() {
  const { items, removeItem, updateQty } = useCart();
  const { t } = useLanguage();
  const total = cartTotal(items);
  const count = cartCount(items);

  return (
    <Sheet>
      <SheetTrigger
        className="relative p-2 rounded-md text-gray-600 hover:text-blue-600 hover:bg-gray-100 transition-colors dark:text-gray-300 dark:hover:bg-gray-800"
        aria-label={t.nav.cart}
      >
        <ShoppingCart className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:w-96 flex flex-col p-0 bg-white dark:bg-gray-950 dark:border-gray-800">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">
            {t.nav.cart}{" "}
            {count > 0 && <span className="text-gray-400 dark:text-gray-500 font-normal">({count})</span>}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3">
              <ShoppingCart className="h-12 w-12 text-gray-200 dark:text-gray-700" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">{t.cart.empty}</p>
              <Link href="/products" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
                {t.cart.browseAC}
              </Link>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li key={item.variantId} className="flex gap-3">
                  <div className="relative h-16 w-16 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden shrink-0 dark:border-gray-700 dark:bg-gray-800">
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt={item.name} fill sizes="64px" className="object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-300 dark:text-gray-600">
                        <ShoppingCart className="h-5 w-5" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${item.slug}`}
                      className="text-sm font-medium text-gray-900 hover:text-blue-600 line-clamp-2 leading-tight dark:text-gray-100 dark:hover:text-blue-400"
                    >
                      {item.name}
                      {item.size && (
                        <span className="ml-1 text-blue-600 dark:text-blue-400">
                          · {item.size}
                        </span>
                      )}
                    </Link>
                    <p className="text-sm font-semibold text-gray-900 mt-1 dark:text-gray-100">
                      {formatPrice(item.unitPriceInSatang * item.quantity)}
                    </p>

                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center border border-gray-200 rounded overflow-hidden dark:border-gray-700">
                        <button
                          onClick={() => updateQty(item.variantId, item.quantity - 1)}
                          className="px-2 py-0.5 text-gray-500 hover:bg-gray-100 text-sm transition-colors dark:text-gray-400 dark:hover:bg-gray-800"
                        >
                          −
                        </button>
                        <span className="px-2 py-0.5 text-xs font-semibold border-x border-gray-200 min-w-[2rem] text-center dark:border-gray-700 dark:text-gray-200">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQty(item.variantId, item.quantity + 1)}
                          className="px-2 py-0.5 text-gray-500 hover:bg-gray-100 text-sm transition-colors dark:text-gray-400 dark:hover:bg-gray-800"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.variantId)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors dark:text-gray-500 dark:hover:text-red-400"
                        aria-label={t.cart.clearCart}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-gray-200 px-5 py-4 space-y-3 dark:border-gray-800">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">{t.cart.subtotal}</span>
              <span className="font-bold text-gray-900 text-base dark:text-gray-100">{formatPrice(total)}</span>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500">{t.cart.shippingNote}</p>
            <Link
              href="/checkout"
              className="flex items-center justify-center w-full py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              {t.cart.proceedCheckout}
            </Link>
            <Link
              href="/cart"
              className="flex items-center justify-center w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors dark:text-gray-400 dark:hover:text-gray-200"
            >
              {t.cart.viewFullCart}
            </Link>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
