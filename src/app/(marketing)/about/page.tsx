import Link from "next/link";
import { getT } from "@/lib/helpers/lang";
import { siteConfig } from "@/config/site";
import { ImageSlot } from "@/components/ui/image-slot";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us | Cool Air Services",
  description:
    "Learn about Cool Air Services — certified AC technicians serving Bangkok with transparent pricing and a 90-day workmanship guarantee.",
};

export default async function AboutPage() {
  const t = await getT();

  const values = [
    { title: t.about.value1Title, body: t.about.value1Body },
    { title: t.about.value2Title, body: t.about.value2Body },
    { title: t.about.value3Title, body: t.about.value3Body },
    { title: t.about.value4Title, body: t.about.value4Body },
  ];

  const stats = [
    { value: "500+", label: t.about.statsCustomers },
    { value: "8+", label: t.about.statsYears },
    { value: "20+", label: t.about.statsTechnicians },
    { value: "90", label: t.about.statsWarranty },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 dark:from-blue-800 dark:to-blue-950 text-white py-20 px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-5 leading-tight">
            {t.about.heroTitle}
          </h1>
          <p className="text-blue-100 text-lg sm:text-xl leading-relaxed">
            {t.about.heroSubtitle}
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="mx-auto max-w-5xl px-4 py-12 grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">{s.value}</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 px-4">
        <div className="mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                {t.about.storyTitle}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4 text-base sm:text-lg">
                {t.about.storyBody1}
              </p>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-base sm:text-lg">
                {t.about.storyBody2}
              </p>
            </div>

            {/* Story image */}
            <ImageSlot
              hint="1200 × 900 px"
              className="aspect-[4/3] rounded-2xl bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600"
            />
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-14 px-4 bg-blue-50 dark:bg-blue-950/20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {t.about.missionTitle}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg leading-relaxed italic">
            &ldquo;{t.about.missionBody}&rdquo;
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 px-4">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-10 text-center">
            {t.about.valuesTitle}
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {values.map((v) => (
              <div
                key={v.title}
                className="rounded-xl border border-gray-200 dark:border-gray-800 p-6 bg-white dark:bg-gray-900"
              >
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{v.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Certified Team */}
      <section className="py-14 px-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Team image — left on this section for visual variety */}
            <ImageSlot
              hint="1200 × 900 px"
              className="aspect-[4/3] rounded-2xl bg-gray-200 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-700"
            />

            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                {t.about.teamTitle}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg leading-relaxed">
                {t.about.teamBody}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            {t.about.ctaTitle}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            {t.about.ctaSubtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/services"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
            >
              {t.about.ctaBook}
            </Link>
            <Link
              href="/products"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              {t.about.ctaShop}
            </Link>
          </div>
          <p className="mt-6 text-sm text-gray-400 dark:text-gray-500">
            {siteConfig.phone} &middot; {siteConfig.openingHours}
          </p>
        </div>
      </section>
    </div>
  );
}
