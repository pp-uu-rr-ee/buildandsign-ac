"use client";

import { useActionState, useEffect, useRef, useState, startTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, CreditCard, Check } from "lucide-react";
import { useCart, cartTotal } from "@/lib/store/cart";
import { createOrderAction } from "@/lib/actions/orders";
import type { OrderActionResult } from "@/lib/actions/orders";
import { formatPrice } from "@/lib/helpers/price";
import { useLanguage } from "@/components/providers/LanguageProvider";

declare global {
  interface Window {
    Omise: {
      setPublicKey: (key: string) => void;
      createToken: (
        type: "card",
        data: {
          name: string;
          number: string;
          expiration_month: number;
          expiration_year: number;
          security_code: string;
        },
        callback: (statusCode: number, response: { id?: string; message?: string }) => void
      ) => void;
    };
  }
}

const SHIPPING_THRESHOLD = 500000;
const SHIPPING_FLAT = 49900;

type SavedCard = {
  id: string;
  last4: string;
  brand: string | null;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
};

const initialState: OrderActionResult = { success: true, orderId: "" };

export function CheckoutForm({
  opnPublicKey,
  savedCards,
  isLoggedIn,
}: {
  opnPublicKey: string;
  savedCards: SavedCard[];
  isLoggedIn: boolean;
}) {
  const { t } = useLanguage();
  const { items, clearCart } = useCart();
  const subtotal = cartTotal(items);
  const shipping = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;
  const total = subtotal + shipping;

  const [state, formAction, isActionPending] = useActionState(createOrderAction, initialState);

  const formRef = useRef<HTMLFormElement>(null);

  const [omiseReady, setOmiseReady] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState("cod");

  // "new" means the new-card form; otherwise it's the DB id of a saved card
  const defaultCardId = savedCards.find((c) => c.isDefault)?.id ?? savedCards[0]?.id;
  const [selectedSavedCard, setSelectedSavedCard] = useState<string>(
    savedCards.length > 0 ? (defaultCardId ?? "new") : "new"
  );
  const [rememberCard, setRememberCard] = useState(false);
  const [cardError, setCardError] = useState("");
  const [isCardPending, setIsCardPending] = useState(false);

  // Card field state (not submitted directly — tokenized instead)
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expMonth, setExpMonth] = useState("");
  const [expYear, setExpYear] = useState("");
  const [cvv, setCvv] = useState("");

  const isPending = isActionPending || isCardPending;

  // Load OmiseJS
  useEffect(() => {
    if (!opnPublicKey) return;
    const script = document.createElement("script");
    script.src = "https://cdn.omise.co/omise.js";
    script.async = true;
    script.onload = () => setOmiseReady(true);
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, [opnPublicKey]);

  // Clear cart after successful order
  useEffect(() => {
    if (state.success && state.orderId) clearCart();
  }, [state, clearCart]);

  const fieldErrors = !state.success ? state.fieldErrors : undefined;
  const globalError = !state.success && !state.fieldErrors ? state.error : null;

  const handlePlaceOrder = () => {
    setCardError("");

    if (selectedMethod === "card" && selectedSavedCard === "new") {
      // New card — tokenize first, then build FormData with the real token
      if (!omiseReady || !window.Omise) {
        setCardError("Payment system loading, please try again.");
        return;
      }
      const month = parseInt(expMonth, 10);
      const year = parseInt(expYear, 10);
      if (!cardName || !cardNumber || !month || !year || !cvv) {
        setCardError("Please fill in all card details.");
        return;
      }

      setIsCardPending(true);
      window.Omise.setPublicKey(opnPublicKey);
      window.Omise.createToken(
        "card",
        {
          name: cardName,
          number: cardNumber.replace(/\D/g, ""),
          expiration_month: month,
          expiration_year: year,
          security_code: cvv,
        },
        (statusCode, response) => {
          if (statusCode === 200 && response.id) {
            const fd = new FormData(formRef.current!);
            fd.set("opnToken", response.id);
            fd.set("savedCardId", "");
            fd.set("rememberCard", rememberCard ? "true" : "false");
            startTransition(() => { formAction(fd); });
          } else {
            setIsCardPending(false);
            setCardError(response.message ?? t.checkout.paymentFailed);
          }
        }
      );
    } else {
      // Saved card or non-card method — submit directly
      const fd = new FormData(formRef.current!);
      fd.set("opnToken", "");
      fd.set("savedCardId", selectedMethod === "card" ? selectedSavedCard : "");
      fd.set("rememberCard", "false");
      startTransition(() => { formAction(fd); });
    }
  };

  const formatCardNumber = (v: string) =>
    v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();

  const currentYear = new Date().getFullYear();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
        <ShoppingCart className="h-16 w-16 text-gray-200 dark:text-gray-700" />
        <p className="text-gray-500 dark:text-gray-400 font-medium">{t.cart.cartEmpty}</p>
        <Link href="/products" className="text-blue-600 hover:underline text-sm">
          {t.cart.browseLink}
        </Link>
      </div>
    );
  }

  const PAYMENT_METHODS = [
    { value: "cod", label: t.checkout.cod, description: t.checkout.codDesc },
    ...(opnPublicKey
      ? [{ value: "card", label: t.checkout.card, description: t.checkout.cardDesc }]
      : []),
  ];

  const cardBrandIcon = (brand: string | null) => {
    const b = (brand ?? "").toLowerCase();
    if (b === "visa") return "💳";
    if (b === "mastercard") return "💳";
    return "💳";
  };

  return (
    <form ref={formRef}>
      <input type="hidden" name="cartItems" value={JSON.stringify(items)} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        {/* Left — form fields */}
        <div className="lg:col-span-3 space-y-8">
          {(globalError || cardError) && (
            <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300">
              {cardError || globalError}
            </div>
          )}

          {/* Contact */}
          <section className="space-y-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">{t.checkout.contactInfo}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={t.checkout.fullName} name="fullName" required error={fieldErrors?.fullName?.[0]} />
              <Field label={t.checkout.phone} name="phone" type="tel" required error={fieldErrors?.phone?.[0]} />
            </div>
            <Field label={t.checkout.email} name="email" type="email" required error={fieldErrors?.email?.[0]} />
          </section>

          {/* Shipping address */}
          <section className="space-y-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">{t.checkout.shippingAddress}</h2>
            <Field label={t.checkout.addressLine1} name="addressLine1" required error={fieldErrors?.addressLine1?.[0]} />
            <Field label={t.checkout.addressLine2} name="addressLine2" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label={t.checkout.city} name="city" required error={fieldErrors?.city?.[0]} />
              <Field label={t.checkout.province} name="province" required error={fieldErrors?.province?.[0]} />
              <Field label={t.checkout.postalCode} name="postalCode" required error={fieldErrors?.postalCode?.[0]} />
            </div>
          </section>

          {/* Payment method */}
          <section className="space-y-3">
            <h2 className="font-semibold text-gray-900 dark:text-white">{t.checkout.paymentMethod}</h2>
            {fieldErrors?.paymentMethod && (
              <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.paymentMethod[0]}</p>
            )}
            <div className="space-y-2">
              {PAYMENT_METHODS.map((method) => (
                <label
                  key={method.value}
                  className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 dark:has-[:checked]:bg-blue-950 transition-colors"
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.value}
                    className="mt-0.5 accent-blue-600"
                    defaultChecked={method.value === "cod"}
                    onChange={() => setSelectedMethod(method.value)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {method.value === "card" && <CreditCard className="h-4 w-4 text-blue-600 shrink-0" />}
                      <p className="font-medium text-sm text-gray-900 dark:text-white">{method.label}</p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{method.description}</p>
                  </div>
                </label>
              ))}
            </div>

            {/* Card sub-panel — always in DOM (CSS hidden) */}
            <div className={selectedMethod === "card" ? "space-y-3 mt-3" : "hidden"}>

              {/* Saved cards list */}
              {savedCards.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t.checkout.savedCards}
                  </p>
                  {savedCards.map((card) => (
                    <label
                      key={card.id}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 dark:has-[:checked]:bg-blue-950 transition-colors"
                    >
                      <input
                        type="radio"
                        name="cardSubSelection"
                        value={card.id}
                        className="accent-blue-600"
                        checked={selectedSavedCard === card.id}
                        onChange={() => setSelectedSavedCard(card.id)}
                      />
                      <span className="text-base">{cardBrandIcon(card.brand)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {card.brand ?? "Card"} •••• {card.last4}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Expires {String(card.expMonth).padStart(2, "0")}/{card.expYear}
                        </p>
                      </div>
                      {card.isDefault && (
                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400 shrink-0">Default</span>
                      )}
                    </label>
                  ))}

                  {/* New card option */}
                  <label className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 dark:has-[:checked]:bg-blue-950 transition-colors">
                    <input
                      type="radio"
                      name="cardSubSelection"
                      value="new"
                      className="accent-blue-600"
                      checked={selectedSavedCard === "new"}
                      onChange={() => setSelectedSavedCard("new")}
                    />
                    <CreditCard className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t.checkout.useNewCard}
                    </p>
                  </label>
                </div>
              )}

              {/* New card form — always in DOM, hidden via CSS when saved card is selected */}
              <div className={selectedSavedCard === "new" ? "space-y-4 p-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30" : "hidden"}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t.checkout.cardName} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    autoComplete="cc-name"
                    placeholder="Jane Doe"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t.checkout.cardNumber} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="cc-number"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    maxLength={19}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono tracking-wider"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t.checkout.expMonth} <span className="text-red-500">*</span>
                    </label>
                    <select
                      autoComplete="cc-exp-month"
                      value={expMonth}
                      onChange={(e) => setExpMonth(e.target.value)}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">MM</option>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                        <option key={m} value={m}>{String(m).padStart(2, "0")}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t.checkout.expYear} <span className="text-red-500">*</span>
                    </label>
                    <select
                      autoComplete="cc-exp-year"
                      value={expYear}
                      onChange={(e) => setExpYear(e.target.value)}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">YYYY</option>
                      {Array.from({ length: 11 }, (_, i) => currentYear + i).map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t.checkout.cvv} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      placeholder="•••"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      maxLength={4}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                    />
                  </div>
                </div>

                {/* Remember card checkbox — only for logged-in users */}
                {isLoggedIn && (
                  <label className="flex items-center gap-3 cursor-pointer select-none group">
                    <div
                      className={`h-4 w-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                        rememberCard
                          ? "bg-blue-600 border-blue-600"
                          : "border-gray-300 dark:border-gray-600 group-hover:border-blue-400"
                      }`}
                      onClick={() => setRememberCard((v) => !v)}
                    >
                      {rememberCard && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                    </div>
                    <span
                      className="text-sm text-gray-700 dark:text-gray-300"
                      onClick={() => setRememberCard((v) => !v)}
                    >
                      {t.checkout.rememberCard}
                    </span>
                  </label>
                )}

                <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                  <CreditCard className="h-3 w-3" />
                  Secured by Opn Payments · Visa &amp; Mastercard accepted
                </p>
              </div>
            </div>
          </section>

          {/* Notes */}
          <section>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Order notes <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span>
            </label>
            <textarea
              name="notes"
              rows={3}
              placeholder="Special delivery instructions, preferred time, etc."
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            />
          </section>
        </div>

        {/* Right — order summary */}
        <aside className="lg:col-span-2">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-6 sticky top-24 space-y-5">
            <h2 className="font-semibold text-gray-900 dark:text-white">{t.checkout.yourOrder}</h2>

            <ul className="space-y-3 max-h-64 overflow-y-auto">
              {items.map((item) => (
                <li key={item.productId} className="flex items-center gap-3">
                  <div className="relative h-12 w-12 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shrink-0">
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt={item.name} fill sizes="48px" className="object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-300 dark:text-gray-600">
                        <ShoppingCart className="h-4 w-4" />
                      </div>
                    )}
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 line-clamp-2">{item.name}</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white shrink-0">
                    {formatPrice(item.unitPriceInSatang * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t.checkout.subtotal}</span>
                <span className="text-gray-900 dark:text-white">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t.checkout.shipping}</span>
                <span className="text-gray-900 dark:text-white">
                  {shipping === 0
                    ? <span className="text-green-600 font-medium">{t.checkout.free}</span>
                    : formatPrice(shipping)}
                </span>
              </div>
              <div className="flex justify-between font-semibold text-base border-t border-gray-200 dark:border-gray-700 pt-3 mt-1">
                <span className="text-gray-900 dark:text-white">{t.checkout.total}</span>
                <span className="text-gray-900 dark:text-white">{formatPrice(total)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={isPending}
              className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {isPending
                ? (selectedMethod === "card" ? t.checkout.processing : t.checkout.placing)
                : t.checkout.placeOrder}
            </button>

            <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
              By placing your order you agree to our{" "}
              <Link href="/terms" className="underline hover:text-gray-600 dark:hover:text-gray-300">Terms of Service</Link>.
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
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={name} name={name} type={type} placeholder={placeholder} required={required}
        className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
