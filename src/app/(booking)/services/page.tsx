import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Clock, Phone, Sparkles, Wrench, AlertCircle } from "lucide-react";
import { ImageSlot } from "@/components/ui/image-slot";
import { servicesConfig, type ServiceConfig } from "@/config/services";
import { LocalBusinessJsonLd } from "@/components/seo/LocalBusinessJsonLd";
import { formatPrice } from "@/lib/helpers/price";
import { siteConfig } from "@/config/site";
import { getT, getLang } from "@/lib/helpers/lang";

export const metadata: Metadata = {
  title: "AC Services — Cleaning, Repair & Installation",
  description:
    "Book professional air conditioning services online. BTU-based transparent pricing for cleaning and installation. Flat diagnostic fee for repair and inspection.",
};

export default async function ServicesPage() {
  const [t, lang] = await Promise.all([getT(), getLang()]);

  const badges = [
    t.services.badgeSameDay,
    t.services.badgeCertified,
    t.services.badgeGuarantee,
    t.services.badgePricing,
  ];

  const btuServices = servicesConfig.filter((s) => s.group === "btu");
  const diagnosticServices = servicesConfig.filter(
    (s) => s.group === "diagnostic"
  );

  return (
    <>
      <LocalBusinessJsonLd />

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-4">
                {t.services.heroTitle}
              </h1>
              <p className="text-blue-100 text-base sm:text-lg mb-8">
                {t.services.heroSubtitle}
              </p>
              <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
                {badges.map((label) => (
                  <span
                    key={label}
                    className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1.5"
                  >
                    <CheckCircle2 className="h-4 w-4 text-blue-200" />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <div className="hidden lg:block">
              <ImageSlot
                hint="1200 × 900 px"
                onDark
                className="aspect-[4/3] rounded-2xl bg-white/10 border-2 border-dashed border-white/30"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Group A: BTU-based ──────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <GroupHeader
          icon={Sparkles}
          accent="blue"
          title={t.services.groupBtuTitle}
          subtitle={t.services.groupBtuSubtitle}
        />

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {btuServices.map((service) => (
            <BtuServiceCard
              key={service.id}
              service={service}
              t={t}
              lang={lang}
            />
          ))}
        </div>
      </section>

      {/* ─── Group B: Diagnostic-fee ─────────────────────────────────────── */}
      <section className="bg-gray-50 dark:bg-gray-900 border-y border-gray-200 dark:border-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <GroupHeader
            icon={Wrench}
            accent="orange"
            title={t.services.groupDiagnosticTitle}
            subtitle={t.services.groupDiagnosticSubtitle}
          />

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {diagnosticServices.map((service) => (
              <DiagnosticServiceCard
                key={service.id}
                service={service}
                t={t}
                lang={lang}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-gray-200 dark:border-gray-800">
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

// ─── Group header ──────────────────────────────────────────────────────────

function GroupHeader({
  icon: Icon,
  accent,
  title,
  subtitle,
}: {
  icon: typeof Sparkles;
  accent: "blue" | "orange";
  title: string;
  subtitle: string;
}) {
  const colors =
    accent === "blue"
      ? {
          chip: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
          iconWrap: "bg-blue-600 text-white",
        }
      : {
          chip: "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
          iconWrap: "bg-orange-500 text-white",
        };

  return (
    <div className="max-w-3xl">
      <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${colors.chip}`}>
        <span className={`flex h-5 w-5 items-center justify-center rounded-full ${colors.iconWrap}`}>
          <Icon className="h-3 w-3" />
        </span>
        {accent === "blue" ? "Group A" : "Group B"}
      </div>
      <h2 className="mt-3 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
        {title}
      </h2>
      <p className="mt-2 text-sm sm:text-base text-gray-500 dark:text-gray-400 leading-relaxed">
        {subtitle}
      </p>
    </div>
  );
}

// ─── BTU service card ──────────────────────────────────────────────────────

type T = Awaited<ReturnType<typeof getT>>;
type Lang = Awaited<ReturnType<typeof getLang>>;

function BtuServiceCard({
  service,
  t,
  lang,
}: {
  service: ServiceConfig;
  t: T;
  lang: Lang;
}) {
  const Icon = service.icon;
  const title = lang === "th" ? service.titleTh : service.title;
  const tagline = lang === "th" ? service.taglineTh : service.tagline;
  const description = lang === "th" ? service.descriptionTh : service.description;
  const includes = lang === "th" ? service.includesTh : service.includes;
  const extraFactors =
    lang === "th" ? service.extraFactorsTh : service.extraFactors;

  return (
    <article
      id={service.id}
      className="flex flex-col rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden hover:shadow-lg transition-shadow"
    >
      {/* Header */}
      <div className="bg-blue-50 dark:bg-blue-950/40 px-5 sm:px-6 pt-6 pb-5 border-b border-blue-100 dark:border-blue-900">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="inline-flex items-center justify-center h-11 w-11 rounded-xl bg-blue-600 text-white mb-3">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
              {title}
            </h3>
            <p className="text-blue-600 dark:text-blue-400 font-medium text-xs sm:text-sm mt-0.5">
              {tagline}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">
              {service.startingPrice
                ? t.services.startingFrom
                : t.services.startingAt}
            </p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formatPrice(service.basePriceInSatang)}
              {service.startingPrice && "+"}
            </p>
            <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400 justify-end mt-0.5">
              <Clock className="h-3 w-3" />
              {t.services.duration(service.durationMinutes)}
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 leading-relaxed">
          {description}
        </p>
      </div>

      {/* BTU pricing table */}
      {service.btuPricing && service.btuPricing.length > 0 && (
        <div className="px-5 sm:px-6 py-5 border-b border-gray-100 dark:border-gray-800">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
            {t.services.btuTableHeading}
          </p>
          <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">
                    {t.services.btuRangeCol}
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">
                    {t.services.btuPriceCol}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {service.btuPricing.map((tier) => (
                  <tr key={tier.range}>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                      {lang === "th" ? tier.rangeTh : tier.range}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                      {formatPrice(tier.priceInSatang)}
                      {tier.startingAt && "+"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2">
            {t.services.btuFootnote}
          </p>
        </div>
      )}

      {/* Extra factors (e.g. installation) */}
      {extraFactors && extraFactors.length > 0 && (
        <div className="px-5 sm:px-6 py-4 bg-amber-50/40 dark:bg-amber-950/10 border-b border-amber-100 dark:border-amber-900/40">
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5" />
            {t.services.extraFactorsTitle}
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1">
            {extraFactors.map((f) => (
              <li
                key={f}
                className="text-xs text-gray-700 dark:text-gray-300 flex items-start gap-1.5"
              >
                <span className="text-amber-500 mt-0.5">•</span>
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Includes */}
      <div className="px-5 sm:px-6 py-5 flex-1">
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

      {/* CTA */}
      <CtaFooter service={service} title={title} t={t} />
    </article>
  );
}

// ─── Diagnostic service card ───────────────────────────────────────────────

function DiagnosticServiceCard({
  service,
  t,
  lang,
}: {
  service: ServiceConfig;
  t: T;
  lang: Lang;
}) {
  const Icon = service.icon;
  const title = lang === "th" ? service.titleTh : service.title;
  const tagline = lang === "th" ? service.taglineTh : service.tagline;
  const description = lang === "th" ? service.descriptionTh : service.description;
  const includes = lang === "th" ? service.includesTh : service.includes;
  const symptoms =
    lang === "th" ? service.commonSymptomsTh : service.commonSymptoms;

  const feeLabel =
    (lang === "th" ? service.feeLabelTh : service.feeLabel) ??
    t.services.diagnosticFeeLabel;
  const feeNote =
    (lang === "th" ? service.feeNoteTh : service.feeNote) ??
    t.services.diagnosticFeeNote;

  return (
    <article
      id={service.id}
      className="flex flex-col rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden hover:shadow-lg transition-shadow"
    >
      {/* Header */}
      <div className="bg-orange-50 dark:bg-orange-950/30 px-5 sm:px-6 pt-6 pb-5 border-b border-orange-100 dark:border-orange-900/40">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="inline-flex items-center justify-center h-11 w-11 rounded-xl bg-orange-500 text-white mb-3">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
              {title}
            </h3>
            <p className="text-orange-600 dark:text-orange-400 font-medium text-xs sm:text-sm mt-0.5">
              {tagline}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {feeLabel}
            </p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formatPrice(service.diagnosticFeeInSatang ?? service.basePriceInSatang)}
            </p>
            <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400 justify-end mt-0.5">
              <Clock className="h-3 w-3" />
              {t.services.duration(service.durationMinutes)}
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 leading-relaxed">
          {description}
        </p>
      </div>

      {/* Diagnostic / inspection notice */}
      <div className="px-5 sm:px-6 py-3.5 bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200/60 dark:border-amber-900/40 flex items-start gap-2">
        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
          {feeNote}
        </p>
      </div>

      {/* Common symptoms */}
      {symptoms && symptoms.length > 0 && (
        <div className="px-5 sm:px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2.5">
            {t.services.commonSymptomsTitle}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {symptoms.map((s) => (
              <span
                key={s}
                className="px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Includes */}
      <div className="px-5 sm:px-6 py-5 flex-1">
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

      <CtaFooter service={service} title={title} t={t} accent="orange" />
    </article>
  );
}

// ─── CTA footer (shared) ───────────────────────────────────────────────────

function CtaFooter({
  service,
  title,
  t,
  accent = "blue",
}: {
  service: ServiceConfig;
  title: string;
  t: T;
  accent?: "blue" | "orange";
}) {
  if (!service.bookable) {
    return (
      <div className="px-5 sm:px-6 pb-5 pt-1 space-y-2">
        <a
          href={`tel:${siteConfig.phone}`}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gray-900 dark:bg-gray-700 text-white text-sm font-semibold hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors"
        >
          <Phone className="h-4 w-4" />
          {t.services.callToBook}
        </a>
        <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center">
          {t.services.onlineSoon}
        </p>
      </div>
    );
  }

  const btnColor =
    accent === "orange"
      ? "bg-orange-500 hover:bg-orange-600"
      : "bg-blue-600 hover:bg-blue-700";

  return (
    <div className="px-5 sm:px-6 pb-5">
      <Link
        href={`/book/${service.id}`}
        className={`flex items-center justify-center w-full py-3 rounded-xl text-white text-sm font-semibold transition-colors ${btnColor}`}
      >
        {t.services.bookService(title)}
      </Link>
    </div>
  );
}
