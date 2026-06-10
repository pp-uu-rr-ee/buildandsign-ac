"use client";

import { useActionState, useEffect, useRef, startTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, MessageCircle, ExternalLink, Phone, User, Mail, Pencil } from "lucide-react";
import { useCart, cartTotal } from "@/lib/store/cart";
import { createOrderAction } from "@/lib/actions/orders";
import type { OrderActionResult } from "@/lib/actions/orders";
import { formatPrice } from "@/lib/helpers/price";
import { useLanguage } from "@/components/providers/LanguageProvider";

const SHIPPING_THRESHOLD = 500000;
const SHIPPING_FLAT = 49900;

const initialState: OrderActionResult = { success: true, orderId: "" };

type Props = {
  accountName: string;
  accountEmail: string;
  accountPhone: string | null;
};

export function CheckoutForm({ accountName, accountEmail, accountPhone }: Props) {
  const { t, lang } = useLanguage();
  const { items, clearCart } = useCart();
  const subtotal = cartTotal(items);
  const shipping = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;
  const total = subtotal + shipping;

  const [state, formAction, isPending] = useActionState(createOrderAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success && state.orderId) clearCart();
  }, [state, clearCart]);

  const fieldErrors = !state.success ? state.fieldErrors : undefined;
  const globalError = !state.success && !state.fieldErrors ? state.error : null;

  const handleSubmit = () => {
    const fd = new FormData(formRef.current!);
    startTransition(() => {
      formAction(fd);
    });
  };

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

  const lineUrl = process.env.NEXT_PUBLIC_LINE_URL ?? "";
  const fbUrl = process.env.NEXT_PUBLIC_FACEBOOK_URL ?? "";
  const phone = process.env.NEXT_PUBLIC_BUSINESS_PHONE ?? "";

  const submitLabel = lang === "th" ? "ส่งคำสอบถาม" : "Send Inquiry";
  const submittingLabel = lang === "th" ? "กำลังส่ง..." : "Sending...";
  const inquiryNote =
    lang === "th"
      ? "หลังจากส่งคำสอบถาม ทีมงานจะติดต่อกลับเพื่อยืนยันราคา รายละเอียดการจัดส่ง และวิธีชำระเงินผ่านช่องทางที่คุณสะดวก"
      : "After you send the inquiry our team will reach out to confirm pricing, delivery details, and a payment method that works for you.";

  return (
    <form ref={formRef} onSubmit={(e) => e.preventDefault()}>
      <input type="hidden" name="cartItems" value={JSON.stringify(items)} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        {/* Left — form fields */}
        <div className="lg:col-span-3 space-y-8">
          {globalError && (
            <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300">
              {globalError}
            </div>
          )}

          {/* Inquiry intro */}
          <div className="rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/40 dark:bg-blue-950/20 p-4 text-sm text-blue-900 dark:text-blue-200">
            <p className="font-semibold mb-1">
              {lang === "th" ? "ไม่มีการชำระเงินออนไลน์" : "No online payment"}
            </p>
            <p className="text-xs leading-relaxed">{inquiryNote}</p>
          </div>

          {/* Contact — pulled from the account, read-only */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h2 className="font-semibold text-gray-900 dark:text-white">
                {t.checkout.contactInfo}
              </h2>
              <Link
                href="/account"
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <Pencil className="h-3 w-3" />
                {lang === "th" ? "แก้ไขข้อมูลบัญชี" : "Edit account"}
              </Link>
            </div>
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/40 divide-y divide-gray-200 dark:divide-gray-700">
              <ContactRow
                icon={<User className="h-4 w-4" />}
                label={t.checkout.fullName}
                value={accountName}
              />
              <ContactRow
                icon={<Mail className="h-4 w-4" />}
                label={t.checkout.email}
                value={accountEmail}
              />
              <ContactRow
                icon={<Phone className="h-4 w-4" />}
                label={t.checkout.phone}
                value={
                  accountPhone || (
                    <Link
                      href="/account"
                      className="text-red-600 dark:text-red-400 hover:underline text-xs"
                    >
                      {lang === "th"
                        ? "ยังไม่มีเบอร์ — เพิ่มที่บัญชีก่อน"
                        : "Missing — add a phone number first"}
                    </Link>
                  )
                }
              />
            </div>
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

          {/* Notes */}
          <section>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {lang === "th" ? "หมายเหตุ" : "Notes"}{" "}
              <span className="text-gray-400 dark:text-gray-500 font-normal">
                ({lang === "th" ? "ถ้ามี" : "optional"})
              </span>
            </label>
            <textarea
              name="notes"
              rows={3}
              placeholder={
                lang === "th"
                  ? "เช่น เวลาที่สะดวกให้ติดต่อกลับ ช่องทางที่ต้องการ ฯลฯ"
                  : "Preferred contact time, channel, special requests, etc."
              }
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            />
          </section>

          {/* Direct contact channels */}
          <section className="space-y-3">
            <h2 className="font-semibold text-gray-900 dark:text-white">
              {lang === "th" ? "หรือทักหาเราโดยตรง" : "Or contact us directly"}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {lineUrl && (
                <a
                  href={lineUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/30 text-sm font-semibold text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-950/50 transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  Line
                </a>
              )}
              {fbUrl && (
                <a
                  href={fbUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30 text-sm font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  Facebook
                </a>
              )}
              {phone && (
                <a
                  href={`tel:${phone.replace(/\s/g, "")}`}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  {phone}
                </a>
              )}
            </div>
          </section>
        </div>

        {/* Right — order summary */}
        <aside className="lg:col-span-2">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-6 sticky top-24 space-y-5">
            <h2 className="font-semibold text-gray-900 dark:text-white">{t.checkout.yourOrder}</h2>

            <ul className="space-y-3 max-h-64 overflow-y-auto">
              {items.map((item) => (
                <li key={item.variantId} className="flex items-center gap-3">
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
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 line-clamp-2">
                      {item.name}
                      {item.size && (
                        <span className="ml-1 text-blue-600 dark:text-blue-400 font-semibold">
                          · {item.size}
                        </span>
                      )}
                    </p>
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
                <span className="text-gray-900 dark:text-white">
                  {lang === "th" ? "ราคาประมาณ" : "Estimated total"}
                </span>
                <span className="text-gray-900 dark:text-white">{formatPrice(total)}</span>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed pt-1">
                {lang === "th"
                  ? "ราคาสุดท้ายจะยืนยันโดยทีมงานหลังตรวจสอบสต็อกและสถานที่จัดส่ง"
                  : "Final price will be confirmed by our team after checking stock and delivery details."}
              </p>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending}
              className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? submittingLabel : submitLabel}
            </button>

            <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
              {lang === "th" ? "การส่งคำสอบถามถือว่ายอมรับ " : "By submitting you agree to our "}
              <Link href="/terms" className="underline hover:text-gray-600 dark:hover:text-gray-300">
                {lang === "th" ? "ข้อกำหนดการให้บริการ" : "Terms of Service"}
              </Link>.
            </p>
          </div>
        </aside>
      </div>
    </form>
  );
}

function ContactRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="text-gray-400 dark:text-gray-500 shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500">
          {label}
        </p>
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
          {value}
        </p>
      </div>
    </div>
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
