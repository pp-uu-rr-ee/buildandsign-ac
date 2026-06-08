import { redirect } from "next/navigation";
import {
  getCalendarBookings,
  getTechnicianIdForUser,
} from "@/lib/queries/admin";
import { BookingCalendar } from "@/components/admin/BookingCalendar";
import { getSession } from "@/lib/session";

export const metadata = { title: "My Calendar | Technician" };

type SP = { month?: string };

function parseMonth(input: string | undefined): Date {
  if (input) {
    const m = /^(\d{4})-(\d{1,2})$/.exec(input);
    if (m) {
      const year = Number(m[1]);
      const month = Number(m[2]) - 1;
      if (month >= 0 && month <= 11) return new Date(year, month, 1);
    }
  }
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export default async function TechnicianCalendarPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const session = await getSession();
  if (!session || session.role !== "technician") redirect("/login");

  const technicianId = await getTechnicianIdForUser(session.userId);
  if (!technicianId) {
    return (
      <div className="max-w-md mx-auto mt-12 rounded-xl border border-orange-200 bg-orange-50 p-6 text-center">
        <p className="font-semibold text-orange-700 mb-1">
          No technician profile
        </p>
        <p className="text-sm text-orange-600">
          Your account is marked as a technician but no profile is linked.
          Please contact the administrator.
        </p>
      </div>
    );
  }

  const sp = await searchParams;
  const monthStart = parseMonth(sp.month);

  const gridStart = new Date(monthStart);
  gridStart.setDate(1 - monthStart.getDay());
  gridStart.setHours(0, 0, 0, 0);

  const gridEnd = new Date(gridStart);
  gridEnd.setDate(gridEnd.getDate() + 42);

  const bookings = await getCalendarBookings({
    start: gridStart,
    end: gridEnd,
    technicianId,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          My Calendar
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Your scheduled jobs. Hover a day to see customer details.
        </p>
      </div>

      <BookingCalendar
        monthStart={monthStart}
        bookings={bookings}
        mode="technician"
      />
    </div>
  );
}
