"use client";

import { MessageCircle, ExternalLink, Phone } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface Props {
  bookingNumber: string;
}

/**
 * After a customer books, the team reaches out on Line/Facebook/phone to
 * confirm the details and agree on a price — there is no in-app quote step.
 */
export function BookingContactCard({ bookingNumber }: Props) {
  const { lang } = useLanguage();

  const lineUrl = process.env.NEXT_PUBLIC_LINE_URL ?? "";
  const fbUrl = process.env.NEXT_PUBLIC_FACEBOOK_URL ?? "";
  const phone = process.env.NEXT_PUBLIC_BUSINESS_PHONE ?? "";

  const title = lang === "th" ? "ยืนยันรายละเอียดและราคาทาง Line" : "Confirm details & price on Line";
  const subtitle =
    lang === "th"
      ? `ทีมงานจะติดต่อกลับเพื่อยืนยันราคาและนัดหมาย หรือทักหาเราได้เลย อ้างอิงเลขที่ ${bookingNumber}`
      : `Our team will reach out to confirm the price and schedule — or message us first. Reference: ${bookingNumber}`;

  return (
    <div className="rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/30 dark:bg-blue-950/20 p-5 space-y-4">
      <div className="min-w-0">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
      </div>

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
  );
}
