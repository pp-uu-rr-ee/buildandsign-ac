"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Phone,
  Star,
  Wrench,
  Sparkles,
  Package,
  ClipboardCheck,
} from "lucide-react";
import type { CalendarBooking } from "@/lib/queries/admin";

type Mode = "admin" | "technician";

interface Props {
  /** First day of the month being displayed (00:00 local). */
  monthStart: Date;
  bookings: CalendarBooking[];
  mode: Mode;
}

const WEEKDAYS_TH = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
const WEEKDAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const SERVICE_ICONS = {
  cleaning: Sparkles,
  repair: Wrench,
  installation: Package,
  inspection: ClipboardCheck,
} as const;

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  confirmed: "bg-blue-100 text-blue-700 border-blue-200",
  in_progress: "bg-purple-100 text-purple-700 border-purple-200",
  completed: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-gray-100 text-gray-500 border-gray-200",
  no_show: "bg-red-100 text-red-700 border-red-200",
};

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function monthLabel(d: Date) {
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function BookingCalendar({ monthStart, bookings, mode }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  // ── Build the calendar grid ────────────────────────────────────────────────
  const cells = useMemo(() => {
    const first = new Date(monthStart);
    first.setDate(1);
    first.setHours(0, 0, 0, 0);
    const startOffset = first.getDay(); // 0 = Sun
    const gridStart = new Date(first);
    gridStart.setDate(1 - startOffset);

    // Render 6 weeks (42 cells) for consistent height
    const cells: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      cells.push(d);
    }
    return cells;
  }, [monthStart]);

  const grouped = useMemo(() => {
    const map = new Map<string, CalendarBooking[]>();
    for (const b of bookings) {
      const key = ymd(new Date(b.scheduledAt));
      const arr = map.get(key) ?? [];
      arr.push(b);
      map.set(key, arr);
    }
    return map;
  }, [bookings]);

  const todayKey = ymd(new Date());
  const currentMonth = monthStart.getMonth();

  const goToMonth = (delta: number) => {
    const next = new Date(monthStart);
    next.setMonth(next.getMonth() + delta);
    const param = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", param);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-lg font-semibold text-gray-900">
          {monthLabel(monthStart)}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => goToMonth(-1)}
            className="p-2 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4 text-gray-600" />
          </button>
          <button
            onClick={() => {
              const today = new Date();
              const param = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
              const params = new URLSearchParams(searchParams.toString());
              params.set("month", param);
              router.push(`?${params.toString()}`, { scroll: false });
            }}
            className="px-3 py-2 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors text-xs font-medium text-gray-600"
          >
            Today
          </button>
          <button
            onClick={() => goToMonth(1)}
            className="p-2 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-blue-500" />
          Has booking
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded border-2 border-blue-500 bg-white" />
          Today
        </span>
      </div>

      {/* Grid */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
          {WEEKDAYS_EN.map((d, i) => (
            <div
              key={d}
              className="px-2 py-2 text-center text-xs font-semibold text-gray-500 uppercase"
            >
              <span className="hidden sm:inline">{d}</span>
              <span className="sm:hidden">{WEEKDAYS_TH[i]}</span>
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {cells.map((d) => {
            const key = ymd(d);
            const inMonth = d.getMonth() === currentMonth;
            const isToday = key === todayKey;
            const dayBookings = grouped.get(key) ?? [];
            const hasBookings = dayBookings.length > 0;
            const isHovered = hoveredDay === key;

            return (
              <div
                key={key}
                className="relative min-h-[88px] sm:min-h-[112px] border-r border-b border-gray-100 last:border-r-0 [&:nth-child(7n)]:border-r-0"
                onMouseEnter={() => hasBookings && setHoveredDay(key)}
                onMouseLeave={() => setHoveredDay(null)}
              >
                <DayCell
                  day={d}
                  inMonth={inMonth}
                  isToday={isToday}
                  bookings={dayBookings}
                  mode={mode}
                  onTap={() => {
                    // Mobile tap → toggle popup
                    setHoveredDay((cur) => (cur === key ? null : key));
                  }}
                />
                {isHovered && hasBookings && (
                  <DayPopup
                    bookings={dayBookings}
                    mode={mode}
                    onClose={() => setHoveredDay(null)}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Cell ───────────────────────────────────────────────────────────────────

function DayCell({
  day,
  inMonth,
  isToday,
  bookings,
  mode,
  onTap,
}: {
  day: Date;
  inMonth: boolean;
  isToday: boolean;
  bookings: CalendarBooking[];
  mode: Mode;
  onTap: () => void;
}) {
  const count = bookings.length;
  const hasBookings = count > 0;

  // Color intensity based on booking count
  const bgClass = !hasBookings
    ? ""
    : count >= 5
      ? "bg-blue-200 hover:bg-blue-300"
      : count >= 3
        ? "bg-blue-100 hover:bg-blue-200"
        : "bg-blue-50 hover:bg-blue-100";

  return (
    <button
      type="button"
      onClick={onTap}
      className={`absolute inset-0 flex flex-col items-stretch p-1.5 sm:p-2 text-left transition-colors ${bgClass} ${
        !inMonth ? "opacity-40" : ""
      } ${isToday ? "ring-2 ring-blue-500 ring-inset" : ""}`}
    >
      <div className="flex items-center justify-between">
        <span
          className={`text-xs sm:text-sm font-semibold ${
            isToday
              ? "text-blue-600"
              : inMonth
                ? "text-gray-900"
                : "text-gray-400"
          }`}
        >
          {day.getDate()}
        </span>
        {hasBookings && (
          <span className="px-1.5 h-5 min-w-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
            {count}
          </span>
        )}
      </div>

      {/* Brief preview — only on >=sm */}
      <div className="mt-1 space-y-0.5 hidden sm:block overflow-hidden">
        {bookings.slice(0, 2).map((b) => {
          const time = new Date(b.scheduledAt).toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          });
          const label =
            mode === "admin"
              ? b.technicianName ?? "Unassigned"
              : b.customerName;
          return (
            <div
              key={b.id}
              className="text-[10px] leading-tight text-gray-700 truncate"
            >
              <span className="font-mono mr-1">{time}</span>
              {label}
            </div>
          );
        })}
        {bookings.length > 2 && (
          <div className="text-[10px] text-blue-600 font-medium">
            +{bookings.length - 2} more
          </div>
        )}
      </div>
    </button>
  );
}

// ─── Popup ──────────────────────────────────────────────────────────────────

function DayPopup({
  bookings,
  mode,
  onClose,
}: {
  bookings: CalendarBooking[];
  mode: Mode;
  onClose: () => void;
}) {
  return (
    <div
      className="absolute z-30 top-full left-1/2 -translate-x-1/2 mt-1 w-72 sm:w-80 rounded-xl border border-gray-200 bg-white shadow-2xl p-3 space-y-2.5 max-h-96 overflow-y-auto"
      onMouseLeave={onClose}
    >
      {bookings.slice(0, 6).map((b) => (
        <BookingCard key={b.id} booking={b} mode={mode} />
      ))}
      {bookings.length > 6 && (
        <p className="text-xs text-gray-400 text-center pt-1">
          +{bookings.length - 6} more bookings on this day
        </p>
      )}
    </div>
  );
}

function BookingCard({
  booking: b,
  mode,
}: {
  booking: CalendarBooking;
  mode: Mode;
}) {
  const ServiceIcon =
    SERVICE_ICONS[b.serviceType as keyof typeof SERVICE_ICONS] ?? Wrench;
  const time = new Date(b.scheduledAt).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const detailHref =
    mode === "admin"
      ? `/admin/bookings/${b.id}`
      : `/technician/bookings/${b.id}`;

  return (
    <Link
      href={detailHref}
      className="block rounded-lg border border-gray-100 p-2.5 hover:border-blue-300 hover:bg-blue-50/40 transition-colors"
    >
      <div className="flex items-start gap-2">
        <div className="h-8 w-8 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
          <ServiceIcon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-gray-900 capitalize truncate">
              {b.serviceType}
            </p>
            <span className="text-xs font-mono text-gray-500 shrink-0">
              {time}
            </span>
          </div>
          <p className="text-xs text-gray-500 truncate">
            {mode === "admin" ? b.customerName : b.customerName} ·{" "}
            {b.customerCity}
          </p>
          <span
            className={`mt-1 inline-block px-1.5 py-0.5 rounded text-[10px] font-medium border capitalize ${STATUS_COLORS[b.status] ?? STATUS_COLORS.confirmed}`}
          >
            {b.status.replace("_", " ")}
          </span>

          {/* Technician card — admin mode */}
          {mode === "admin" && b.technicianName && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-gray-700">
                  👷 {b.technicianName}
                </p>
                {b.technicianRating != null &&
                  (b.technicianTotalRatings ?? 0) > 0 && (
                    <span className="flex items-center gap-0.5 text-xs text-yellow-600">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {(b.technicianRating / 10).toFixed(1)}
                    </span>
                  )}
              </div>
              {b.technicianPhone && (
                <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                  <Phone className="h-3 w-3" />
                  {b.technicianPhone}
                </p>
              )}
              {b.technicianSpecializations &&
                b.technicianSpecializations.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {b.technicianSpecializations.slice(0, 3).map((s) => (
                      <span
                        key={s}
                        className="px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] capitalize"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
            </div>
          )}

          {mode === "admin" && !b.technicianName && (
            <p className="mt-1 text-[10px] font-medium text-orange-500">
              ⚠ Unassigned
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
