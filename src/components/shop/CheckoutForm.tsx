"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { useCart, cartTotal } from "@/lib/store/cart";
import { createOrderAction } from "@/lib/actions/orders";
import type { OrderActionResult } from "@/lib/actions/orders";
import { formatPrice } from "@/lib/helpers/price";

const SHIPPING_THRESHOLD = 500000;
const SHIPPING_FLAT = 49900;

const PAYMENT_METHODS = [
  { value: "cod", label: "Cash on Delivery", description: "Pay when your order arrives." },
  { value: "gcash", label: "GCash", description: "We'll send payment instructions after checkout." },
  { value: "bank_transfer", label: "Bank Transfer", description: "Transfer to our BDO account. We'll confirm receipt." },
];

const initialState: OrderActionResult = { success: true, orderId: "" };

export function CheckoutForm() {
  const { items, clearCart } = useCart();
  const router = useRouter();
  const subtotal = cartTotal(items);
  const shipping = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;
  const total = subtotal + shipping;

  const [state, formAction, isPending] = useActionState(createOrderAction, initialState);

  // Clear cart after successful order (redirect happens server-side, but clear on unmount)
  useEffect(() => {
    if (state.success && state.orderId) clearCart();
  }, [state, clearCart]);

  const fieldErrors = !state.success ? state.fieldErrors : undefined;
  const globalError = !state.success && !state.fieldErrors ? state.error : null;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
        <ShoppingCart className="h-16 w-16 text-gray-200" />
        <p className="text-gray-500 font-medium">Your cart is empty.</p>
        <Link href="/products" className="text-blue-600 hover:underline text-sm">
          Browse products →
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction}>
      {/* Pass cart as JSON hidden field */}
      <input type="hidden" name="cartItems" value={JSON.stringify(items)} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        {/* Left — form fields */}
        <div className="lg:col-span-3 space-y-8">
          {globalError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {globalError}
            </div>
          )}

          {/* Contact */}
          <section className="space-y-4">
            <h2 className="font-semibold text-gray-900">Contact information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full name" name="fullName" required error={fieldErrors?.fullName?.[0]} />
              <Field label="Phone number" name="phone" type="tel" required error={fieldErrors?.phone?.[0]} />
            </div>
            <Field label="Email address" name="email" type="email" required error={fieldErrors?.email?.[0]} />
          </section>

          {/* Shipping address */}
          <section className="space-y-4">
            <h2 className="font-semibold text-gray-900">Shipping address</h2>
            <Field label="Address line 1" name="addressLine1" required error={fieldErrors?.addressLine1?.[0]} />
            <Field label="Address line 2 (unit, floor, landmark)" name="addressLine2" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="City" name="city" required error={fieldErrors?.city?.[0]} />
              <Field label="Province" name="province" required error={fieldErrors?.province?.[0]} />
              <Field label="Postal code" name="postalCode" required error={fieldErrors?.postalCode?.[0]} />
            </div>
          </section>

          {/* Payment method */}
          <section className="space-y-3">
            <h2 className="font-semibold text-gray-900">Payment method</h2>
            {fieldErrors?.paymentMethod && (
              <p className="text-xs text-red-600">{fieldErrors.paymentMethod[0]}</p>
            )}
            <div className="space-y-2">
              {PAYMENT_METHODS.map((method) => (
                <label
                  key={method.value}
                  className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 cursor-pointer hover:border-blue-400 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 transition-colors"
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.value}
                    className="mt-0.5 accent-blue-600"
                    defaultChecked={method.value === "cod"}
                  />
                  <div>
                    <p className="font-medium text-sm text-gray-900">{method.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{method.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </section>

          {/* Notes */}
          <section>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Order notes <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              name="notes"
              rows={3}
              placeholder="Special delivery instructions, preferred time, etc."
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            />
          </section>
        </div>

        {/* Right — order summary */}
        <aside className="lg:col-span-2">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 sticky top-24 space-y-5">
            <h2 className="font-semibold text-gray-900">Order Summary</h2>

            {/* Items */}
            <ul className="space-y-3 max-h-64 overflow-y-auto">
              {items.map((item) => (
                <li key={item.productId} className="flex items-center gap-3">
                  <div className="relative h-12 w-12 rounded-lg border border-gray-200 bg-white overflow-hidden shrink-0">
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt={item.name} fill sizes="48px" className="object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                        <ShoppingCart className="h-4 w-4" />
                      </div>
                    )}
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700 line-clamp-2">{item.name}</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 shrink-0">
                    {formatPrice(item.unitPriceInCents * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>

            {/* Totals */}
            <div className="border-t border-gray-200 pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Shipping</span>
                <span>
                  {shipping === 0
                    ? <span className="text-green-600 font-medium">Free</span>
                    : formatPrice(shipping)}
                </span>
              </div>
              <div className="flex justify-between font-semibold text-base border-t border-gray-200 pt-3 mt-1">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? "Placing order…" : "Place Order"}
            </button>

            <p className="text-xs text-gray-400 text-center">
              By placing your order you agree to our{" "}
              <Link href="/terms" className="underline hover:text-gray-600">Terms of Service</Link>.
            </p>
          </div>
        </aside>
      </div>
    </form>
  );
}

function Field({
  label, name, type = "text", required, placeholder, error,
}: {
  label: string; name: string; type?: string; required?: boolean; placeholder?: string; error?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={name} name={name} type={type} placeholder={placeholder} required={required}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
