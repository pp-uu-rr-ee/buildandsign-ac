"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, FileText } from "lucide-react";
import { acceptBookingQuoteAction } from "@/lib/actions/bookings";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { formatPrice } from "@/lib/helpers/price";

interface Props {
  bookingId: string;
  quotedTotalInSatang: number;
}

export function AcceptQuoteCard({ bookingId, quotedTotalInSatang }: Props) {
  const router = useRouter();
  const { t } = useLanguage();
  const [isPending, startTransition] = useTransition();

  const accept = () =>
    startTransition(async () => {
      const res = await acceptBookingQuoteAction(bookingId);
      if (res.success) {
        toast.success(t.booking.quoteAccepted);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });

  return (
    <div className="rounded-xl border-2 border-blue-300 dark:border-blue-700 bg-blue-50/40 dark:bg-blue-950/20 p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
          <FileText className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            {t.booking.quoteReadyTitle}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {t.booking.quoteReadySubtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-lg bg-white dark:bg-gray-900 border border-blue-200 dark:border-blue-800 px-4 py-3">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {t.booking.totalQuote}
        </span>
        <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {formatPrice(quotedTotalInSatang)}
        </span>
      </div>

      <button
        type="button"
        onClick={accept}
        disabled={isPending}
        className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        <CheckCircle2 className="h-4 w-4" />
        {isPending ? t.booking.accepting : t.booking.acceptQuote}
      </button>
    </div>
  );
}
