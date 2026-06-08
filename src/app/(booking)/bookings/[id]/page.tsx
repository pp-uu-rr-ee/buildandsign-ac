import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  CalendarDays,
  Clock,
  MapPin,
  Phone,
  CreditCard,
  ChevronLeft,
} from "lucide-react";
import { db } from "@/db";
import { bookings, technicians, users, savedCards } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { formatPrice } from "@/lib/helpers/price";
import { getService } from "@/config/services";
import { getSession } from "@/lib/session";
import { getT, getLang } from "@/lib/helpers/lang";
import { BookingPayBalance } from "@/components/booking/BookingPayBalance";
import { CancelBookingButton } from "@/components/booking/CancelBookingButton";
import { AcceptQuoteCard } from "@/components/booking/AcceptQuoteCard";

type Props = { params: Promise<{ id: string }> };

export const metadata = { title: "Booking details" };

export default async function BookingDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect(`/login?callbackUrl=/bookings/${id}`);

  const [t, lang] = await Promise.all([getT(), getLang()]);

  const [row] = await db
    .select({
      booking: bookings,
      technicianName: users.name,
    })
    .from(bookings)
    .leftJoin(technicians, eq(technicians.id, bookings.technicianId))
    .leftJoin(users, eq(users.id, technicians.userId))
    .where(and(eq(bookings.id, id), eq(bookings.userId, session.userId)))
    .limit(1);

  if (!row) notFound();
  const { booking, technicianName } = row;

  const userSavedCards = await db
    .select({
      id: savedCards.id,
      last4: savedCards.last4,
      brand: savedCards.brand,
      expMonth: savedCards.expMonth,
      expYear: savedCards.expYear,
      isDefault: savedCards.isDefault,
    })
    .from(savedCards)
    .where(eq(savedCards.userId, session.userId))
    .orderBy(savedCards.createdAt);

  const service = getService(booking.serviceType);
  const serviceTitle =
    lang === "th" && service?.titleTh ? service.titleTh : service?.title ?? booking.serviceType;
  const scheduledDate = new Date(booking.scheduledAt);
  const locale = lang === "th" ? "th-TH" : "en-US";

  const depositPaid = booking.depositPaymentStatus === "paid";
  const balancePaid = booking.balancePaymentStatus === "paid";
  const quoteReady =
    booking.quoteConfirmedAt != null && booking.quotedPriceInSatang != null;
  const quoteAccepted = booking.quoteAcceptedAt != null;
  const awaitingQuote = !quoteReady && booking.status === "pending";
  const canAcceptQuote = quoteReady && !quoteAccepted && booking.status !== "cancelled";
  const canPayBalance =
    quoteAccepted && !balancePaid && (booking.balanceInSatang ?? 0) > 0;

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <Link
        href="/bookings"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 mb-5"
      >
        <ChevronLeft className="h-4 w-4" />
        {t.booking.backToBookings}
      </Link>

      <div className="flex items-start justify-between gap-3 flex-wrap mb-6">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 break-all">
            {booking.bookingNumber}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{serviceTitle}</p>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left — details */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <Row icon={<CalendarDays className="h-4 w-4" />} label={t.confirmation.date}>
              {scheduledDate.toLocaleDateString(locale, {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Row>
            <Row icon={<Clock className="h-4 w-4" />} label={t.confirmation.time}>
              {scheduledDate.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}
            </Row>
            {technicianName && (
              <Row icon={<span className="text-base">👷</span>} label={t.confirmation.technician}>
                {technicianName}
              </Row>
            )}
            <Row icon={<MapPin className="h-4 w-4" />} label={t.confirmation.address}>
              {booking.serviceAddress.addressLine1}
              {booking.serviceAddress.addressLine2 && `, ${booking.serviceAddress.addressLine2}`}
              <br />
              {booking.serviceAddress.city}, {booking.serviceAddress.province}{" "}
              {booking.serviceAddress.postalCode}
            </Row>
          </Card>

          {/* State 1: Awaiting quote from admin */}
          {awaitingQuote && (
            <div className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20 p-4 text-sm text-amber-800 dark:text-amber-200">
              <p className="font-medium">{t.booking.awaitingQuoteState}</p>
              <p className="mt-1 text-xs opacity-80">{t.booking.awaitingQuoteHint}</p>
            </div>
          )}

          {/* State 2: Quote ready, customer must accept to lock slot */}
          {canAcceptQuote && (
            <AcceptQuoteCard
              bookingId={booking.id}
              quotedTotalInSatang={booking.quotedPriceInSatang!}
            />
          )}

          {/* State 3: Quote accepted, balance can be paid online */}
          {canPayBalance && (
            <BookingPayBalance
              bookingId={booking.id}
              balanceInSatang={booking.balanceInSatang!}
              opnPublicKey={process.env.PAYMENT_PUBLIC_KEY ?? ""}
              savedCards={userSavedCards}
            />
          )}
        </div>

        {/* Right — payments */}
        <aside>
          <Card title={t.booking.paymentSummary}>
            <PaymentRow
              label={t.booking.deposit}
              amountInSatang={booking.depositInSatang ?? 0}
              paid={depositPaid}
              when={booking.depositPaidAt}
              paidLabel={t.booking.paid}
              dueLabel={t.booking.due}
            />
            {booking.quotedPriceInSatang != null && (
              <div className="flex justify-between text-sm pt-2 border-t border-gray-100 dark:border-gray-800">
                <span className="text-gray-500">{t.booking.totalQuote}</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {formatPrice(booking.quotedPriceInSatang)}
                </span>
              </div>
            )}
            {booking.balanceInSatang != null && (
              <PaymentRow
                label={t.booking.balance}
                amountInSatang={booking.balanceInSatang}
                paid={balancePaid}
                when={booking.balancePaidAt}
                paidLabel={t.booking.paid}
                dueLabel={t.booking.due}
              />
            )}
            {balancePaid && booking.finalPriceInSatang != null && (
              <div className="flex justify-between text-sm pt-3 mt-3 border-t border-gray-100 dark:border-gray-800">
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {t.booking.totalPaid}
                </span>
                <span className="font-bold text-green-600">
                  {formatPrice(booking.finalPriceInSatang)}
                </span>
              </div>
            )}
          </Card>

          <a
            href="tel:+66999000000"
            className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-md border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Phone className="h-4 w-4" />
            {t.booking.needHelpCall}
          </a>

          {/* Cancel — only for cancellable statuses */}
          {(booking.status === "pending" || booking.status === "confirmed") && (
            <div className="mt-3">
              <CancelBookingButton
                bookingId={booking.id}
                scheduledAt={booking.scheduledAt.toISOString()}
              />
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

// ─── small subcomponents ────────────────────────────────────────────────────

function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      {title && (
        <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{title}</h2>
        </div>
      )}
      <div className="px-4 py-3 space-y-3">{children}</div>
    </div>
  );
}

function Row({
  icon, label, children,
}: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-gray-400 mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500">{label}</p>
        <div className="text-sm text-gray-700 dark:text-gray-200">{children}</div>
      </div>
    </div>
  );
}

function PaymentRow({
  label, amountInSatang, paid, when, paidLabel, dueLabel,
}: {
  label: string;
  amountInSatang: number;
  paid: boolean;
  when: Date | null;
  paidLabel: string;
  dueLabel: string;
}) {
  return (
    <div className="flex items-start justify-between gap-2 text-sm">
      <div>
        <p className="text-gray-700 dark:text-gray-200 font-medium">{label}</p>
        {paid && when && (
          <p className="text-[11px] text-gray-400">
            {paidLabel} {new Date(when).toLocaleDateString()}
          </p>
        )}
      </div>
      <div className="text-right">
        <p className="font-semibold text-gray-900 dark:text-gray-100">
          {formatPrice(amountInSatang)}
        </p>
        <p className={`text-[10px] uppercase font-semibold ${paid ? "text-green-600" : "text-orange-500"}`}>
          {paid ? (
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> {paidLabel}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <CreditCard className="h-3 w-3" /> {dueLabel}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-blue-100 text-blue-700",
    in_progress: "bg-purple-100 text-purple-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-gray-100 text-gray-500",
    no_show: "bg-red-100 text-red-700",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
        colors[status] ?? "bg-gray-100"
      }`}
    >
      {status.replace("_", " ")}
    </span>
  );
}
