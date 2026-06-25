import Link from "next/link";
import { Eye } from "lucide-react";
import { getBookings } from "@/lib/queries/admin";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { AdminListToolbar } from "@/components/admin/AdminListToolbar";

export const metadata = { title: "Bookings | Admin" };

const BOOKING_STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no_show", label: "No show" },
];

type SP = { status?: string; search?: string; page?: string };

export default async function AdminBookingsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { rows, total, pages, page } = await getBookings({
    status: sp.status,
    search: sp.search,
    page: sp.page ? Number(sp.page) : 1,
  });

  const pageBaseQs = new URLSearchParams();
  if (sp.status) pageBaseQs.set("status", sp.status);
  if (sp.search) pageBaseQs.set("search", sp.search);
  const pageBase = pageBaseQs.toString();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          Bookings{" "}
          <span className="text-gray-400 font-normal text-base sm:text-lg">({total})</span>
        </h1>
      </div>

      <AdminListToolbar
        basePath="/admin/bookings"
        searchPlaceholder="Search by booking #, customer name, phone, city, technician…"
        chips={{
          key: "status",
          label: "Status",
          options: BOOKING_STATUS_OPTIONS,
        }}
      />

      <div className="rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm min-w-[760px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {["Booking #", "Service", "Scheduled", "Customer", "Technician", "Status", ""].map(
                (h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400">
                  No bookings found.
                </td>
              </tr>
            ) : (
              rows.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-900">{b.bookingNumber}</td>
                  <td className="px-4 py-3 capitalize text-gray-700">{b.serviceType}</td>
                  <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                    {new Date(b.scheduledAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                    <br />
                    {new Date(b.scheduledAt).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
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
                    <Link
                      href={`/admin/bookings/${b.id}`}
                      className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/bookings?${pageBase}${pageBase ? "&" : ""}page=${p}`}
              className={`h-8 w-8 flex items-center justify-center rounded-md text-sm ${
                p === page
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
