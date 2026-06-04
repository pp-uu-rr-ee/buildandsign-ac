import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Clock, Phone } from "lucide-react";
import { ImageSlot } from "@/components/ui/image-slot";
import { servicesConfig } from "@/config/services";
import { LocalBusinessJsonLd } from "@/components/seo/LocalBusinessJsonLd";
import { formatPrice } from "@/lib/helpers/price";
import { siteConfig } from "@/config/site";
import { getT, getLang } from "@/lib/helpers/lang";

export const metadata: Metadata = {
  title: "AC Services — Cleaning, Repair & Installation",
  description:
    "Book professional air conditioning services online. AC cleaning from ₱799, repair diagnosis from ₱1,499, installation from ₱2,499. Serving Metro Manila.",
  openGraph: {
    title: "AC Services — Cleaning, Repair & Installation",
    description:
      "Expert AC technicians available 6 days a week. Book online in under 2 minutes.",
  },
};

export default async function ServicesPage() {
  const [t, lang] = await Promise.all([getT(), getLang()]);

  const badges = [
    t.services.badgeSameDay,
    t.services.badgeCertified,
    t.services.badgeGuarantee,
    t.services.badgePricing,
  ];

  return (
    <>
      <LocalBusinessJsonLd />

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
                {t.services.heroTitle}
              </h1>
              <p className="text-blue-100 text-lg mb-8">
                {t.services.heroSubtitle}
              </p>
              <div className="flex flex-wrap gap-4 text-sm">
                {badges.map((label) => (
                  <span
                    key={label}
                    className="flex items-center gap-1.5 bg-white/10 rounded-full px-4 py-1.5"
                  >
                    <CheckCircle2 className="h-4 w-4 text-blue-200" />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Hero image */}
            <div className="hidden lg:block">
              <ImageSlot
                src="/images/services.jpg"
                hint="1200 × 900 px"
                onDark
                className="aspect-[4/3] rounded-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Service cards */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {servicesConfig.map((service) => {
            const Icon = service.icon;
            const title = lang === "th" ? service.titleTh : service.title;
            const tagline = lang === "th" ? service.taglineTh : service.tagline;
            const description = lang === "th" ? service.descriptionTh : service.description;
            const includes = lang === "th" ? service.includesTh : service.includes;
            const faqs = lang === "th" ? service.faqsTh : service.faqs;

            return (
              <div
                key={service.id}
                id={service.id}
                className="flex flex-col rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Service image */}
                <ImageSlot
                  src={`/images/${service.id}.jpg`}
                  hint="800 × 400 px"
                  className="aspect-[2/1] bg-gray-100 dark:bg-gray-800 border-b border-dashed border-gray-200 dark:border-gray-700 rounded-none"
                />

                {/* Card header */}
                <div className="bg-blue-50 dark:bg-blue-950/40 px-6 pt-8 pb-6 border-b border-blue-100 dark:border-blue-900">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-blue-600 text-white mb-4">
                        <Icon className="h-6 w-6" />
                      </div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        {title}
                      </h2>
                      <p className="text-blue-600 dark:text-blue-400 font-medium text-sm mt-0.5">
                        {tagline}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                        {t.services.startingAt}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {formatPrice(service.basePriceInSatang)}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 justify-end mt-1">
                        <Clock className="h-3.5 w-3.5" />
                        {t.services.duration(service.durationMinutes)}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 leading-relaxed">
                    {description}
                  </p>
                </div>

                {/* Includes */}
                <div className="px-6 py-5 flex-1">
                  <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                    {t.services.whatsIncluded}
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {includes.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
                      >
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* FAQs */}
                <div className="px-6 pb-5 space-y-3 border-t border-gray-100 dark:border-gray-800 pt-5">
                  <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                    {t.services.faqs}
                  </p>
                  {faqs.map((faq) => (
                    <details key={faq.question} className="group text-sm">
                      <summary className="cursor-pointer font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors list-none flex items-center justify-between gap-2">
                        {faq.question}
                        <span className="text-gray-400 group-open:rotate-180 transition-transform shrink-0">
                          ▾
                        </span>
                      </summary>
                      <p className="mt-2 text-gray-500 dark:text-gray-400 leading-relaxed pl-1">
                        {faq.answer}
                      </p>
                    </details>
                  ))}
                </div>

                {/* CTA */}
                <div className="px-6 pb-6">
                  <Link
                    href={`/book/${service.id}`}
                    className="flex items-center justify-center w-full py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
                  >
                    {t.services.bookService(title)}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-14 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {t.services.notSureTitle}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {t.services.notSureBody}
          </p>
          <a
            href={`tel:${siteConfig.phone}`}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
          >
            <Phone className="h-5 w-5" />
            {siteConfig.phone}
          </a>
        </div>
      </section>
    </>
  );
}
