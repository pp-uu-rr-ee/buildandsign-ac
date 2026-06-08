import type { Metadata } from "next";
import { Phone, Mail, MapPin, Clock } from "lucide-react";
import { siteConfig } from "@/config/site";
import { getT, getLang } from "@/lib/helpers/lang";

export const metadata: Metadata = {
  title: "Contact Us | Cool Air Services",
  description:
    "Get in touch with Cool Air Services. Call us, email us, or come visit our Bangkok office.",
};

export default async function ContactPage() {
  const [t, lang] = await Promise.all([getT(), getLang()]);
  const isTh = lang === "th";

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-16">
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3">
          {isTh ? "ติดต่อเรา" : "Contact Us"}
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          {isTh
            ? "ทีมงานของเรายินดีให้บริการ จันทร์–เสาร์ 08:00–18:00 น."
            : "Our team is available Mon–Sat, 8 AM–6 PM."}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <ContactCard
          icon={<Phone className="h-5 w-5" />}
          title={isTh ? "โทรศัพท์" : "Phone"}
          primary={
            <a href={`tel:${siteConfig.phone}`} className="hover:underline">
              {siteConfig.phone}
            </a>
          }
          secondary={
            <a href={`tel:${siteConfig.phone2}`} className="hover:underline">
              {siteConfig.phone2}
            </a>
          }
        />
        <ContactCard
          icon={<Mail className="h-5 w-5" />}
          title={isTh ? "อีเมล" : "Email"}
          primary={
            <a href={`mailto:${siteConfig.email}`} className="hover:underline">
              {siteConfig.email}
            </a>
          }
        />
        <ContactCard
          icon={<MapPin className="h-5 w-5" />}
          title={isTh ? "ที่ตั้ง" : "Address"}
          primary={
            <>
              {siteConfig.address.streetAddress}
              <br />
              {siteConfig.address.addressLocality}, {siteConfig.address.addressRegion}{" "}
              {siteConfig.address.postalCode}
            </>
          }
        />
        <ContactCard
          icon={<Clock className="h-5 w-5" />}
          title={isTh ? "เวลาทำการ" : "Hours"}
          primary={isTh ? "จันทร์–เสาร์ 08:00–18:00 น." : "Mon–Sat, 8 AM – 6 PM"}
          secondary={isTh ? "ปิดวันอาทิตย์" : "Closed Sunday"}
        />
      </div>

      <p className="mt-12 text-center text-xs text-gray-400 dark:text-gray-500">
        {t.footer.rights}
      </p>
    </div>
  );
}

function ContactCard({
  icon,
  title,
  primary,
  secondary,
}: {
  icon: React.ReactNode;
  title: string;
  primary: React.ReactNode;
  secondary?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-3">
        {icon}
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
      </div>
      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{primary}</p>
      {secondary && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{secondary}</p>
      )}
    </div>
  );
}
