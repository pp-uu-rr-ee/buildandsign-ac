"use client";

import { useState, useEffect, useActionState, useTransition } from "react";
import { BookingCalendar } from "./BookingCalendar";
import { SlotPicker } from "./SlotPicker";
import { createBookingAction } from "@/lib/actions/bookings";
import type { TimeSlot } from "@/types";
import type { ServiceId } from "@/config/services";
import type { BookingActionResult } from "@/lib/actions/bookings";
import { formatPrice } from "@/lib/helpers/price";

// Only serialisable fields — no icon function (can't cross server→client boundary)
type SerializableService = {
  id: ServiceId;
  title: string;
  tagline: string;
  durationMinutes: number;
  basePriceInCents: number;
  includes: string[];
};

type Props = { service: SerializableService };

const STEPS = ["Date & Time", "Your Details", "Review & Confirm"] as const;
type Step = 0 | 1 | 2;

const initialState: BookingActionResult = { success: true, bookingId: "" };

export function BookingWizard({ service }: Props) {
  const [step, setStep] = useState<Step>(0);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const [state, formAction, isPending] = useActionState(
    createBookingAction,
    initialState
  );

  // Fetch slots whenever date changes
  useEffect(() => {
    if (!selectedDate) return;
    setSelectedSlot(null);
    setSlots([]);
    setSlotsLoading(true);

    fetch(`/api/availability?serviceType=${service.id}&date=${selectedDate}&duration=${service.durationMinutes}`)
      .then((r) => r.json())
      .then((data: { slots: TimeSlot[] }) => setSlots(data.slots))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [selectedDate, service.id, service.durationMinutes]);

  const canProceedStep0 = selectedDate && selectedSlot;

  const fieldErrors =
    !state.success && state.fieldErrors ? state.fieldErrors : {};
  const globalError =
    !state.success && !state.fieldErrors ? state.error : null;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-10">
        {STEPS.map((label, i) => {
          const isActive = i === step;
          const isDone = i < step;
          return (
            <div key={label} className="flex items-center flex-1">
              <div className="flex items-center gap-2 shrink-0">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : isDone
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {isDone ? "✓" : i + 1}
                </div>
                <span
                  className={`text-sm font-medium hidden sm:block ${
                    isActive ? "text-blue-600" : "text-gray-400"
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-px mx-2 transition-colors ${
                    isDone ? "bg-green-400" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      <form action={formAction}>
        {/* Hidden fields always in the DOM */}
        <input type="hidden" name="serviceType" value={service.id} />
        <input type="hidden" name="durationMinutes" value={service.durationMinutes} />
        <input type="hidden" name="technicianId" value={selectedSlot?.technicianId ?? ""} />
        <input
          type="hidden"
          name="scheduledAt"
          value={
            selectedDate && selectedSlot
              ? `${selectedDate}T${selectedSlot.startTime}:00`
              : ""
          }
        />

        {/* ── STEP 0: Date & Time ── */}
        {step === 0 && (
          <div className="space-y-8">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Choose a date
              </h2>
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <BookingCalendar
                  selectedDate={selectedDate}
                  onSelect={setSelectedDate}
                />
              </div>
            </div>

            {selectedDate && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Choose a time slot
                </h2>
                <div className="rounded-xl border border-gray-200 bg-white p-5">
                  <SlotPicker
                    slots={slots}
                    selectedSlot={selectedSlot}
                    onSelect={setSelectedSlot}
                    isLoading={slotsLoading}
                  />
                </div>
              </div>
            )}

            <button
              type="button"
              disabled={!canProceedStep0}
              onClick={() => setStep(1)}
              className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Continue to Your Details →
            </button>
          </div>
        )}

        {/* ── STEP 1: Contact & Address ── */}
        {step === 1 && (
          <div className="space-y-6">
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Contact information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Full name" name="fullName" required error={fieldErrors.fullName?.[0]} />
                <Field label="Phone number" name="phone" type="tel" required error={fieldErrors.phone?.[0]} />
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Service address
              </h2>
              <div className="space-y-4">
                <Field label="Address line 1" name="addressLine1" required error={fieldErrors.addressLine1?.[0]} />
                <Field label="Address line 2 (unit, floor, landmark)" name="addressLine2" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field label="City" name="city" required error={fieldErrors.city?.[0]} />
                  <Field label="Province" name="province" required error={fieldErrors.province?.[0]} />
                  <Field label="Postal code" name="postalCode" required error={fieldErrors.postalCode?.[0]} />
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                AC unit details{" "}
                <span className="text-gray-400 font-normal text-base">(optional)</span>
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Helps the technician prepare the right tools and parts.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Brand" name="acBrand" placeholder="e.g. Daikin" />
                <Field label="Model" name="acModel" placeholder="e.g. FTXS35" />
                <Field label="Year installed" name="acYearInstalled" type="number" placeholder="e.g. 2020" />
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  AC type
                </label>
                <select
                  name="acType"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select type…</option>
                  <option value="split">Split Type</option>
                  <option value="window">Window Type</option>
                  <option value="portable">Portable</option>
                  <option value="cassette">Cassette</option>
                  <option value="central">Central / Ducted</option>
                </select>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional notes
                </label>
                <textarea
                  name="customerNotes"
                  rows={3}
                  placeholder="Describe any issues, location inside the property, or access instructions…"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                />
              </div>
            </section>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(0)}
                className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
              >
                Review Booking →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Review & Confirm ── */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Review your booking
            </h2>

            <div className="rounded-xl border border-gray-200 bg-gray-50 divide-y divide-gray-200">
              <Row label="Service" value={service.title} />
              <Row label="Date" value={new Date(selectedDate + "T12:00:00").toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} />
              <Row label="Time" value={`${selectedSlot?.startTime} – ${selectedSlot?.endTime}`} />
              <Row label="Technician" value={selectedSlot?.technicianName ?? "—"} />
              <Row label="Duration" value={`~${service.durationMinutes} minutes`} />
              <Row label="Starting price" value={formatPrice(service.basePriceInCents)} />
            </div>

            <p className="text-xs text-gray-400">
              Final price may vary based on actual findings. You will be quoted before any additional work begins.
            </p>

            {globalError && (
              <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {globalError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {isPending ? "Confirming…" : "Confirm Booking"}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
  error,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  error?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900 text-right">{value}</span>
    </div>
  );
}
