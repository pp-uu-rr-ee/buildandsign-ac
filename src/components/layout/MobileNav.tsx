"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Menu,
  Phone,
  ShoppingCart,
  LogOut,
  User,
  Package,
  CalendarCheck,
  LayoutDashboard,
  Languages,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { siteConfig } from "@/config/site";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useCart, cartCount } from "@/lib/store/cart";
import { logoutAction } from "@/lib/actions/auth";
import type { SessionPayload } from "@/lib/session";

interface MobileNavProps {
  user?: SessionPayload | null;
}

export function MobileNav({ user }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const { t, lang, toggle: toggleLang } = useLanguage();
  const { items } = useCart();
  const count = cartCount(items);

  const navLinks = [
    { label: t.common.home, href: "/" },
    { label: t.nav.products, href: "/products" },
    { label: t.nav.services, href: "/services" },
    { label: t.nav.blog, href: "/blog" },
    { label: t.nav.about, href: "/about" },
  ];

  const accountLinks = [
    ...(user?.role === "admin"
      ? [{ label: t.nav.adminDashboard, href: "/admin/dashboard", icon: LayoutDashboard }]
      : []),
    { label: t.nav.myOrders, href: "/orders", icon: Package },
    { label: t.nav.myBookings, href: "/bookings", icon: CalendarCheck },
    { label: t.nav.accountSettings, href: "/account", icon: User },
  ];

  const linkClass =
    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors dark:text-gray-200 dark:hover:bg-blue-950/40 dark:hover:text-blue-400";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className="lg:hidden p-2 rounded-md text-gray-600 hover:text-blue-600 hover:bg-gray-100 transition-colors dark:text-gray-300 dark:hover:bg-gray-800"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </SheetTrigger>

      <SheetContent
        side="left"
        className="w-72 p-0 bg-white dark:bg-gray-950 dark:border-gray-800 flex flex-col overflow-y-auto"
      >
        {/* ── User section ── */}
        {user ? (
          <div className="px-4 pt-8 pb-4 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-8" /> /* top spacer when no user */
        )}

        {/* ── Nav links ── */}
        <nav className="flex flex-col gap-0.5 px-3 pt-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={linkClass}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* ── Account links (logged-in only) ── */}
        {user && (
          <div className="px-3 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex flex-col gap-0.5">
            {accountLinks.map(({ label, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={linkClass}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            ))}
          </div>
        )}

        {/* ── Bottom section ── */}
        <div className="mt-auto px-4 pb-6 pt-4 border-t border-gray-100 dark:border-gray-800 space-y-2">
          {/* Cart */}
          <Link
            href="/cart"
            onClick={() => setOpen(false)}
            className="flex items-center justify-between w-full px-3 py-2.5 rounded-md border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <span className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              {t.nav.cart}
            </span>
            {count > 0 && (
              <span className="h-5 min-w-5 px-1 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                {count > 9 ? "9+" : count}
              </span>
            )}
          </Link>

          {/* Language toggle */}
          <button
            onClick={toggleLang}
            className="flex w-full items-center justify-center gap-2 px-3 py-2 rounded-md border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <Languages className="h-3.5 w-3.5" />
            {lang === "en" ? "EN → TH" : "TH → EN"}
          </button>

          {/* Sign out (logged-in) or Login/Register (guest) */}
          {user ? (
            <form action={logoutAction} className="w-full">
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 px-3 py-2.5 rounded-md border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
              >
                <LogOut className="h-4 w-4" />
                {t.nav.signOut}
              </button>
            </form>
          ) : (
            <div className="flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center w-full px-3 py-2.5 rounded-md border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                {t.nav.signIn}
              </Link>
              <Link
                href="/register"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center w-full px-3 py-2.5 rounded-md bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                {t.nav.getStarted}
              </Link>
            </div>
          )}

          {/* Phone */}
          <a
            href={`tel:${siteConfig.phone}`}
            className="flex items-center justify-center gap-2 text-xs text-gray-400 hover:text-blue-600 transition-colors dark:text-gray-500 dark:hover:text-blue-400 pt-1"
          >
            <Phone className="h-3.5 w-3.5" />
            {siteConfig.phone}
          </a>
        </div>
      </SheetContent>
    </Sheet>
  );
}
