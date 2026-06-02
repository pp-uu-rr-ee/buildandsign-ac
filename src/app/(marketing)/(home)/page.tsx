import Link from "next/link";
import {
  Wrench,
  Sparkles,
  Package,
  ClipboardCheck,
  ShieldCheck,
  Clock,
  Star,
  BadgeCheck,
  PhoneCall,
  ArrowRight,
  ThumbsUp,
} from "lucide-react";
import { siteConfig } from "@/config/site";
import { servicesConfig } from "@/config/services";
import { getProducts } from "@/lib/queries/products";
import { ProductCard } from "@/components/shop/ProductCard";
import { formatPrice } from "@/lib/helpers/price";

const serviceIcons = {
  cleaning: Sparkles,
  repair: Wrench,
  installation: Package,
  inspection: ClipboardCheck,
} as const;

const testimonials = [
  {
    name: "Maria Santos",
    location: "Makati City",
    rating: 5,
    text: "Super professional team! They cleaned my 3 AC units in under 2 hours and the difference in air quality is night and day. Will definitely book again.",
  },
  {
    name: "Roland Cruz",
    location: "Pasig City",
    rating: 5,
    text: "My AC stopped cooling in the middle of summer. Cool Air Services sent a technician the same day and fixed it within an hour. Reasonable price and great service!",
  },
  {
    name: "Jenny Reyes",
    location: "Taguig City",
    rating: 5,
    text: "Bought a new AC from their shop and had them install it. The installation was flawless — clean work, no mess, and they walked me through everything. Highly recommended!",
  },
];

export const metadata = {
  title: `${siteConfig.tagline} | ${siteConfig.name}`,
  description: siteConfig.description,
};

