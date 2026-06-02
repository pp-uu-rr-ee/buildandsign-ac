"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Phone } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { siteConfig } from "@/config/site";
import { useLanguage } from "@/components/providers/LanguageProvider";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();

  const navLinks = [
    { label: t.nav.products, href: "/products" },
    { label: t.nav.services, href: "/services" },
    { label: t.nav.blog, href: "/blog" },
    { label: t.nav.about, href: "/about" },
    { label: t.nav.contact, href: "/contact" },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className="lg:hidden p-2 rounded-md text-gray-600 hover:text-blue-600 hover:bg-gray-100 transition-colors dark:text-gray-300 dark:hover:bg-gray-800"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </SheetTrigger>
      <SheetContent side="left" className="w-72 pt-10 bg-white dark:bg-gray-950 dark:border-gray-800">
        <nav className="flex flex-col gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="flex items-center px-3 py-3 rounded-md text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors dark:text-gray-200 dark:hover:bg-blue-950/40 dark:hover:text-blue-400"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="mt-8 border-t border-gray-200 pt-6 space-y-3 dark:border-gray-800">
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center w-full px-4 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            {t.nav.signIn}
          </Link>
          <Link
            href="/register"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center w-full px-4 py-2 rounded-md bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            {t.nav.getStarted}
          </Link>
          <a
            href={`tel:${siteConfig.phone}`}
            className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors dark:text-gray-400 dark:hover:text-blue-400"
          >
            <Phone className="h-4 w-4" />
            {siteConfig.phone}
          </a>
        </div>
      </SheetContent>
    </Sheet>
  );
}
