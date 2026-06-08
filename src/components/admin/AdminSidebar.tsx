"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  CalendarCheck,
  CalendarDays,
  Users,
  FileText,
  Settings,
  Wrench,
  Menu,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { cn } from "@/lib/utils";

type T = ReturnType<typeof useLanguage>["t"];

function navItemsFor(t: T) {
  return [
    { label: t.admin.dashboard, href: "/admin/dashboard", icon: LayoutDashboard },
    { label: t.admin.products, href: "/admin/products", icon: Package },
    { label: t.admin.orders, href: "/admin/orders", icon: ShoppingBag },
    { label: t.admin.bookings, href: "/admin/bookings", icon: CalendarCheck },
    { label: t.admin.calendar, href: "/admin/calendar", icon: CalendarDays },
    { label: t.admin.technicians, href: "/admin/technicians", icon: Wrench },
    { label: t.admin.customers, href: "/admin/customers", icon: Users },
    { label: t.admin.blog, href: "/admin/blog", icon: FileText },
    { label: t.admin.settings, href: "/admin/settings", icon: Settings },
  ];
}

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  const { t } = useLanguage();
  const navItems = navItemsFor(t);
  return (
    <>
      {navItems.map(({ label, href, icon: Icon }) => {
        const isActive = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
              isActive
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:bg-gray-800 hover:text-white"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </>
  );
}

// ─── Desktop sidebar (hidden below lg) ──────────────────────────────────────

export function AdminSidebar() {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <aside className="hidden lg:flex flex-col w-60 min-h-screen bg-gray-900 text-gray-300 shrink-0">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-gray-800">
        <Link href="/admin/dashboard" className="text-white font-bold text-base">
          ⚙ {t.admin.panel}
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-0.5">
        <NavLinks pathname={pathname} />
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          {t.admin.viewSite}
        </Link>
      </div>
    </aside>
  );
}

// ─── Mobile drawer + hamburger trigger ──────────────────────────────────────

export function AdminMobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className="lg:hidden p-2 -ml-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </SheetTrigger>

      <SheetContent
        side="left"
        className="w-64 p-0 bg-gray-900 border-gray-800 text-gray-300 [&_button[aria-label=Close]]:text-gray-300"
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-gray-800">
          <Link
            href="/admin/dashboard"
            className="text-white font-bold text-base"
            onClick={() => setOpen(false)}
          >
            ⚙ {t.admin.panel}
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
          <NavLinks pathname={pathname} onNavigate={() => setOpen(false)} />
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            {t.admin.viewSite}
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
