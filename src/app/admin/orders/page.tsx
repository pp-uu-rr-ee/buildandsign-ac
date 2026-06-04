import Link from "next/link";
import { getOrders } from "@/lib/queries/admin";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatPrice } from "@/lib/helpers/price";

export const metadata = { title: "Orders | Admin" };

const ORDER_STATUSES = ["pending","confirmed","processing","shipped","delivered","cancelled","refunded"];

type SP = { status?: string; page?: string };

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { rows, total, pages, page } = await getOrders({
    status: sp.status,
    page: sp.page ? Number(sp.page) : 1,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Orders <span className="text-gray-400 font-normal text-lg">({total})</span></h1>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 flex-wrap">
        {[undefined, ...ORDER_STATUSES].map((s) => {
          const label = s ? s.replace("_"," ") : "All";
          const active = (sp.status ?? "") === (s ?? "");
          return (
            <Link
              key={s ?? "all"}
              href={s ? `/admin/orders?status=${s}` : "/admin/orders"}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                active ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {["Order #", "Customer", "Date", "Total", "Payment", "Status", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-gray-400">No orders found.</td></tr>
            ) : rows.map((o) => (
              <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <span className="font-mono text-xs text-gray-900">{o.orderNumber}</span>
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {(o.shippingAddress as any)?.fullName ?? "—"}
                  <p className="text-xs text-gray-400">{(o.shippingAddress as any)?.city}</p>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                  {new Date(o.createdAt).toLocaleDateString("en-PH")}
                </td>
                <td className="px-4 py-3 font-semibold text-gray-900">{formatPrice(o.totalInSatang)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={o.paymentStatus} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={o.status} />
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/orders/${o.id}`} className="text-xs text-blue-600 hover:underline">
                    View →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/orders?${sp.status ? `status=${sp.status}&` : ""}page=${p}`}
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
