import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { logoutAction } from "@/lib/actions/auth";
import { getSession } from "@/lib/session";

export default async function TechnicianLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();

  // Hard guard — middleware is primary but this is defense-in-depth.
  if (!session || session.role !== "technician") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="h-16 flex items-center justify-between px-4 sm:px-6 border-b border-gray-200 bg-white shrink-0">
        <Link
          href="/technician/calendar"
          className="flex items-center gap-2 font-bold text-blue-600 text-lg shrink-0"
        >
          <svg
            className="h-6 w-6"
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
          <span className="hidden sm:block">Technician Portal</span>
        </Link>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-gray-900 leading-tight">
              {session.name}
            </p>
            <p className="text-xs text-gray-400">{session.email}</p>
          </div>
          <div className="h-9 w-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
            {session.name.charAt(0).toUpperCase()}
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6">{children}</main>
    </div>
  );
}
