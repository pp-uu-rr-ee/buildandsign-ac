"use client";

import { useState, useTransition } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  selectedDate: string; // "YYYY-MM-DD"
  onSelect: (date: string) => void;
};

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function BookingCalendar({ selectedDate, onSelect }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewDate, setViewDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 60); // allow booking up to 60 days ahead

  const prevMonth = () =>
    setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () =>
    setViewDate(new Date(year, month + 1, 1));

  const isPrevDisabled =
    year === today.getFullYear() && month === today.getMonth();

  return (
    <div className="select-none">
      {/* Month header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          disabled={isPrevDisabled}
          className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <p className="font-semibold text-gray-900">
          {viewDate.toLocaleString("en-PH", { month: "long", year: "numeric" })}
        </p>
        <button
          onClick={nextMonth}
          className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((d) => (
          <div
            key={d}
            className={`text-center text-xs font-medium py-1 ${
              d === "Sun" ? "text-red-400" : "text-gray-400"
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-1">
        {/* Empty cells before first day */}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const d = new Date(year, month, day);
          const dateStr = formatDate(d);
          const isSunday = d.getDay() === 0;
          const isPast = d < today;
          const isTooFar = d > maxDate;
          const isDisabled = isPast || isTooFar || isSunday;
          const isSelected = dateStr === selectedDate;
          const isToday = formatDate(d) === formatDate(today);

          return (
            <button
              key={day}
              onClick={() => !isDisabled && onSelect(dateStr)}
              disabled={isDisabled}
              className={`
                relative flex items-center justify-center h-9 w-full rounded-lg text-sm font-medium transition-colors
                ${isSelected ? "bg-blue-600 text-white" : ""}
                ${!isSelected && !isDisabled ? "hover:bg-blue-50 text-gray-700" : ""}
                ${isDisabled ? "text-gray-300 cursor-not-allowed" : ""}
                ${isToday && !isSelected ? "ring-1 ring-blue-400 text-blue-600" : ""}
              `}
            >
              {day}
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-gray-400 text-center">
        Sundays unavailable · Up to 60 days in advance
      </p>
    </div>
  );
}
