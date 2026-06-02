import { siteConfig } from "@/config/site";

export default function HomePage() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 text-center">
      <h1 className="text-5xl font-black tracking-tight text-gray-900 mb-4">
        {siteConfig.tagline}
      </h1>
      <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-10">
        {siteConfig.description}
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <a
          href="/services"
          className="px-8 py-3 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
        >
          Book a Service
        </a>
        <a
          href="/products"
          className="px-8 py-3 rounded-md border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
        >
          Shop AC Units
        </a>
      </div>
    </section>
  );
}
