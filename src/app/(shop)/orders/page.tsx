import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { getCustomerOrders } from "@/lib/queries/account";
import { formatPrice } from "@/lib/helpers/price";
import { getLocale } from "@/lib/helpers/lang";
import { ShoppingBag, ArrowRight, ChevronRight } from "lucide-react";

export const metadata = { title: "My Orders" };

const STATUS_STYLES: Record<string, string> = {
  pending:    "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800",
  confirmed:  "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
  processing: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800",
  shipped:    "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800",
  delivered:  "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
  cancelled:  "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
  refunded:   "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700",
};

export default async function OrdersPage() {
  const session = await getSession();
  if (!session) redirect("/login?callbackUrl=/orders");

  const [orders, locale] = await Promise.all([
    getCustomerOrders(session.userId),
    getLocale(),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6 dark:text-gray-400">
        <Link href="/account" className="hover:text-gray-700 dark:hover:text-gray-200">Account</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-gray-900 font-medium dark:text-gray-100">My Orders</span>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-8 dark:text-gray-50">My Orders</h1>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 p-16 text-center dark:border-gray-700">
          <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-4 dark:text-gray-600" />
          <p className="text-gray-500 font-medium mb-2 dark:text-gray-400">No orders yet</p>
          <p className="text-sm text-gray-400 mb-6 dark:text-gray-500">
            When you place an order, it will appear here.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Shop AC Units <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => {
            const statusClass =
              STATUS_STYLES[order.status] ?? "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700";
            const statusLabel = order.status.charAt(0).toUpperCase() + order.status.slice(1);

            return (
              <Link
                key={order.id}
                href={`/orders/${order.id}/confirmation`}
                className="group rounded-2xl border border-gray-200 bg-white p-5 hover:border-blue-300 hover:shadow-sm transition-all flex items-center gap-5 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-700"
              >
                <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 dark:bg-blue-950/50">
                  <ShoppingBag className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-semibold text-gray-900 text-sm dark:text-gray-100">
                      {order.orderNumber}
                    </p>
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${statusClass}`}>
                      {statusLabel}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(order.createdAt).toLocaleDateString(locale, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <p className="font-bold text-gray-900 dark:text-gray-100">
                    {formatPrice(order.totalInSatang)}
                  </p>
                  <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-blue-500 transition-colors ml-auto mt-1 dark:text-gray-600" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
