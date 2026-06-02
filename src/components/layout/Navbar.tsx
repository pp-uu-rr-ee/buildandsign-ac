import Link from "next/link";
import { CartDrawer } from "@/components/shop/CartDrawer";
import { getSession } from "@/lib/session";
import { siteConfig } from "@/config/site";
import { getT } from "@/lib/helpers/lang";
import { MobileNav } from "./MobileNav";
import { UserMenu } from "./UserMenu";

export async function Navbar() {
  const [session, t] = await Promise.all([getSession(), getT()]);

  const navLinks = [
    { label: t.nav.products, href: "/products" },
    { label: t.nav.services, href: "/services" },
    { label: t.nav.blog, href: "/blog" },
    { label: t.nav.about, href: "/about" },
    { label: t.nav.contact, href: "/contact" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/90 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-950/90">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <MobileNav />

          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-blue-600 text-lg shrink-0"
          >
            <svg
              className="h-7 w-7"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" />
              <path d="M8 12h8M12 8v8" />
            </svg>
            <span className="hidden sm:block">{siteConfig.name}</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors dark:text-gray-300 dark:hover:text-blue-400 dark:hover:bg-blue-950/40"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <CartDrawer />

            {session ? (
              <UserMenu user={session} />
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  {t.nav.signIn}
                </Link>
                <Link
                  href="/register"
                  className="px-3 py-1.5 rounded-md bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                >
                  {t.nav.getStarted}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
