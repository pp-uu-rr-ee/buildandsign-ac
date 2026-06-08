import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { getCustomerBookings } from "@/lib/queries/account";
import { formatPrice } from "@/lib/helpers/price";
import { getT, getLocale } from "@/lib/helpers/lang";
import {
  CalendarCheck,
  ArrowRight,
  ChevronRight,
  CreditCard,
  CheckCircle2,
} from "lucide-react";

export const metadata = { title: "My Bookings" };

const STATUS_STYLES: Record<string, string> = {
  pending:     "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800",
  confirmed:   "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
  in_progress: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800",
  completed:   "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
  cancelled:   "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
  no_show:     "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700",
};

const SERVICE_LABELS: Record<string, string> = {
  cleaning:     "AC Cleaning",
  repair:       "AC Repair",
  installation: "AC Installation",
  inspection:   "AC Inspection",
};

export default async function BookingsPage() {
  const session = await getSession();
  if (!session) redirect("/login?callbackUrl=/bookings");

  const [bookings, t, locale] = await Promise.all([
    getCustomerBookings(session.userId),
    getT(),
    getLocale(),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6 dark:text-gray-400">
        <Link href="/account" className="hover:text-gray-700 dark:hover:text-gray-200">Account</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-gray-900 font-medium dark:text-gray-100">My Bookings</span>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-8 dark:text-gray-50">My Bookings</h1>

      {bookings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 p-16 text-center dark:border-gray-700">
          <CalendarCheck className="h-12 w-12 text-gray-300 mx-auto mb-4 dark:text-gray-600" />
          <p className="text-gray-500 font-medium mb-2 dark:text-gray-400">No bookings yet</p>
          <p className="text-sm text-gray-400 mb-6 dark:text-gray-500">
            Book a service and it will appear here.
          </p>
          <Link
            href="/services"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Book a Service <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {bookings.map((booking) => {
            const statusClass =
              STATUS_STYLES[booking.status] ?? "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700";
            const statusLabel =
              booking.status === "in_progress"
                ? "In Progress"
                : booking.status === "no_show"
                ? "No Show"
                : booking.status.charAt(0).toUpperCase() + booking.status.slice(1);
            const serviceLabel =
              SERVICE_LABELS[booking.serviceType] ?? booking.serviceType;
            const price = booking.finalPriceInSatang ?? booking.quotedPriceInSatang;

            const canAcceptQuote =
              booking.quoteConfirmedAt != null &&
              booking.quoteAcceptedAt == null &&
              booking.status !== "cancelled";
            const canPayBalance =
              booking.quoteAcceptedAt != null &&
              booking.balancePaymentStatus !== "paid" &&
              (booking.balanceInSatang ?? 0) > 0;

            const isFullyPaid =
              booking.depositPaymentStatus === "paid" &&
              (booking.balanceInSatang == null ||
                booking.balancePaymentStatus === "paid");

            return (
              <div
                key={booking.id}
                className="group rounded-2xl border border-gray-200 bg-white p-5 hover:border-blue-300 hover:shadow-sm transition-all dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-700"
              >
                <Link
                  href={`/bookings/${booking.id}`}
                  className="flex items-center gap-5"
                >
                  <div className="h-12 w-12 rounded-xl bg-green-50 flex items-center justify-center shrink-0 dark:bg-green-950/40">
                    <CalendarCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold text-gray-900 text-sm dark:text-gray-100">
                        {serviceLabel}
                      </p>
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${statusClass}`}>
                        {statusLabel}
                      </span>
                      {isFullyPaid && (
                        <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                          <CheckCircle2 className="h-3 w-3" />
                          {t.booking.paid}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {booking.bookingNumber} ·{" "}
                      {new Date(booking.scheduledAt).toLocaleDateString(locale, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                      {", "}
                      {new Date(booking.scheduledAt).toLocaleTimeString(locale, {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    {price != null && (
                      <p className="font-bold text-gray-900 dark:text-gray-100">
                        {formatPrice(price)}
                      </p>
                    )}
                    <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-blue-500 transition-colors ml-auto mt-1 dark:text-gray-600" />
                  </div>
                </Link>

                {/* Accept-quote CTA (priority over pay-balance) */}
                {canAcceptQuote && (
                  <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-900/40 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide">
                        {t.booking.quoteReadyTitle}
                      </p>
                      {booking.quotedPriceInSatang != null && (
                        <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                          {formatPrice(booking.quotedPriceInSatang)}
                        </p>
                      )}
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                        {t.booking.quoteReadySubtitle}
                      </p>
                    </div>
                    <Link
                      href={`/bookings/${booking.id}`}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shrink-0"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {t.booking.acceptQuote}
                    </Link>
                  </div>
                )}

                {/* Pay-balance CTA */}
                {canPayBalance && (
                  <div className="mt-4 pt-4 border-t border-amber-200 dark:border-amber-900/40 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                        {t.booking.balance} {t.booking.due}
                      </p>
                      <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {formatPrice(booking.balanceInSatang!)}
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                        {t.booking.payBalanceSubtitle}
                      </p>
                    </div>
                    <Link
                      href={`/bookings/${booking.id}`}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors shrink-0"
                    >
                      <CreditCard className="h-4 w-4" />
                      {t.booking.payAmount(formatPrice(booking.balanceInSatang!))}
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
