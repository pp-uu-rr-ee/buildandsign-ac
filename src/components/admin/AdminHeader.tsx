import { Bell } from "lucide-react";
import { getSession } from "@/lib/session";
import { UserMenu } from "@/components/layout/UserMenu";
import { AdminMobileNav } from "@/components/admin/AdminSidebar";

export async function AdminHeader() {
  const session = await getSession();
  if (!session) return null;

  return (
    <header className="h-16 flex items-center justify-between gap-3 px-4 sm:px-6 border-b border-gray-200 bg-white shrink-0">
      <div className="flex items-center gap-2">
        <AdminMobileNav />
        {/* Mobile brand label — hidden on desktop because the sidebar shows it */}
        <span className="lg:hidden text-sm font-bold text-gray-900">⚙ Admin</span>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors relative"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>
        <UserMenu user={session} />
      </div>
    </header>
  );
}
