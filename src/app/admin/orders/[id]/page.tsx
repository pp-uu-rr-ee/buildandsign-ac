import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getOrderById } from "@/lib/queries/admin";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { OrderStatusUpdater } from "@/components/admin/OrderStatusUpdater";
import { formatPrice } from "@/lib/helpers/price";

type Props = { params: Promise<{ id: string }> };

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();

  const addr = order.shippingAddress;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/orders" className="p-1.5 rounded-md hover:bg-gray-100 transition-colors">
          <ChevronLeft className="h-5 w-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900 font-mono">{order.orderNumber}</h1>
          <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleString("en-PH")}</p>
        </div>
        <div className="flex gap-2 ml-auto">
          <StatusBadge status={order.paymentStatus} />
          <StatusBadge status={order.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Order items */}
        <div className="md:col-span-2 space-y-4">
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900 text-sm">Items</h2>
            </div>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{item.productName}</p>
                      {item.productSku && <p className="text-xs text-gray-400">SKU: {item.productSku}</p>}
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs">×{item.quantity}</td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-900">
                      {formatPrice(item.totalInSatang)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-gray-200 bg-gray-50">
                <tr>
                  <td colSpan={2} className="px-5 py-2 text-xs text-gray-500">Subtotal</td>
                  <td className="px-5 py-2 text-right text-sm font-medium">{formatPrice(order.subtotalInSatang)}</td>
                </tr>
                <tr>
                  <td colSpan={2} className="px-5 py-2 text-xs text-gray-500">Shipping</td>
                  <td className="px-5 py-2 text-right text-sm font-medium">
                    {order.shippingInSatang === 0 ? "Free" : formatPrice(order.shippingInSatang)}
                  </td>
                </tr>
                <tr>
                  <td colSpan={2} className="px-5 py-2 text-sm font-semibold text-gray-900">Total</td>
                  <td className="px-5 py-2 text-right text-base font-bold text-gray-900">{formatPrice(order.totalInSatang)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Update status */}
          <OrderStatusUpdater orderId={order.id} currentStatus={order.status} currentPayment={order.paymentStatus} />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <InfoCard title="Customer">
            <p className="font-medium text-gray-900">{addr.fullName}</p>
            <p className="text-gray-600 text-sm">{addr.phone}</p>
          </InfoCard>

          <InfoCard title="Shipping Address">
            <p className="text-sm text-gray-700 leading-relaxed">
              {addr.addressLine1}
              {addr.addressLine2 && <><br />{addr.addressLine2}</>}
              <br />{addr.city}, {addr.province} {addr.postalCode}
            </p>
          </InfoCard>

          <InfoCard title="Payment">
            <p className="text-sm text-gray-700 capitalize">{order.paymentMethod?.replace("_"," ")}</p>
            {order.paymentReference && <p className="text-xs text-gray-400 mt-0.5">Ref: {order.paymentReference}</p>}
          </InfoCard>

          {order.notes && (
            <InfoCard title="Notes">
              <p className="text-sm text-gray-700">{order.notes}</p>
            </InfoCard>
          )}
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
