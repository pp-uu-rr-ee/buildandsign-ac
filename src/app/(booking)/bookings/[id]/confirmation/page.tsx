import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Calendar, Clock, MapPin, Phone } from "lucide-react";
import { db } from "@/db";
import { bookings, technicians, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getService } from "@/config/services";
import { siteConfig } from "@/config/site";

type Props = { params: Promise<{ id: string }> };

export default async function BookingConfirmationPage({ params }: Props) {
  const { id } = await params;

  const [booking] = await db
    .select({
      id: bookings.id,
      bookingNumber: bookings.bookingNumber,
      serviceType: bookings.serviceType,
      scheduledAt: bookings.scheduledAt,
      durationMinutes: bookings.durationMinutes,
      serviceAddress: bookings.serviceAddress,
      status: bookings.status,
      technicianName: users.name,
    })
    .from(bookings)
    .leftJoin(technicians, eq(technicians.id, bookings.technicianId))
    .leftJoin(users, eq(users.id, technicians.userId))
    .where(eq(bookings.id, id))
    .limit(1);

  if (!booking) notFound();

  const service = getService(booking.serviceType);
  const scheduledDate = new Date(booking.scheduledAt);

  return (
    <div className="mx-auto max-w-lg px-4 sm:px-6 py-16 text-center">
      {/* Success icon */}
      <div className="flex items-center justify-center mb-6">
        <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-green-500" />
        </div>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Booking Confirmed!
      </h1>
      <p className="text-gray-500 mb-8">
        Your booking reference is{" "}
        <span className="font-mono font-semibold text-gray-900">
          {booking.bookingNumber}
        </span>
        . We&apos;ll call you to confirm the appointment.
      </p>

      {/* Booking summary card */}
      <div className="rounded-2xl border border-gray-200 bg-white text-left overflow-hidden mb-8">
        <div className="bg-blue-600 text-white px-5 py-4">
          <p className="text-sm text-blue-100">Service</p>
          <p className="text-lg font-bold">{service?.title ?? booking.serviceType}</p>
        </div>

        <div className="divide-y divide-gray-100">
          <DetailRow
            icon={<Calendar className="h-4 w-4" />}
            label="Date"
            value={scheduledDate.toLocaleDateString("en-PH", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          />
          <DetailRow
            icon={<Clock className="h-4 w-4" />}
            label="Time"
            value={scheduledDate.toLocaleTimeString("en-PH", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          />
          {booking.technicianName && (
            <DetailRow
              icon={<span className="h-4 w-4 text-center">👷</span>}
              label="Technician"
              value={booking.technicianName}
            />
          )}
          <DetailRow
            icon={<MapPin className="h-4 w-4" />}
            label="Address"
            value={`${booking.serviceAddress.addressLine1}, ${booking.serviceAddress.city}`}
          />
        </div>
      </div>

      {/* What happens next */}
      <div className="rounded-xl bg-gray-50 border border-gray-200 p-5 text-left mb-8">
        <h2 className="font-semibold text-gray-900 mb-3 text-sm">
          What happens next?
        </h2>
        <ol className="space-y-2 text-sm text-gray-600 list-none">
          {[
            "We'll call you within 2 hours to confirm the appointment.",
            "You'll receive an SMS reminder 24 hours before the visit.",
            "The technician will arrive in the scheduled time window.",
            "After the service, you can leave a review to help others.",
          ].map((s, i) => (
            <li key={i} className="flex gap-2">
              <span className="font-bold text-blue-600 shrink-0">{i + 1}.</span>
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
          View My Bookings
        </Link>
        <a
          href={`tel:${siteConfig.phone}`}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
        >
          <Phone className="h-4 w-4" />
          Call Us
        </a>
        <Link
          href="/"
          className="block text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Back to home
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
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-900">{value}</p>
      </div>
    </div>
  );
}
