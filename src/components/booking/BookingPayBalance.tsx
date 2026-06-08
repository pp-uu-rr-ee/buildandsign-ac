"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CreditCard } from "lucide-react";
import { payBookingBalanceAction } from "@/lib/actions/bookings";
import { formatPrice } from "@/lib/helpers/price";
import { useLanguage } from "@/components/providers/LanguageProvider";

declare global {
  interface Window {
    Omise?: {
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

type SavedCard = {
  id: string;
  last4: string;
  brand: string | null;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
};

interface Props {
  bookingId: string;
  balanceInSatang: number;
  opnPublicKey: string;
  savedCards?: SavedCard[];
}

export function BookingPayBalance({
  bookingId,
  balanceInSatang,
  opnPublicKey,
  savedCards = [],
}: Props) {
  const router = useRouter();
  const { t } = useLanguage();

  const defaultCardId = savedCards.find((c) => c.isDefault)?.id ?? savedCards[0]?.id;
  const [selectedCard, setSelectedCard] = useState<string>(
    savedCards.length > 0 ? defaultCardId ?? "new" : "new"
  );
  const usingNewCard = selectedCard === "new";

  const [omiseReady, setOmiseReady] = useState(false);
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [cvv, setCvv] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!opnPublicKey) return;
    const script = document.createElement("script");
    script.src = "https://cdn.omise.co/omise.js";
    script.async = true;
    script.onload = () => setOmiseReady(true);
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, [opnPublicKey]);

  const currentYear = new Date().getFullYear();
  const formatCardNumber = (v: string) =>
    v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();

  const handlePay = async () => {
    setError(null);

    // Saved card — no tokenization
    if (!usingNewCard) {
      setIsPending(true);
      const res = await payBookingBalanceAction(bookingId, {
        savedCardId: selectedCard,
      });
      if (res.success) {
        toast.success(t.booking.paymentReceived);
        router.refresh();
      } else {
        setError(res.error);
      }
      setIsPending(false);
      return;
    }

    if (!omiseReady || !window.Omise) {
      setError(t.booking.tokenLoading);
      return;
    }
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);
    if (!name || !number || !m || !y || !cvv) {
      setError(t.booking.cardIncomplete);
      return;
    }

    setIsPending(true);
    window.Omise.setPublicKey(opnPublicKey);
    window.Omise.createToken(
      "card",
      {
        name,
        number: number.replace(/\D/g, ""),
        expiration_month: m,
        expiration_year: y,
        security_code: cvv,
      },
      async (statusCode, response) => {
        if (statusCode === 200 && response.id) {
          const res = await payBookingBalanceAction(bookingId, {
            opnToken: response.id,
          });
          if (res.success) {
            toast.success(t.booking.paymentReceived);
            router.refresh();
          } else {
            setError(res.error);
          }
        } else {
          setError(response.message ?? t.booking.cardIncomplete);
        }
        setIsPending(false);
      }
    );
  };

  return (
    <div className="rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/30 dark:bg-blue-950/20 p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{t.booking.payBalanceTitle}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {t.booking.payBalanceSubtitle}
          </p>
        </div>
        <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 shrink-0">
          {formatPrice(balanceInSatang)}
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Saved card chooser */}
      {savedCards.length > 0 && (
        <div className="space-y-2">
          {savedCards.map((card) => (
            <label
              key={card.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 cursor-pointer hover:border-blue-400 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 dark:has-[:checked]:bg-blue-950/40 transition-colors"
            >
              <input
                type="radio"
                name="balanceCardChoice"
                value={card.id}
                checked={selectedCard === card.id}
                onChange={() => setSelectedCard(card.id)}
                className="accent-blue-600"
              />
              <span className="text-base">💳</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {card.brand ?? "Card"} •••• {card.last4}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Expires {String(card.expMonth).padStart(2, "0")}/{card.expYear}
                </p>
              </div>
              {card.isDefault && (
                <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide shrink-0">
                  Default
                </span>
              )}
            </label>
          ))}
          <label className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 cursor-pointer hover:border-blue-400 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 dark:has-[:checked]:bg-blue-950/40 transition-colors">
            <input
              type="radio"
              name="balanceCardChoice"
              value="new"
              checked={selectedCard === "new"}
              onChange={() => setSelectedCard("new")}
              className="accent-blue-600"
            />
            <CreditCard className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t.checkout.useNewCard}
            </p>
          </label>
        </div>
      )}

      <div className={usingNewCard ? "space-y-3" : "hidden"}>
        <input
          type="text"
          placeholder={t.booking.cardholderName}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <input
          type="text"
          inputMode="numeric"
          placeholder="1234 5678 9012 3456"
          value={number}
          onChange={(e) => setNumber(formatCardNumber(e.target.value))}
          maxLength={19}
          className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm font-mono tracking-wider focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <div className="grid grid-cols-3 gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">MM</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>{String(m).padStart(2, "0")}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">YYYY</option>
            {Array.from({ length: 11 }, (_, i) => currentYear + i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <input
            type="password"
            inputMode="numeric"
            placeholder="CVV"
            value={cvv}
            onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
            maxLength={4}
            className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handlePay}
        disabled={isPending}
        className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        <CreditCard className="h-4 w-4" />
        {isPending ? t.booking.processing : t.booking.payAmount(formatPrice(balanceInSatang))}
      </button>

      <p className="text-[11px] text-gray-400 text-center">
        {t.booking.cardSecured}
      </p>
    </div>
  );
}
