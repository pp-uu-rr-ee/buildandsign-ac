import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Calendar,
  Clock,
  MapPin,
  Phone,
  User,
  Wrench,
} from "lucide-react";
import { db } from "@/db";
import { bookings, technicians, users } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { getService } from "@/config/services";
import { getLang, getLocale } from "@/lib/helpers/lang";
import { TechnicianBookingActions } from "@/components/technician/TechnicianBookingActions";

type Props = { params: Promise<{ id: string }> };

export const metadata = { title: "Job details | Technician" };

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  in_progress: "bg-purple-100 text-purple-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-500",
  no_show: "bg-red-100 text-red-700",
};

export default async function TechnicianBookingPage({ params }: Props) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.role !== "technician") redirect("/login");

  const [lang, locale] = await Promise.all([getLang(), getLocale()]);

  // Verify the technician profile and that booking is assigned to them
  const [techProfile] = await db
    .select({ id: technicians.id })
    .from(technicians)
    .where(eq(technicians.userId, session.userId))
    .limit(1);

  if (!techProfile) notFound();

  const [booking] = await db
    .select()
    .from(bookings)
    .where(
      and(eq(bookings.id, id), eq(bookings.technicianId, techProfile.id))
    )
    .limit(1);

  if (!booking) notFound();

  const service = getService(booking.serviceType);
  const title =
    lang === "th" && service?.titleTh ? service.titleTh : service?.title ?? booking.serviceType;
  const scheduled = new Date(booking.scheduledAt);
  const addr = booking.serviceAddress;
  const ac = booking.acUnitDetails;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/technician/calendar"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to calendar
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 break-all">
            {booking.bookingNumber}
          </h1>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
            <Wrench className="h-4 w-4" />
            {title}
          </p>
        </div>
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
            STATUS_STYLES[booking.status] ?? "bg-gray-100"
          }`}
        >
          {booking.status.replace("_", " ")}
        </span>
      </div>

      {/* Schedule + customer + AC */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Schedule">
          <Row icon={<Calendar className="h-4 w-4" />}>
            {scheduled.toLocaleDateString(locale, {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Row>
          <Row icon={<Clock className="h-4 w-4" />}>
            {scheduled.toLocaleTimeString(locale, {
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
            · {booking.durationMinutes} min
          </Row>
        </Card>

        <Card title="Customer">
          <Row icon={<User className="h-4 w-4" />}>{addr.fullName}</Row>
          <Row icon={<Phone className="h-4 w-4" />}>
            <a
              href={`tel:${addr.phone}`}
              className="text-blue-600 hover:underline"
            >
              {addr.phone}
            </a>
          </Row>
          <Row icon={<MapPin className="h-4 w-4" />}>
            {addr.addressLine1}
            {addr.addressLine2 && `, ${addr.addressLine2}`}
            <br />
            {addr.city}, {addr.province} {addr.postalCode}
          </Row>
          {/* Open in Google Maps */}
          <a
            href={`https://www.google.com/maps/search/${encodeURIComponent(
              `${addr.addressLine1}, ${addr.city}, ${addr.province}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
          >
            <MapPin className="h-3 w-3" />
            Open in Maps
          </a>
        </Card>
      </div>

      {/* AC details */}
      {ac && (ac.brand || ac.model || ac.type || ac.yearInstalled || ac.notes) && (
        <Card title="AC Unit">
          <div className="grid grid-cols-2 gap-3 text-sm">
            {ac.brand && <Field label="Brand" value={ac.brand} />}
            {ac.model && <Field label="Model" value={ac.model} />}
            {ac.type && <Field label="Type" value={ac.type} />}
            {ac.yearInstalled && (
              <Field label="Year" value={String(ac.yearInstalled)} />
            )}
          </div>
          {ac.notes && (
            <p className="text-sm text-gray-700 mt-2 pt-2 border-t border-gray-100">
              {ac.notes}
            </p>
          )}
        </Card>
      )}

      {/* Customer notes */}
      {booking.customerNotes && (
        <Card title="Customer Notes">
          <p className="text-sm text-gray-700 whitespace-pre-wrap">
            {booking.customerNotes}
          </p>
        </Card>
      )}

      {/* Tech actions */}
      <Card title="Job Actions">
        <TechnicianBookingActions
          bookingId={booking.id}
          currentStatus={booking.status}
          currentNotes={booking.technicianNotes}
        />
      </Card>
    </div>
  );
}

// ─── Subcomponents ──────────────────────────────────────────────────────────

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {title}
        </h2>
      </div>
      <div className="px-4 py-3 space-y-2">{children}</div>
    </div>
  );
}

function Row({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-sm text-gray-700">
      <span className="text-gray-400 mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-gray-400 uppercase">{label}</p>
      <p className="font-medium text-gray-900 capitalize">{value}</p>
    </div>
  );
}
