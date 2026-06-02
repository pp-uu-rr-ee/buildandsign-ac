import Link from "next/link";
import { Phone } from "lucide-react";
import { CartDrawer } from "@/components/shop/CartDrawer";
import { getSession } from "@/lib/session";
import { siteConfig } from "@/config/site";
import { navLinks } from "./NavLinks";
import { MobileNav } from "./MobileNav";
import { UserMenu } from "./UserMenu";

export async function Navbar() {
  const session = await getSession();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/90 backdrop-blur-sm">
      {/* Top bar — phone + hours
      <div className="hidden lg:block bg-blue-600 text-white text-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between py-1.5">
          <a
            href={`tel:${siteConfig.phone}`}
            className="flex items-center gap-1.5 hover:text-blue-100 transition-colors"
          >
            <Phone className="h-3 w-3" />
            {siteConfig.phone}
          </a>
          <span>{siteConfig.openingHours}</span>
        </div>
      </div> */}

      {/* Main nav row */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Mobile hamburger */}
          <MobileNav />

          {/* Logo */}
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

          {/* Desktop nav links */}
          <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Cart */}
            <CartDrawer />

            {session ? (
              <UserMenu user={session} />
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="px-3 py-1.5 rounded-md bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                >
                  Get started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
