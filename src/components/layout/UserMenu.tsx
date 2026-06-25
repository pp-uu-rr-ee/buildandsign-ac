"use client";

import Link from "next/link";
import { LogOut, User, Package, CalendarCheck, LayoutDashboard, Languages } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logoutAction } from "@/lib/actions/auth";
import { useLanguage } from "@/components/providers/LanguageProvider";
import type { SessionPayload } from "@/lib/session";

export function UserMenu({ user }: { user: SessionPayload }) {
  const { lang, t, toggle: toggleLang } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-blue-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">
        <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <span className="hidden sm:block max-w-[120px] truncate">
          {user.name}
        </span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <p className="text-sm font-semibold truncate">{user.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Language toggle */}
        <DropdownMenuItem className="p-0">
          <button
            type="button"
            onClick={toggleLang}
            className="flex w-full items-center justify-between gap-2 px-2 py-1.5 text-sm"
          >
            <span className="flex items-center gap-2">
              <Languages className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              {t.nav.language}
            </span>
            <span className="text-xs font-semibold tracking-wide bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">
              {lang === "en" ? "EN" : "TH"}
            </span>
          </button>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {user.role === "admin" && (
          <DropdownMenuItem>
            <Link href="/admin/dashboard" className="flex items-center gap-2 w-full">
              <LayoutDashboard className="h-4 w-4" />
              {t.nav.adminDashboard}
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem>
          <Link href="/orders" className="flex items-center gap-2 w-full">
            <Package className="h-4 w-4" />
            {t.nav.myOrders}
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem>
          <Link href="/bookings" className="flex items-center gap-2 w-full">
            <CalendarCheck className="h-4 w-4" />
            {t.nav.myBookings}
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem>
          <Link href="/account" className="flex items-center gap-2 w-full">
            <User className="h-4 w-4" />
            {t.nav.accountSettings}
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem className="p-0">
          <form action={logoutAction} className="w-full">
            <button
              type="submit"
              className="flex w-full items-center gap-2 px-1.5 py-1 text-red-600 text-sm"
            >
              <LogOut className="h-4 w-4" />
              {t.nav.signOut}
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
