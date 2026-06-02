"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Phone } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { navLinks } from "./NavLinks";
import { siteConfig } from "@/config/site";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className="lg:hidden p-2 rounded-md text-gray-600 hover:text-blue-600 hover:bg-gray-100 transition-colors"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </SheetTrigger>
      <SheetContent side="left" className="w-72 pt-10">
        <nav className="flex flex-col gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="flex items-center px-3 py-3 rounded-md text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="mt-8 border-t pt-6 space-y-3">
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center w-full px-4 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center w-full px-4 py-2 rounded-md bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Get started
          </Link>
          <a
            href={`tel:${siteConfig.phone}`}
            className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors"
          >
            <Phone className="h-4 w-4" />
            {siteConfig.phone}
          </a>
        </div>
      </SheetContent>
    </Sheet>
  );
}
