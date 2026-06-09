"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { setBookingQuoteAction } from "@/lib/actions/bookings";
import { formatPrice } from "@/lib/helpers/price";

interface Props {
  bookingId: string;
  quotedPriceInSatang: number | null;
  quoteConfirmedAt: Date | null;
}

export function BookingQuoteForm({
  bookingId,
  quotedPriceInSatang,
  quoteConfirmedAt,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [quotedBaht, setQuotedBaht] = useState<string>(
    quotedPriceInSatang ? String(quotedPriceInSatang / 100) : ""
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(quotedBaht);
    if (!n || n <= 0) {
      toast.error("Enter a valid quote amount.");
      return;
    }
    startTransition(async () => {
      const res = await setBookingQuoteAction(bookingId, n);
      if (res.success) {
        toast.success("Quote saved");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 text-sm">Pricing & Quote</h2>
        {quoteConfirmedAt && (
          <span className="text-[10px] uppercase tracking-wide bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
            Quote confirmed
          </span>
        )}
      </div>

      <div className="px-5 py-4 space-y-4 text-sm">
        {quotedPriceInSatang != null && (
          <div>
            <p className="text-xs text-gray-400">Current quote</p>
            <p className="font-semibold text-gray-900">
              {formatPrice(quotedPriceInSatang)}
            </p>
          </div>
        )}

        <form onSubmit={onSubmit} className="border-t border-gray-100 pt-4 space-y-2">
          <label className="block text-xs font-medium text-gray-600">
            {quoteConfirmedAt ? "Update quote (THB)" : "Set quote (THB)"}
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={quotedBaht}
              onChange={(e) => setQuotedBaht(e.target.value)}
              min={1}
              step="1"
              placeholder="e.g. 1500"
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {isPending ? "Saving…" : quoteConfirmedAt ? "Update" : "Confirm"}
            </button>
          </div>
          <p className="text-[11px] text-gray-400">
            Customer accepts the quote to lock the slot. Settlement is handled offline via Line/Facebook/phone.
          </p>
        </form>
      </div>
    </div>
  );
}
