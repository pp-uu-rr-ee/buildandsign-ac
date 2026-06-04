import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getBookingById, getActiveTechnicianOptions } from "@/lib/queries/admin";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { BookingStatusUpdater } from "@/components/admin/BookingStatusUpdater";
import { formatPrice } from "@/lib/helpers/price";

type Props = { params: Promise<{ id: string }> };

export default async function AdminBookingDetailPage({ params }: Props) {
  const { id } = await params;
  const result = await getBookingById(id);
  if (!result) notFound();

  const { booking, technicianName } = result;
  const technicians = await getActiveTechnicianOptions();
  const addr = booking.serviceAddress;
  const ac = booking.acUnitDetails as any;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/bookings" className="p-1.5 rounded-md hover:bg-gray-100 transition-colors">
          <ChevronLeft className="h-5 w-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900 font-mono">{booking.bookingNumber}</h1>
          <p className="text-xs text-gray-400">
            {new Date(booking.scheduledAt).toLocaleString("en-PH", { dateStyle: "full", timeStyle: "short" })}
          </p>
        </div>
        <div className="ml-auto">
          <StatusBadge status={booking.status} type="booking" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          {/* Booking details */}
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900 text-sm">Booking Details</h2>
            </div>
            <div className="px-5 py-4 grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-xs text-gray-400 mb-0.5">Service Type</p><p className="capitalize font-medium">{booking.serviceType}</p></div>
              <div><p className="text-xs text-gray-400 mb-0.5">Duration</p><p className="font-medium">{booking.durationMinutes} minutes</p></div>
              {booking.quotedPriceInSatang && (
                <div><p className="text-xs text-gray-400 mb-0.5">Quoted Price</p><p className="font-medium">{formatPrice(booking.quotedPriceInSatang)}</p></div>
              )}
              {booking.finalPriceInSatang && (
                <div><p className="text-xs text-gray-400 mb-0.5">Final Price</p><p className="font-medium">{formatPrice(booking.finalPriceInSatang)}</p></div>
              )}
              {booking.customerNotes && (
                <div className="col-span-2"><p className="text-xs text-gray-400 mb-0.5">Customer Notes</p><p className="text-gray-700">{booking.customerNotes}</p></div>
              )}
              {booking.technicianNotes && (
                <div className="col-span-2"><p className="text-xs text-gray-400 mb-0.5">Technician Notes</p><p className="text-gray-700">{booking.technicianNotes}</p></div>
              )}
            </div>
          </div>

          {/* AC Unit */}
          {ac && (
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900 text-sm">AC Unit Details</h2>
              </div>
              <div className="px-5 py-4 grid grid-cols-2 gap-4 text-sm">
                {[["Brand", ac.brand], ["Model", ac.model], ["Type", ac.type], ["Year Installed", ac.yearInstalled]]
                  .filter(([, v]) => v)
                  .map(([label, value]) => (
                    <div key={label as string}>
                      <p className="text-xs text-gray-400 mb-0.5">{label as string}</p>
                      <p className="capitalize font-medium">{String(value)}</p>
                    </div>
                  ))}
                {ac.notes && <div className="col-span-2"><p className="text-xs text-gray-400 mb-0.5">Notes</p><p>{ac.notes}</p></div>}
              </div>
            </div>
          )}

          {/* Status updater */}
          <BookingStatusUpdater
            bookingId={booking.id}
            currentStatus={booking.status}
            currentTechnicianId={booking.technicianId ?? ""}
            technicians={technicians}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <InfoCard title="Customer">
            <p className="font-medium text-gray-900">{addr.fullName}</p>
            <p className="text-sm text-gray-600">{addr.phone}</p>
          </InfoCard>
          <InfoCard title="Service Address">
            <p className="text-sm text-gray-700 leading-relaxed">
              {addr.addressLine1}
              {addr.addressLine2 && <><br />{addr.addressLine2}</>}
              <br />{addr.city}, {addr.province} {addr.postalCode}
            </p>
          </InfoCard>
          <InfoCard title="Assigned Technician">
            {technicianName
              ? <p className="text-sm font-medium text-gray-900">{technicianName}</p>
              : <p className="text-sm text-orange-500">Not yet assigned</p>
            }
          </InfoCard>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</h3>
      </div>
      <div className="px-4 py-3">{children}</div>
    </div>
  );
}
