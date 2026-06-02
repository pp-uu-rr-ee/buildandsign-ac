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
  const { t } = useLanguage();

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="h-10 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
        ))}
      </div>
    );
  }

  const available = slots.filter((s) => s.isAvailable);

  if (slots.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
        {t.booking.noSlotsDate}
      </p>
    );
  }

  if (available.length === 0) {
    return (
      <p className="text-sm text-orange-500 dark:text-orange-400 py-4 text-center">
        {t.booking.allBooked}
      </p>
    );
  }

  const uniqueSlots = Object.values(
    Object.fromEntries(available.map((s) => [s.startTime, s]))
  ).sort((a, b) => a.startTime.localeCompare(b.startTime));

  const isSelected = (slot: TimeSlot) =>
    selectedSlot?.startTime === slot.startTime &&
    selectedSlot?.technicianId === slot.technicianId;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {uniqueSlots.map((slot) => (
          <button
            key={`${slot.technicianId}-${slot.startTime}`}
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
        ))}
      </div>
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
