import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { getCustomerStats } from "@/lib/queries/account";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { User, ShoppingBag, CalendarCheck, ArrowRight } from "lucide-react";
import { LogoutButton } from "@/components/account/LogoutButton";
import { ProfileForm } from "@/components/account/ProfileForm";

export const metadata = { title: "My Account" };

export default async function AccountPage() {
  const session = await getSession();
  if (!session) redirect("/login?callbackUrl=/account");

  const [{ totalOrders, totalBookings }, [account]] = await Promise.all([
    getCustomerStats(session.userId),
    db
      .select({ name: users.name, email: users.email, phone: users.phone })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1),
  ]);

  if (!account) redirect("/login");

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2 dark:text-gray-50">My Account</h1>
      <p className="text-gray-500 mb-10 dark:text-gray-400">Welcome back, {session.name}.</p>

      {/* Profile card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 mb-6 flex items-center gap-5 dark:border-gray-800 dark:bg-gray-900">
        <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center shrink-0 dark:bg-blue-950/50">
          <User className="h-7 w-7 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-lg truncate dark:text-gray-100">{account.name}</p>
          <p className="text-gray-500 text-sm truncate dark:text-gray-400">{account.email}</p>
        </div>
      </div>

      {/* Editable contact details */}
      <div className="mb-6">
        <ProfileForm name={account.name} email={account.email} phone={account.phone} />
      </div>

      {/* Stats + quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Link
          href="/orders"
          className="group rounded-2xl border border-gray-200 bg-white p-6 hover:border-blue-300 hover:shadow-sm transition-all dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-700"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-600 transition-colors dark:bg-blue-950/50">
              <ShoppingBag className="h-5 w-5 text-blue-600 group-hover:text-white transition-colors dark:text-blue-400" />
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors dark:text-gray-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{totalOrders}</p>
          <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">Total Orders</p>
        </Link>

        <Link
          href="/bookings"
          className="group rounded-2xl border border-gray-200 bg-white p-6 hover:border-green-300 hover:shadow-sm transition-all dark:border-gray-800 dark:bg-gray-900 dark:hover:border-green-700"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center group-hover:bg-green-600 transition-colors dark:bg-green-950/40">
              <CalendarCheck className="h-5 w-5 text-green-600 group-hover:text-white transition-colors dark:text-green-400" />
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-green-600 transition-colors dark:text-gray-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{totalBookings}</p>
          <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">Service Bookings</p>
        </Link>
      </div>

      {/* Quick actions */}
      <div className="rounded-2xl border border-gray-200 bg-white divide-y divide-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:divide-gray-800">
        {[
          { href: "/orders", label: "View my orders", icon: ShoppingBag },
          { href: "/bookings", label: "View my bookings", icon: CalendarCheck },
          { href: "/products", label: "Shop AC units", icon: ShoppingBag },
          { href: "/services", label: "Book a service", icon: CalendarCheck },
        ].map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors group dark:hover:bg-gray-800"
          >
            <div className="flex items-center gap-3 text-gray-700 group-hover:text-gray-900 dark:text-gray-300 dark:group-hover:text-gray-100">
              <Icon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              <span className="text-sm font-medium">{label}</span>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors dark:text-gray-600 dark:group-hover:text-gray-400" />
          </Link>
        ))}
        <LogoutButton />
      </div>
    </div>
  );
}
