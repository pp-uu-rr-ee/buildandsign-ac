import Link from "next/link";
import {
  Users,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
  ShoppingBag,
  CalendarCheck,
} from "lucide-react";
import { getCustomers } from "@/lib/queries/admin";
import { AdminListToolbar } from "@/components/admin/AdminListToolbar";
import { formatPrice } from "@/lib/helpers/price";

export const metadata = { title: "Customers | Admin" };

type SP = { search?: string; verified?: string; page?: string };

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const { rows, total, pages, page } = await getCustomers({
    search: sp.search,
    verified: sp.verified,
    page: sp.page ? Number(sp.page) : 1,
  });

  const pageBaseQs = new URLSearchParams();
  if (sp.search) pageBaseQs.set("search", sp.search);
  if (sp.verified) pageBaseQs.set("verified", sp.verified);
  const pageBase = pageBaseQs.toString();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Customers{" "}
            <span className="text-gray-400 font-normal text-base sm:text-lg">
              ({total})
            </span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            All registered customers with their order and booking history.
          </p>
        </div>
      </div>

      <AdminListToolbar
        basePath="/admin/customers"
        searchPlaceholder="Search by name, email, phone…"
        chips={{
          key: "verified",
          label: "Email",
          options: [
            { value: "", label: "All" },
            { value: "yes", label: "Verified" },
            { value: "no", label: "Unverified" },
          ],
        }}
      />

      <div className="rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm min-w-[760px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {["Customer", "Contact", "Orders", "Bookings", "Total spent", "Joined"].map(
                (h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide"
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
                <td colSpan={6} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3 text-gray-400">
                    <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                      <Users className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-medium">No customers found.</p>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-blue-50 flex items-center justify-center shrink-0 text-blue-600 font-semibold text-sm">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{c.name}</p>
                        <p className="text-xs text-gray-400 truncate">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        <Mail className="h-3 w-3 text-gray-400 shrink-0" />
                        <span className="truncate">{c.email}</span>
                        {c.emailVerified ? (
                          <CheckCircle2
                            className="h-3 w-3 text-green-500 shrink-0"
                            aria-label="Verified"
                          />
                        ) : (
                          <XCircle
                            className="h-3 w-3 text-gray-300 shrink-0"
                            aria-label="Not verified"
                          />
                        )}
                      </div>
                      {c.phone ? (
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <Phone className="h-3 w-3 text-gray-400 shrink-0" />
                          <a
                            href={`tel:${c.phone}`}
                            className="hover:text-blue-600 truncate"
                          >
                            {c.phone}
                          </a>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-300">No phone</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders?search=${encodeURIComponent(c.email)}`}
                      className="inline-flex items-center gap-1 text-sm text-gray-700 hover:text-blue-600 transition-colors"
                    >
                      <ShoppingBag className="h-3.5 w-3.5 text-gray-400" />
                      <span className="font-semibold">{c.orderCount}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-sm text-gray-700">
                      <CalendarCheck className="h-3.5 w-3.5 text-gray-400" />
                      <span className="font-semibold">{c.bookingCount}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    {c.totalSpentInSatang > 0 ? (
                      formatPrice(c.totalSpentInSatang)
                    ) : (
                      <span className="text-gray-300 font-normal">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                    {new Date(c.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
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
              href={`/admin/customers?${pageBase}${pageBase ? "&" : ""}page=${p}`}
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
