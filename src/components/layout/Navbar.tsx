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
    { label: t.common.home, href: "/" },
    { label: t.nav.products, href: "/products" },
    { label: t.nav.services, href: "/services" },
    { label: t.nav.blog, href: "/blog" },
    { label: t.nav.about, href: "/about" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <MobileNav user={session} />

          <Link
            href="/"
            className="flex items-center gap-2.5 shrink-0"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <svg
                className="h-4 w-4 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" />
                <path d="M8 12h8M12 8v8" />
              </svg>
            </div>
            <span className="hidden sm:block text-base font-bold tracking-tight text-slate-900 dark:text-white">
              {siteConfig.name}
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-0.5 flex-1 justify-center">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3.5 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <CartDrawer />

            {session ? (
              <div className="hidden lg:block">
                <UserMenu user={session} />
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  {t.nav.signIn}
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
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
