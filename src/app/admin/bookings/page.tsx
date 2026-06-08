import Link from "next/link";
import { getBookings } from "@/lib/queries/admin";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatPrice } from "@/lib/helpers/price";

export const metadata = { title: "Bookings | Admin" };

const BOOKING_STATUSES = ["pending","confirmed","in_progress","completed","cancelled","no_show"];

type SP = { status?: string; page?: string };

export default async function AdminBookingsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { rows, total, pages, page } = await getBookings({
    status: sp.status,
    page: sp.page ? Number(sp.page) : 1,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          Bookings <span className="text-gray-400 font-normal text-base sm:text-lg">({total})</span>
        </h1>
      </div>

      {/* Status filter */}
      <div className="flex gap-1 flex-wrap">
        {[undefined, ...BOOKING_STATUSES].map((s) => {
          const active = (sp.status ?? "") === (s ?? "");
          return (
            <Link
              key={s ?? "all"}
              href={s ? `/admin/bookings?status=${s}` : "/admin/bookings"}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                active ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {s ? s.replace("_"," ") : "All"}
            </Link>
          );
        })}
      </div>

      <div className="rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm min-w-[760px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {["Booking #","Service","Scheduled","Customer","Technician","Status",""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-gray-400">No bookings found.</td></tr>
            ) : rows.map((b) => (
              <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-gray-900">{b.bookingNumber}</td>
                <td className="px-4 py-3 capitalize text-gray-700">{b.serviceType}</td>
                <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                  {new Date(b.scheduledAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  <br />
                  {new Date(b.scheduledAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {(b.serviceAddress as any)?.fullName}
                  <p className="text-xs text-gray-400">{(b.serviceAddress as any)?.city}</p>
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {b.technicianName ?? (
                    <span className="text-xs text-orange-500 font-medium">Unassigned</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={b.status} type="booking" />
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/bookings/${b.id}`} className="text-xs text-blue-600 hover:underline">View →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/bookings?${sp.status ? `status=${sp.status}&` : ""}page=${p}`}
              className={`h-8 w-8 flex items-center justify-center rounded-md text-sm ${p === page ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
