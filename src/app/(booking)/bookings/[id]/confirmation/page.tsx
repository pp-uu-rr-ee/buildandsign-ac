import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Calendar, Clock, MapPin, Phone, CreditCard } from "lucide-react";
import { db } from "@/db";
import { bookings, technicians, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getService } from "@/config/services";
import { siteConfig } from "@/config/site";
import { getT, getLang } from "@/lib/helpers/lang";
import { formatPrice } from "@/lib/helpers/price";

type Props = { params: Promise<{ id: string }> };

export default async function BookingConfirmationPage({ params }: Props) {
  const { id } = await params;
  const [t, lang] = await Promise.all([getT(), getLang()]);

  const [booking] = await db
    .select({
      id: bookings.id,
      bookingNumber: bookings.bookingNumber,
      serviceType: bookings.serviceType,
      scheduledAt: bookings.scheduledAt,
      durationMinutes: bookings.durationMinutes,
      serviceAddress: bookings.serviceAddress,
      status: bookings.status,
      depositInSatang: bookings.depositInSatang,
      depositPaymentStatus: bookings.depositPaymentStatus,
      depositPaidAt: bookings.depositPaidAt,
      depositPaymentReference: bookings.depositPaymentReference,
      technicianName: users.name,
    })
    .from(bookings)
    .leftJoin(technicians, eq(technicians.id, bookings.technicianId))
    .leftJoin(users, eq(users.id, technicians.userId))
    .where(eq(bookings.id, id))
    .limit(1);

  if (!booking) notFound();

  const service = getService(booking.serviceType);
  const serviceTitle =
    lang === "th" && service?.titleTh ? service.titleTh : service?.title ?? booking.serviceType;

  const scheduledDate = new Date(booking.scheduledAt);
  const locale = lang === "th" ? "th-TH" : "en-US";

  const steps = [
    t.confirmation.bookingStep1,
    t.confirmation.bookingStep2,
    t.confirmation.bookingStep3,
    t.confirmation.bookingStep4,
  ];

  return (
    <div className="mx-auto max-w-lg px-4 sm:px-6 py-16 text-center">
      {/* Success icon */}
      <div className="flex items-center justify-center mb-6">
        <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-950/40 flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-green-500" />
        </div>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        {t.confirmation.bookingConfirmed}
      </h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8">
        {t.confirmation.bookingReferencePrefix}{" "}
        <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">
          {booking.bookingNumber}
        </span>
        {t.confirmation.bookingReferenceSuffix}
      </p>

      {/* Booking summary card */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-left overflow-hidden mb-8">
        <div className="bg-blue-600 text-white px-5 py-4">
          <p className="text-sm text-blue-100">{t.confirmation.service}</p>
          <p className="text-lg font-bold">{serviceTitle}</p>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          <DetailRow
            icon={<Calendar className="h-4 w-4" />}
            label={t.confirmation.date}
            value={scheduledDate.toLocaleDateString(locale, {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          />
          <DetailRow
            icon={<Clock className="h-4 w-4" />}
            label={t.confirmation.time}
            value={scheduledDate.toLocaleTimeString(locale, {
              hour: "2-digit",
              minute: "2-digit",
            })}
          />
          {booking.technicianName && (
            <DetailRow
              icon={<span className="h-4 w-4 text-center">👷</span>}
              label={t.confirmation.technician}
              value={booking.technicianName}
            />
          )}
          <DetailRow
            icon={<MapPin className="h-4 w-4" />}
            label={t.confirmation.address}
            value={`${booking.serviceAddress.addressLine1}, ${booking.serviceAddress.city}`}
          />
        </div>
      </div>

      {/* Payment receipt — deposit paid */}
      {booking.depositInSatang != null && booking.depositPaymentStatus === "paid" && (
        <div className="rounded-2xl border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/20 text-left overflow-hidden mb-8">
          <div className="px-5 py-3 bg-green-100/60 dark:bg-green-900/30 border-b border-green-200 dark:border-green-900 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <p className="text-sm font-semibold text-green-800 dark:text-green-300">
              {t.booking.paid}
            </p>
          </div>
          <div className="px-5 py-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                {t.booking.deposit}
              </span>
              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {formatPrice(booking.depositInSatang)}
              </span>
            </div>
            {booking.depositPaidAt && (
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                {new Date(booking.depositPaidAt).toLocaleString(locale, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            )}
            {booking.depositPaymentReference && (
              <p className="text-[10px] text-gray-400 dark:text-gray-500 font-mono break-all">
                Ref: {booking.depositPaymentReference}
              </p>
            )}
          </div>
        </div>
      )}

      {/* What happens next */}
      <div className="rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 text-left mb-8">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 text-sm">
          {t.confirmation.nextStepsTitle}
        </h2>
        <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-400 list-none">
          {steps.map((s, i) => (
            <li key={i} className="flex gap-2">
              <span className="font-bold text-blue-600 dark:text-blue-400 shrink-0">{i + 1}.</span>
              {s}
            </li>
          ))}
        </ol>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <Link
          href="/bookings"
          className="flex items-center justify-center w-full py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
        >
          {t.confirmation.viewMyBookings}
        </Link>
        <a
          href={`tel:${siteConfig.phone}`}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <Phone className="h-4 w-4" />
          {t.confirmation.callUs}
        </a>
        <Link
          href="/"
          className="block text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          {t.confirmation.backHome}
        </Link>
      </div>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 px-5 py-3">
      <span className="text-gray-400 mt-0.5">{icon}</span>
      <div>
        <p className="text-xs text-gray-400 dark:text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{value}</p>
      </div>
    </div>
  );
}
