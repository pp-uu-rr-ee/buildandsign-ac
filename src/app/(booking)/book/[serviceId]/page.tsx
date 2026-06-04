import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getService } from "@/config/services";
import { BookingWizard } from "@/components/booking/BookingWizard";
import { formatPrice } from "@/lib/helpers/price";

type Props = { params: Promise<{ serviceId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { serviceId } = await params;
  const service = getService(serviceId);
  if (!service) return {};
  return {
    title: `Book ${service.title}`,
    description: `Schedule your ${service.title.toLowerCase()} appointment online. Starting at ${formatPrice(service.basePriceInSatang)}. Pick your date and time slot in seconds.`,
  };
}

export default async function BookServicePage({ params }: Props) {
  const { serviceId } = await params;
  const service = getService(serviceId);
  if (!service) notFound();

  const Icon = service.icon;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-gray-500 mb-8">
        <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/services" className="hover:text-blue-600 transition-colors">Services</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-gray-900">Book {service.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left — wizard */}
        <div className="lg:col-span-2">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Book {service.title}
            </h1>
            <p className="text-gray-500 mt-1">{service.tagline}</p>
          </div>
          <BookingWizard service={{
            id: service.id,
            title: service.title,
            tagline: service.tagline,
            durationMinutes: service.durationMinutes,
            basePriceInSatang: service.basePriceInSatang,
            includes: service.includes,
          }} />
        </div>

        {/* Right — service summary sidebar */}
        <aside className="space-y-5">
          <div className="rounded-xl border border-gray-200 bg-white p-5 sticky top-24">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-blue-600 text-white">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{service.title}</p>
                <p className="text-sm text-gray-500">
                  ~{service.durationMinutes} min
                </p>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 mb-4">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
                Starting at
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPrice(service.basePriceInSatang)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Final price quoted after inspection
              </p>
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-2">
              {service.includes.slice(0, 4).map((item) => (
                <div key={item} className="flex items-start gap-2 text-xs text-gray-600">
                  <span className="text-green-500 mt-0.5">✓</span>
                  {item}
                </div>
              ))}
              {service.includes.length > 4 && (
                <Link
                  href={`/services#${service.id}`}
                  className="text-xs text-blue-600 hover:underline"
                >
                  + {service.includes.length - 4} more included
                </Link>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
            <p className="font-semibold mb-1">90-day workmanship guarantee</p>
            <p className="text-blue-600 text-xs">
              If the same issue recurs within 90 days of your service, we come
              back at no extra charge.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