export default async function HomePage() {
  const { products: featuredProducts } = await getProducts({
    featured: true,
    limit: 4,
  });

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-sky-500">
        <div className="absolute inset-0 bg-[url('/images/hero-pattern.svg')] opacity-10" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-sm font-medium text-white mb-6">
              <BadgeCheck className="h-4 w-4" />
              Certified AC Technicians · Metro Manila
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight mb-6">
              {siteConfig.tagline}
            </h1>
            <p className="text-lg text-blue-100 max-w-xl mb-10">
              {siteConfig.description}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/services"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-8 py-3.5 text-base font-semibold text-blue-700 shadow-lg hover:bg-blue-50 transition-colors"
              >
                Book a Service
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/products"
                className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-white/40 px-8 py-3.5 text-base font-semibold text-white hover:bg-white/10 transition-colors"
              >
                Shop AC Units
              </Link>
            </div>

            <div className="mt-12 flex flex-wrap gap-6">
              {[
                { icon: ShieldCheck, label: "90-Day Workmanship Warranty" },
                { icon: Clock, label: "Same-Day Service Available" },
                { icon: ThumbsUp, label: "500+ Happy Customers" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-blue-100 text-sm">
                  <Icon className="h-4 w-4 text-white" />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Service Highlights ── */}
      <section className="bg-gray-50 py-20 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3 dark:text-gray-50">Our Services</h2>
            <p className="text-gray-500 max-w-xl mx-auto dark:text-gray-400">
              Professional AC services for homes and businesses across Metro Manila.
              All work guaranteed.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {servicesConfig.map((service) => {
              const Icon = serviceIcons[service.id];
              return (
                <div
                  key={service.id}
                  className="group flex flex-col rounded-2xl bg-white border border-gray-200 p-6 hover:border-blue-300 hover:shadow-md transition-all duration-200 dark:bg-gray-800 dark:border-gray-700 dark:hover:border-blue-600"
                >
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors dark:bg-blue-950/50 dark:text-blue-400 dark:group-hover:bg-blue-600 dark:group-hover:text-white">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1 dark:text-gray-100">
                    {service.title}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4 flex-1 dark:text-gray-400">
                    {service.tagline}
                  </p>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100 dark:border-gray-700">
                    <span className="text-blue-700 font-semibold text-sm dark:text-blue-400">
                      From {formatPrice(service.basePriceInCents)}
                    </span>
                    <Link
                      href={`/book/${service.id}`}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Book <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/services"
              className="inline-flex items-center gap-2 rounded-lg border border-blue-600 px-6 py-2.5 text-sm font-semibold text-blue-600 hover:bg-blue-600 hover:text-white transition-colors dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-600 dark:hover:text-white"
            >
              View All Services <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Featured Products ── */}
      {featuredProducts.length > 0 && (
        <section className="py-20 bg-white dark:bg-gray-950">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2 dark:text-gray-50">
                  Featured AC Units
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                  Top-rated air conditioners for every space and budget.
                </p>
              </div>
              <Link
                href="/products"
                className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                View all products <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            <div className="mt-8 text-center sm:hidden">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                View all products <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Why Choose Us ── */}
      <section className="py-20 bg-blue-700 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Why Cool Air Services?</h2>
            <p className="text-blue-200 max-w-xl mx-auto">
              We've been keeping Metro Manila cool for years — with certified
              technicians, transparent pricing, and guaranteed results.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: BadgeCheck,
                title: "Brand-Certified Technicians",
                body: "Our team is trained and certified by leading AC manufacturers — Carrier, Daikin, Panasonic, LG, Samsung, and more.",
              },
              {
                icon: Clock,
                title: "Same-Day Booking Available",
                body: "Need help fast? We offer same-day service slots Monday to Saturday. Book online and get confirmed in minutes.",
              },
              {
                icon: ShieldCheck,
                title: "90-Day Workmanship Warranty",
                body: "Every repair and installation comes with a 90-day warranty on labor. If something goes wrong, we fix it — free of charge.",
              },
              {
                icon: Star,
                title: "Transparent Flat-Rate Pricing",
                body: "Know exactly what you're paying before we arrive. No hidden charges, no surprise add-ons — just honest pricing.",
              },
              {
                icon: Wrench,
                title: "All Makes & Models",
                body: "Window type, split type, cassette, or tower — inverter or non-inverter. We service them all, regardless of brand.",
              },
              {
                icon: PhoneCall,
                title: "Real Support, Real People",
                body: `Questions before or after your booking? Call us at ${siteConfig.phone} or email ${siteConfig.email}. No bots.`,
              },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex gap-4">
                <div className="shrink-0 mt-0.5">
                  <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-blue-200" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">{title}</h3>
                  <p className="text-blue-200 text-sm leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3 dark:text-gray-50">
              What Our Customers Say
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto dark:text-gray-400">
              Don't just take our word for it — hear from homeowners and businesses
              across Metro Manila.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="rounded-2xl bg-white border border-gray-200 p-6 flex flex-col gap-4 dark:bg-gray-800 dark:border-gray-700"
              >
                <div className="flex gap-0.5">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed flex-1 dark:text-gray-300">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                  <p className="font-semibold text-gray-900 text-sm dark:text-gray-100">{t.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-20 bg-white dark:bg-gray-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-sky-500 px-8 py-16 text-center text-white">
            <h2 className="text-3xl sm:text-4xl font-black mb-4">
              Ready to Stay Cool?
            </h2>
            <p className="text-blue-100 max-w-lg mx-auto mb-8 text-lg">
              Book a service online in minutes, or browse our selection of
              energy-efficient AC units delivered to your door.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/services"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-8 py-3.5 text-base font-semibold text-blue-700 shadow hover:bg-blue-50 transition-colors"
              >
                Book a Service <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/products"
                className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-white/40 px-8 py-3.5 text-base font-semibold text-white hover:bg-white/10 transition-colors"
              >
                Shop AC Units
              </Link>
            </div>
            <p className="mt-6 text-sm text-blue-200">
              Questions? Call us at{" "}
              <a href={`tel:${siteConfig.phone}`} className="underline hover:text-white">
                {siteConfig.phone}
              </a>
              {" "}· Mon–Sat, 8 AM–6 PM
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
