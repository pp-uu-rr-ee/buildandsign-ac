"use client";

import { useTransition, useState } from "react";
import { toast } from "sonner";
import { updateBookingStatusAction, assignTechnicianAction } from "@/lib/actions/admin";

const BOOKING_STATUSES = ["pending","confirmed","in_progress","completed","cancelled","no_show"];

type Props = {
  bookingId: string;
  currentStatus: string;
  currentTechnicianId: string;
  technicians: { id: string; name: string }[];
};

export function BookingStatusUpdater({ bookingId, currentStatus, currentTechnicianId, technicians }: Props) {
  const [isPending, startTransition] = useTransition();
  const [selectedTech, setSelectedTech] = useState(currentTechnicianId);

  const updateStatus = (status: string) =>
    startTransition(async () => {
      await updateBookingStatusAction(bookingId, status);
      toast.success("Booking status updated");
    });

  const assignTech = () => {
    if (!selectedTech) { toast.error("Select a technician first"); return; }
    startTransition(async () => {
      await assignTechnicianAction(bookingId, selectedTech);
      toast.success("Technician assigned — booking confirmed");
    });
  };

  return (
    <div className="rounded-xl border border-gray-200 p-5 space-y-5">
      <h2 className="font-semibold text-gray-900 text-sm">Manage Booking</h2>

      {/* Assign technician */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-2">Assign Technician</label>
        <div className="flex gap-2">
          <select
            value={selectedTech}
            onChange={(e) => setSelectedTech(e.target.value)}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Select technician…</option>
            {technicians.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <button
            onClick={assignTech}
            disabled={isPending || !selectedTech || selectedTech === currentTechnicianId}
            className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Assign
          </button>
        </div>
      </div>

      {/* Status buttons */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-2">Booking Status</label>
        <div className="flex flex-wrap gap-1.5">
          {BOOKING_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => updateStatus(s)}
              disabled={isPending || s === currentStatus}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                s === currentStatus
                  ? "bg-blue-600 text-white cursor-default"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40"
              }`}
            >
              {s.replace("_"," ")}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
