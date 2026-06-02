import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Clock, Phone } from "lucide-react";
import { servicesConfig } from "@/config/services";
import { LocalBusinessJsonLd } from "@/components/seo/LocalBusinessJsonLd";
import { formatPrice } from "@/lib/helpers/price";
import { siteConfig } from "@/config/site";

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

export default function ServicesPage() {
  return (
    <>
      <LocalBusinessJsonLd />

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
            AC Services You Can Trust
          </h1>
          <p className="text-blue-100 text-lg max-w-2xl mx-auto mb-8">
            Certified technicians, transparent pricing, and a 90-day workmanship
            guarantee. Available Monday–Saturday, 8 AM–6 PM.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            {[
              "Same-day availability",
              "Certified technicians",
              "90-day guarantee",
              "Transparent pricing",
            ].map((t) => (
              <span
                key={t}
                className="flex items-center gap-1.5 bg-white/10 rounded-full px-4 py-1.5"
              >
                <CheckCircle2 className="h-4 w-4 text-blue-200" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Service cards */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {servicesConfig.map((service) => {
            const Icon = service.icon;
            return (
              <div
                key={service.id}
                id={service.id}
                className="flex flex-col rounded-2xl border border-gray-200 bg-white overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Card header */}
                <div className="bg-blue-50 px-6 pt-8 pb-6 border-b border-blue-100">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-blue-600 text-white mb-4">
                        <Icon className="h-6 w-6" />
                      </div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {service.title}
                      </h2>
                      <p className="text-blue-600 font-medium text-sm mt-0.5">
                        {service.tagline}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-gray-400 uppercase tracking-wide">
                        Starting at
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatPrice(service.basePriceInCents)}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-gray-500 justify-end mt-1">
                        <Clock className="h-3.5 w-3.5" />
                        ~{service.durationMinutes} min
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-3 leading-relaxed">
                    {service.description}
                  </p>
                </div>

                {/* Includes */}
                <div className="px-6 py-5 flex-1">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    What&apos;s included
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {service.includes.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2 text-sm text-gray-600"
                      >
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* FAQs */}
                <div className="px-6 pb-5 space-y-3 border-t border-gray-100 pt-5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    FAQs
                  </p>
                  {service.faqs.map((faq) => (
                    <details
                      key={faq.question}
                      className="group text-sm"
                    >
                      <summary className="cursor-pointer font-medium text-gray-700 hover:text-blue-600 transition-colors list-none flex items-center justify-between gap-2">
                        {faq.question}
                        <span className="text-gray-400 group-open:rotate-180 transition-transform shrink-0">
                          ▾
                        </span>
                      </summary>
                      <p className="mt-2 text-gray-500 leading-relaxed pl-1">
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
                    Book {service.title}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom CTA — call us */}
      <section className="bg-gray-50 border-t border-gray-200">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-14 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Not sure which service you need?
          </h2>
          <p className="text-gray-500 mb-6">
            Call us and describe the problem. Our team will recommend the right
            service — no upselling, just honest advice.
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
