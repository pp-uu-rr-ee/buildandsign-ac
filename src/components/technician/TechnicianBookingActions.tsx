"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Play, CheckCircle2, UserX, FileText } from "lucide-react";
import {
  updateBookingStatusByTechAction,
  updateBookingTechNotesAction,
} from "@/lib/actions/bookings";

interface Props {
  bookingId: string;
  currentStatus: string;
  currentNotes: string | null;
}

const NEXT_BUTTONS: Record<
  string,
  { status: string; label: string; color: string; icon: typeof Play }[]
> = {
  confirmed: [
    {
      status: "in_progress",
      label: "Start Job",
      color: "bg-purple-600 hover:bg-purple-700",
      icon: Play,
    },
    {
      status: "no_show",
      label: "No Show",
      color: "bg-red-600 hover:bg-red-700",
      icon: UserX,
    },
  ],
  in_progress: [
    {
      status: "completed",
      label: "Mark Complete",
      color: "bg-green-600 hover:bg-green-700",
      icon: CheckCircle2,
    },
  ],
};

export function TechnicianBookingActions({
  bookingId,
  currentStatus,
  currentNotes,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [notes, setNotes] = useState(currentNotes ?? "");

  const buttons = NEXT_BUTTONS[currentStatus] ?? [];
  const dirty = notes !== (currentNotes ?? "");

  const updateStatus = (status: string) =>
    startTransition(async () => {
      const res = await updateBookingStatusByTechAction(bookingId, status);
      if (res.success) {
        toast.success("Status updated");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });

  const saveNotes = () =>
    startTransition(async () => {
      const res = await updateBookingTechNotesAction(bookingId, notes);
      if (res.success) {
        toast.success("Notes saved");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });

  return (
    <div className="space-y-5">
      {/* Status actions */}
      {buttons.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Actions
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            {buttons.map((b) => {
              const Icon = b.icon;
              return (
                <button
                  key={b.status}
                  onClick={() => updateStatus(b.status)}
                  disabled={isPending}
                  className={`flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-60 transition-colors ${b.color}`}
                >
                  <Icon className="h-4 w-4" />
                  {b.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {(currentStatus === "completed" ||
        currentStatus === "cancelled" ||
        currentStatus === "no_show") && (
        <p className="text-xs text-gray-400 bg-gray-50 rounded-md px-3 py-2">
          This booking is closed. Status: <span className="font-semibold capitalize">{currentStatus.replace("_", " ")}</span>
        </p>
      )}

      {/* Notes */}
      <div>
        <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          <FileText className="h-3.5 w-3.5" />
          Technician Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={5}
          maxLength={2000}
          placeholder="Diagnosis, parts used, follow-up needed, photos taken…"
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
        />
        <div className="flex items-center justify-between mt-2">
          <p className="text-[11px] text-gray-400">
            {notes.length} / 2000
          </p>
          <button
            onClick={saveNotes}
            disabled={isPending || !dirty}
            className="px-4 py-1.5 rounded-md bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? "Saving…" : "Save Notes"}
          </button>
        </div>
      </div>
    </div>
  );
}
