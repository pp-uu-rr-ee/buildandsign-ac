import Link from "next/link";
import { Phone, Mail, MapPin } from "lucide-react";
import { siteConfig } from "@/config/site";
import { getT } from "@/lib/helpers/lang";

export async function Footer() {
  const t = await getT();

  const services = [
    { label: t.footer.cleaning, href: "/services#cleaning" },
    { label: t.footer.repair, href: "/services#repair" },
    { label: t.footer.installation, href: "/services#installation" },
    { label: t.footer.inspection, href: "/services#inspection" },
  ];

  const shop = [
    { label: t.footer.allProducts, href: "/products" },
    { label: t.footer.splitType, href: "/products?category=split" },
    { label: t.footer.windowType, href: "/products?category=window" },
    { label: t.footer.portable, href: "/products?category=portable" },
  ];

  const company = [
    { label: t.footer.aboutUs, href: "/about" },
    { label: t.footer.blog, href: "/blog" },
    { label: t.footer.contact, href: "/contact" },
    { label: t.footer.careers, href: "/careers" },
  ];

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="inline-block text-xl font-bold text-white">
              {siteConfig.name}
            </Link>
            <p className="text-sm leading-relaxed text-gray-400">{siteConfig.description}</p>
            <div className="flex gap-3">
              <a
                href={siteConfig.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="p-2 rounded-md bg-gray-800 hover:bg-blue-600 transition-colors"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.522-4.478-10-10-10S2 6.478 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987H7.898V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                </svg>
              </a>
              <a
                href={siteConfig.social.line}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Line"
                className="p-2 rounded-md bg-gray-800 hover:bg-[#06C755] transition-colors"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.07 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                </svg>
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              {t.footer.servicesCol}
            </h3>
            <ul className="space-y-2">
              {services.map((s) => (
                <li key={s.href}>
                  <Link href={s.href} className="text-sm hover:text-white transition-colors">
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Shop */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              {t.footer.shopCol}
            </h3>
            <ul className="space-y-2">
              {shop.map((s) => (
                <li key={s.href}>
                  <Link href={s.href} className="text-sm hover:text-white transition-colors">
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              {t.footer.contactCol}
            </h3>
            <ul className="space-y-3">
              <li>
                <a href={`tel:${siteConfig.phone}`} className="flex items-start gap-2 text-sm hover:text-white transition-colors">
                  <Phone className="h-4 w-4 mt-0.5 shrink-0" />
                  {siteConfig.phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${siteConfig.email}`} className="flex items-start gap-2 text-sm hover:text-white transition-colors">
                  <Mail className="h-4 w-4 mt-0.5 shrink-0" />
                  {siteConfig.email}
                </a>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                <span>
                  {siteConfig.address.streetAddress},{" "}
                  {siteConfig.address.addressLocality},{" "}
                  {siteConfig.address.addressRegion}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* <div className="border-t border-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <p>
            &copy; {new Date().getFullYear()} {siteConfig.name}. {t.footer.rights}
          </p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-gray-300 transition-colors">{t.footer.privacy}</Link>
            <Link href="/terms" className="hover:text-gray-300 transition-colors">{t.footer.terms}</Link>
          </div>
        </div>
      </div> */}
    </footer>
  );
}
