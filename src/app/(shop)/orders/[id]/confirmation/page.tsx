import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Package, Truck, MapPin, MessageCircle, ExternalLink, Phone } from "lucide-react";
import { CartClearer } from "@/components/shop/CartClearer";
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { formatPrice } from "@/lib/helpers/price";
import { getT, getLang } from "@/lib/helpers/lang";

type Props = { params: Promise<{ id: string }> };

export default async function OrderConfirmationPage({ params }: Props) {
  const { id } = await params;
  const t = await getT();
  const lang = await getLang();

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

  const lineUrl = process.env.NEXT_PUBLIC_LINE_URL ?? "";
  const fbUrl = process.env.NEXT_PUBLIC_FACEBOOK_URL ?? "";
  const phone = process.env.NEXT_PUBLIC_BUSINESS_PHONE ?? "";

  const inquirySteps =
    lang === "th"
      ? [
          "เราได้รับคำสอบถามของคุณเรียบร้อยแล้ว",
          "ทีมงานจะติดต่อกลับภายใน 24 ชั่วโมงเพื่อยืนยันสต็อกและราคา",
          "นัดวันส่งและสรุปวิธีชำระเงินที่สะดวก",
          "จัดส่งและติดตั้ง (ถ้าต้องการ)",
        ]
      : [
          "We've received your inquiry.",
          "Our team will reach out within 24 hours to confirm stock and pricing.",
          "We'll schedule delivery and agree on a payment method that works for you.",
          "Delivery and installation (if needed).",
        ];

  return (
    <div className="mx-auto max-w-lg px-4 sm:px-6 py-16 text-center">
      <CartClearer />
      {/* Icon */}
      <div className="flex justify-center mb-6">
        <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-950/40 flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-green-500" />
        </div>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        {lang === "th" ? "ส่งคำสอบถามเรียบร้อย" : "Inquiry received"}
      </h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8">
        {lang === "th" ? "เลขที่อ้างอิง " : "Reference number "}
        <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">
          {order.orderNumber}
        </span>{" "}
        {lang === "th"
          ? "— ทีมงานจะติดต่อกลับโดยเร็วที่สุด"
          : "— our team will get back to you shortly."}
      </p>

      {/* Summary card */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-left overflow-hidden mb-8">
        <div className="bg-blue-600 px-5 py-4 text-white">
          <p className="text-blue-100 text-xs">
            {lang === "th" ? "ราคาประมาณ" : "Estimated total"}
          </p>
          <p className="text-2xl font-bold">{formatPrice(order.totalInSatang)}</p>
          <p className="text-[11px] text-blue-100 mt-1">
            {lang === "th"
              ? "ราคาสุดท้ายยืนยันโดยทีมงาน"
              : "Final price confirmed by our team"}
          </p>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          <DetailRow icon={<Package className="h-4 w-4" />} label={t.confirmation.items}>
            <ul className="space-y-0.5">
              {items.map((item) => (
                <li key={item.id} className="text-sm text-gray-700 dark:text-gray-300">
                  {item.productName} × {item.quantity} —{" "}
                  <span className="font-medium">{formatPrice(item.totalInSatang)}</span>
                </li>
              ))}
            </ul>
          </DetailRow>

          <DetailRow icon={<Truck className="h-4 w-4" />} label={t.confirmation.shipping}>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {order.shippingInSatang === 0
                ? t.confirmation.freeShipping
                : formatPrice(order.shippingInSatang)}
            </p>
          </DetailRow>

          <DetailRow icon={<MapPin className="h-4 w-4" />} label={t.confirmation.shipTo}>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {addr.fullName}, {addr.addressLine1},{" "}
              {addr.addressLine2 ? `${addr.addressLine2}, ` : ""}
              {addr.city}, {addr.province} {addr.postalCode}
            </p>
          </DetailRow>
        </div>
      </div>

      {/* Contact channels */}
      <div className="rounded-2xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 p-5 text-left mb-8">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 text-sm">
          {lang === "th" ? "ติดต่อทีมงานได้ทันที" : "Reach out to us now"}
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          {lang === "th"
            ? "ทักหาเราพร้อมเลขอ้างอิงด้านบนเพื่อความรวดเร็ว"
            : "Mention the reference number above for faster service."}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {lineUrl && (
            <a
              href={lineUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/30 text-sm font-semibold text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-950/50 transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              Line
            </a>
          )}
          {fbUrl && (
            <a
              href={fbUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30 text-sm font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Facebook
            </a>
          )}
          {phone && (
            <a
              href={`tel:${phone.replace(/\s/g, "")}`}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Phone className="h-4 w-4" />
              {phone}
            </a>
          )}
        </div>
      </div>

      {/* What's next */}
      <div className="rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 text-left mb-8">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 text-sm">
          {lang === "th" ? "ขั้นตอนต่อไป" : "What happens next"}
        </h2>
        <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          {inquirySteps.map((s, i) => (
            <li key={i} className="flex gap-2">
              <span className="font-bold text-blue-600 dark:text-blue-400 shrink-0">{i + 1}.</span>
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
          {t.confirmation.continueShopping}
        </Link>
        <Link
          href="/services"
          className="flex items-center justify-center w-full py-3 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          {t.confirmation.bookInstallation}
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
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">{label}</p>
        {children}
      </div>
    </div>
  );
}
