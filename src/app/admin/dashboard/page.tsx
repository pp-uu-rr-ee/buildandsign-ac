import Link from "next/link";
import { ShoppingBag, CalendarCheck, Package, Users, AlertTriangle, ArrowRight } from "lucide-react";
import { getDashboardStats, getRecentOrders, getBookings } from "@/lib/queries/admin";
import { StatCard } from "@/components/admin/StatCard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatPrice } from "@/lib/helpers/price";

export const metadata = { title: "Dashboard | Admin" };

export default async function AdminDashboardPage() {
  const [stats, recentOrders, { rows: upcomingBookings }] = await Promise.all([
    getDashboardStats(),
    getRecentOrders(6),
    getBookings({ limit: 6, status: "confirmed" }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {new Date().toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard label="Total Orders" value={stats.totalOrders} sub={`${stats.pendingOrders} pending`} icon={ShoppingBag} color="blue" />
        <StatCard label="Revenue (paid)" value={formatPrice(stats.totalRevenue)} icon={ShoppingBag} color="green" />
        <StatCard label="Bookings" value={stats.totalBookings} sub={`${stats.pendingBookings} unconfirmed`} icon={CalendarCheck} color="orange" />
        <StatCard label="Customers" value={stats.totalCustomers} icon={Users} color="purple" />
      </div>

      {/* Low stock alert */}
      {stats.lowStock > 0 && (
        <div className="flex items-center gap-3 rounded-xl bg-orange-50 border border-orange-200 px-5 py-3">
          <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0" />
          <p className="text-sm text-orange-800">
            <span className="font-semibold">{stats.lowStock} product{stats.lowStock > 1 ? "s" : ""}</span>{" "}
            below low-stock threshold.{" "}
            <Link href="/admin/products?filter=low_stock" className="underline hover:text-orange-900">
              View products →
            </Link>
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Recent orders */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Recent Orders</h2>
            <Link href="/admin/orders" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            {recentOrders.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">No orders yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase">Order</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase">Customer</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase">Total</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Link href={`/admin/orders/${order.id}`} className="font-mono text-xs text-blue-600 hover:underline">
                          {order.orderNumber}
                        </Link>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(order.createdAt).toLocaleDateString("en-PH")}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {(order.customerName as any)?.fullName ?? "Guest"}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900">
                        {formatPrice(order.totalInCents)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={order.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Upcoming confirmed bookings */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Upcoming Bookings</h2>
            <Link href="/admin/bookings" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            {upcomingBookings.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">No confirmed bookings.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase">Booking</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase">Service</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase">Date</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase">Technician</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {upcomingBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Link href={`/admin/bookings/${b.id}`} className="font-mono text-xs text-blue-600 hover:underline">
                          {b.bookingNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3 capitalize text-gray-700">{b.serviceType}</td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                        {new Date(b.scheduledAt).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                        {" "}
                        {new Date(b.scheduledAt).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{b.technicianName ?? <span className="text-orange-500 text-xs">Unassigned</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
