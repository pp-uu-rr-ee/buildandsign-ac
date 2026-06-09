"use client";

import type { TimeSlot } from "@/types";
import { Clock } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";

type Props = {
  slots: TimeSlot[];
  selectedSlot: TimeSlot | null;
  onSelect: (slot: TimeSlot) => void;
  isLoading: boolean;
};

export function SlotPicker({ slots, selectedSlot, onSelect, isLoading }: Props) {
  const { t, lang } = useLanguage();

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="h-10 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
        ))}
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
        {t.booking.noSlotsDate}
      </p>
    );
  }

  // For each unique startTime: prefer any available technician; fall back to a
  // booked slot so the time still renders (as a disabled gray button) instead
  // of disappearing entirely.
  const byTime = new Map<string, TimeSlot>();
  for (const slot of slots) {
    const existing = byTime.get(slot.startTime);
    if (!existing || (!existing.isAvailable && slot.isAvailable)) {
      byTime.set(slot.startTime, slot);
    }
  }
  const uniqueSlots = Array.from(byTime.values()).sort((a, b) =>
    a.startTime.localeCompare(b.startTime)
  );

  const availableCount = uniqueSlots.filter((s) => s.isAvailable).length;
  const bookedLabel = lang === "th" ? "ถูกจองแล้ว" : "Booked";

  const isSelected = (slot: TimeSlot) =>
    selectedSlot?.startTime === slot.startTime &&
    selectedSlot?.technicianId === slot.technicianId;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {uniqueSlots.map((slot) => {
          if (!slot.isAvailable) {
            return (
              <button
                key={slot.startTime}
                type="button"
                disabled
                aria-label={`${slot.startTime} — ${bookedLabel}`}
                title={bookedLabel}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border text-sm font-medium border-gray-200 bg-gray-100 text-gray-400 line-through cursor-not-allowed dark:border-gray-800 dark:bg-gray-900 dark:text-gray-600"
              >
                <Clock className="h-3.5 w-3.5 opacity-50" />
                {slot.startTime}
              </button>
            );
          }
          return (
            <button
              key={`${slot.technicianId}-${slot.startTime}`}
              type="button"
              onClick={() => onSelect(slot)}
              className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                isSelected(slot)
                  ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                  : "border-gray-200 text-gray-700 hover:border-blue-400 hover:bg-blue-50 dark:border-gray-700 dark:text-gray-200 dark:hover:border-blue-500 dark:hover:bg-blue-950/30"
              }`}
            >
              <Clock className="h-3.5 w-3.5 opacity-70" />
              {slot.startTime}
            </button>
          );
        })}
      </div>
      {availableCount === 0 && (
        <p className="text-sm text-orange-500 dark:text-orange-400 py-2 text-center">
          {t.booking.allBooked}
        </p>
      )}
      {selectedSlot && (
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          {t.booking.technicianLabel}{" "}
          <span className="font-medium">{selectedSlot.technicianName}</span>
          {" · "}{selectedSlot.startTime} – {selectedSlot.endTime}
        </p>
      )}
    </div>
  );
}
