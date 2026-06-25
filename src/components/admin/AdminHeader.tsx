import { getSession } from "@/lib/session";
import { getTodayNotifications } from "@/lib/queries/admin";
import { UserMenu } from "@/components/layout/UserMenu";
import { AdminMobileNav } from "@/components/admin/AdminSidebar";
import { NotificationBell } from "@/components/admin/NotificationBell";

export async function AdminHeader() {
  const session = await getSession();
  if (!session) return null;

  const notifications = await getTodayNotifications();

  return (
    <header className="h-16 flex items-center justify-between gap-3 px-4 sm:px-6 border-b border-gray-200 bg-white shrink-0">
      <div className="flex items-center gap-2">
        <AdminMobileNav />
        {/* Mobile brand label — hidden on desktop because the sidebar shows it */}
        <span className="lg:hidden text-sm font-bold text-gray-900">⚙ Admin</span>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <NotificationBell items={notifications} />
        <UserMenu user={session} />
      </div>
    </header>
  );
}
