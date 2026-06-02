"use client";

import Link from "next/link";
import { LogOut, User, Package, CalendarCheck, LayoutDashboard } from "lucide-react";
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
import type { SessionPayload } from "@/lib/session";

export function UserMenu({ user }: { user: SessionPayload }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-blue-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1">
        <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <span className="hidden sm:block max-w-[120px] truncate">
          {user.name}
        </span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <p className="text-sm font-semibold truncate">{user.name}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {user.role === "admin" && (
          <DropdownMenuItem>
            <Link href="/admin/dashboard" className="flex items-center gap-2 w-full">
              <LayoutDashboard className="h-4 w-4" />
              Admin Dashboard
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem>
          <Link href="/orders" className="flex items-center gap-2 w-full">
            <Package className="h-4 w-4" />
            My Orders
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem>
          <Link href="/bookings" className="flex items-center gap-2 w-full">
            <CalendarCheck className="h-4 w-4" />
            My Bookings
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem>
          <Link href="/account" className="flex items-center gap-2 w-full">
            <User className="h-4 w-4" />
            Account Settings
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
              Sign out
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
