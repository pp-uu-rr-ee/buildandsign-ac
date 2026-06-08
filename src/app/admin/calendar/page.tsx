import { getCalendarBookings } from "@/lib/queries/admin";
import { BookingCalendar } from "@/components/admin/BookingCalendar";

export const metadata = { title: "Calendar | Admin" };

type SP = { month?: string };

/**
 * Returns the first day of the month (local) for a "YYYY-MM" string,
 * falling back to the current month.
 */
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

export default async function AdminCalendarPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const monthStart = parseMonth(sp.month);

  // Fetch a 6-week window so the grid edges are populated.
  const gridStart = new Date(monthStart);
  gridStart.setDate(1 - monthStart.getDay());
  gridStart.setHours(0, 0, 0, 0);

  const gridEnd = new Date(gridStart);
  gridEnd.setDate(gridEnd.getDate() + 42);

  const bookings = await getCalendarBookings({
    start: gridStart,
    end: gridEnd,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Calendar</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          All scheduled bookings across technicians. Hover a day to see details.
        </p>
      </div>

      <BookingCalendar
        monthStart={monthStart}
        bookings={bookings}
        mode="admin"
      />
    </div>
  );
}
