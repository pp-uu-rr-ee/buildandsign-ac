import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getSession();

  // Double-check in layout (middleware is the main guard, but this prevents
  // accidental access if middleware matcher is ever misconfigured)
  if (!session || session.role !== "admin") {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
