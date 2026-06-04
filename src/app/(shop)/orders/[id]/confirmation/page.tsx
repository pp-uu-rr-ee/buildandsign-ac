import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Package, Truck, MapPin, CreditCard } from "lucide-react";
import { CartClearer } from "@/components/shop/CartClearer";
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { formatPrice } from "@/lib/helpers/price";

type Props = { params: Promise<{ id: string }> };

const PAYMENT_LABELS: Record<string, string> = {
  cod: "Cash on Delivery",
  card: "Credit / Debit Card (Opn Payments)",
};

export default async function OrderConfirmationPage({ params }: Props) {
  const { id } = await params;

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, id))
    .limit(1);

  if (!order) notFound();

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, id));

  const addr = order.shippingAddress;

  return (
    <div className="mx-auto max-w-lg px-4 sm:px-6 py-16 text-center">
      <CartClearer />
      {/* Icon */}
      <div className="flex justify-center mb-6">
        <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-green-500" />
        </div>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Placed!</h1>
      <p className="text-gray-500 mb-8">
        Your order{" "}
        <span className="font-mono font-semibold text-gray-900">
          {order.orderNumber}
        </span>{" "}
        has been received. We'll contact you shortly to confirm.
      </p>

      {/* Summary card */}
      <div className="rounded-2xl border border-gray-200 bg-white text-left overflow-hidden mb-8">
        <div className="bg-blue-600 px-5 py-4 text-white">
          <p className="text-blue-100 text-xs">Order total</p>
          <p className="text-2xl font-bold">{formatPrice(order.totalInSatang)}</p>
        </div>

        <div className="divide-y divide-gray-100">
          <DetailRow icon={<Package className="h-4 w-4" />} label="Items">
            <ul className="space-y-0.5">
              {items.map((item) => (
                <li key={item.id} className="text-sm text-gray-700">
                  {item.productName} × {item.quantity} —{" "}
                  <span className="font-medium">{formatPrice(item.totalInSatang)}</span>
                </li>
              ))}
            </ul>
          </DetailRow>

          <DetailRow icon={<Truck className="h-4 w-4" />} label="Shipping">
            <p className="text-sm text-gray-700">
              {order.shippingInSatang === 0
                ? "Free shipping"
                : formatPrice(order.shippingInSatang)}
            </p>
          </DetailRow>

          <DetailRow icon={<MapPin className="h-4 w-4" />} label="Ship to">
            <p className="text-sm text-gray-700">
              {addr.fullName}, {addr.addressLine1},{" "}
              {addr.addressLine2 ? `${addr.addressLine2}, ` : ""}
              {addr.city}, {addr.province} {addr.postalCode}
            </p>
          </DetailRow>

          <DetailRow icon={<CreditCard className="h-4 w-4" />} label="Payment">
            <p className="text-sm text-gray-700">
              {PAYMENT_LABELS[order.paymentMethod ?? ""] ?? order.paymentMethod}
            </p>
          </DetailRow>
        </div>
      </div>

      {/* What's next */}
      <div className="rounded-xl bg-gray-50 border border-gray-200 p-5 text-left mb-8">
        <h2 className="font-semibold text-gray-900 mb-3 text-sm">What happens next?</h2>
        <ol className="space-y-2 text-sm text-gray-600">
          {[
            "We'll call or text you within 2 hours to confirm your order.",
            "Our team packs and dispatches your unit within 1–2 business days.",
            "You'll receive a tracking number once your order ships.",
            "Our technician can install your new unit — book at /services.",
          ].map((s, i) => (
            <li key={i} className="flex gap-2">
              <span className="font-bold text-blue-600 shrink-0">{i + 1}.</span>
              {s}
            </li>
          ))}
        </ol>
      </div>

      <div className="space-y-3">
        <Link
          href="/products"
          className="flex items-center justify-center w-full py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
        >
          Continue Shopping
        </Link>
        <Link
          href="/services"
          className="flex items-center justify-center w-full py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
        >
          Book Installation Service
        </Link>
      </div>
    </div>
  );
}

function DetailRow({
  icon, label, children,
}: {
  icon: React.ReactNode; label: string; children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 px-5 py-3">
      <span className="text-gray-400 mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
        {children}
      </div>
    </div>
  );
}
