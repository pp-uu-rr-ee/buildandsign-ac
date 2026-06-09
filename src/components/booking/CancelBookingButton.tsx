"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { cancelBookingAction } from "@/lib/actions/bookings";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface Props {
  bookingId: string;
  scheduledAt: string;
}

export function CancelBookingButton({ bookingId }: Props) {
  const router = useRouter();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  const onConfirm = () => {
    if (!reason.trim()) {
      toast.error(t.booking.cancellationReason);
      return;
    }
    startTransition(async () => {
      const res = await cancelBookingAction(bookingId, reason);
      if (res.success) {
        toast.success(t.booking.cancelledMessage);
        setOpen(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-md border border-red-200 dark:border-red-900 text-sm font-medium text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
      >
        <X className="h-4 w-4" />
        {t.booking.cancelBooking}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => !isPending && setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 shadow-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-red-50 dark:bg-red-950/40 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {t.booking.cancelBookingTitle}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {t.booking.cancelBookingBody}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t.booking.cancellationReason}
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder={t.booking.cancellationReasonPlaceholder}
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                autoFocus
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={isPending}
                className="flex-1 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                {t.booking.keepBooking}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isPending}
                className="flex-1 py-2.5 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {isPending ? t.booking.cancelling : t.booking.confirmCancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
