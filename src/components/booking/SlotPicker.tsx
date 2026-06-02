"use client";

import type { TimeSlot } from "@/types";
import { Clock } from "lucide-react";

type Props = {
  slots: TimeSlot[];
  selectedSlot: TimeSlot | null;
  onSelect: (slot: TimeSlot) => void;
  isLoading: boolean;
};

export function SlotPicker({ slots, selectedSlot, onSelect, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="h-10 rounded-lg bg-gray-100 animate-pulse"
          />
        ))}
      </div>
    );
  }

  const available = slots.filter((s) => s.isAvailable);

  if (slots.length === 0) {
    return (
      <p className="text-sm text-gray-500 py-4 text-center">
        No slots available for this date. Please choose another day.
      </p>
    );
  }

  if (available.length === 0) {
    return (
      <p className="text-sm text-orange-500 py-4 text-center">
        All slots are fully booked for this date. Please choose another day.
      </p>
    );
  }

  // Deduplicate by start time — show earliest available technician per slot
  const uniqueSlots = Object.values(
    Object.fromEntries(
      available.map((s) => [s.startTime, s])
    )
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
                : "border-gray-200 text-gray-700 hover:border-blue-400 hover:bg-blue-50"
            }`}
          >
            <Clock className="h-3.5 w-3.5 opacity-70" />
            {slot.startTime}
          </button>
        ))}
      </div>
      {selectedSlot && (
        <p className="text-xs text-gray-500 text-center">
          Technician: <span className="font-medium">{selectedSlot.technicianName}</span>
          {" · "}{selectedSlot.startTime} – {selectedSlot.endTime}
        </p>
      )}
    </div>
  );
}
