"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";

type Props = {
  selectedDate: string;
  onSelect: (date: string) => void;
};

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function BookingCalendar({ selectedDate, onSelect }: Props) {
  const { t, lang } = useLanguage();
  const locale = lang === "th" ? "th-TH" : "en-US";
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Same-day booking isn't allowed — the earliest bookable day is tomorrow.
  const minDate = new Date(today);
  minDate.setDate(minDate.getDate() + 1);

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
  maxDate.setDate(maxDate.getDate() + 60);

  const isPrevDisabled = year === today.getFullYear() && month === today.getMonth();

  return (
    <div className="select-none">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setViewDate(new Date(year, month - 1, 1))}
          disabled={isPrevDisabled}
          className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <p className="font-semibold text-gray-900 dark:text-gray-100">
          {viewDate.toLocaleString(locale, { month: "long", year: "numeric" })}
        </p>
        <button
          onClick={() => setViewDate(new Date(year, month + 1, 1))}
          className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {t.booking.calendarDays.map((d, i) => (
          <div
            key={d}
            className={`text-center text-xs font-medium py-1 ${
              i === 0 ? "text-red-400" : "text-gray-400 dark:text-gray-500"
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const d = new Date(year, month, day);
          const dateStr = formatDate(d);
          const isPast = d < minDate; // today and earlier are not bookable
          const isTooFar = d > maxDate;
          const isDisabled = isPast || isTooFar;
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
                ${!isSelected && !isDisabled ? "hover:bg-blue-50 dark:hover:bg-blue-950/40 text-gray-700 dark:text-gray-200" : ""}
                ${isDisabled ? "text-gray-300 dark:text-gray-700 cursor-not-allowed" : ""}
                ${isToday && !isSelected && !isDisabled ? "ring-1 ring-blue-400 text-blue-600 dark:text-blue-400" : ""}
              `}
            >
              {day}
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-gray-400 dark:text-gray-500 text-center">
        {t.booking.noSlotsDate.split(".")[0]} · Up to 60 days in advance
      </p>
    </div>
  );
}
