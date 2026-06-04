"use client";

import { useState, useEffect, useActionState } from "react";
import { BookingCalendar } from "./BookingCalendar";
import { SlotPicker } from "./SlotPicker";
import { createBookingAction } from "@/lib/actions/bookings";
import { useLanguage } from "@/components/providers/LanguageProvider";
import type { TimeSlot } from "@/types";
import type { ServiceId } from "@/config/services";
import type { BookingActionResult } from "@/lib/actions/bookings";
import { formatPrice } from "@/lib/helpers/price";

type SerializableService = {
  id: ServiceId;
  title: string;
  tagline: string;
  durationMinutes: number;
  basePriceInSatang: number;
  includes: string[];
};

type Props = { service: SerializableService };

const initialState: BookingActionResult = { success: true, bookingId: "" };

export function BookingWizard({ service }: Props) {
  const { t } = useLanguage();
  const STEPS = [t.booking.stepDateTime, t.booking.stepDetails, t.booking.stepReview] as const;

  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const [state, formAction, isPending] = useActionState(createBookingAction, initialState);

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
  const fieldErrors = !state.success && state.fieldErrors ? state.fieldErrors : {};
  const globalError = !state.success && !state.fieldErrors ? state.error : null;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-10">
        {STEPS.map((label, i) => {
          const isActive = i === step;
          const isDone = i < step;
          return (
            <div key={i} className="flex items-center flex-1">
              <div className="flex items-center gap-2 shrink-0">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    isActive ? "bg-blue-600 text-white"
                    : isDone ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                  }`}
                >
                  {isDone ? "✓" : i + 1}
                </div>
                <span className={`text-sm font-medium hidden sm:block ${isActive ? "text-blue-600" : "text-gray-400 dark:text-gray-500"}`}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px mx-2 transition-colors ${isDone ? "bg-green-400" : "bg-gray-200 dark:bg-gray-700"}`} />
              )}
            </div>
          );
        })}
      </div>

      <form action={formAction}>
        <input type="hidden" name="serviceType" value={service.id} />
        <input type="hidden" name="durationMinutes" value={service.durationMinutes} />
        <input type="hidden" name="technicianId" value={selectedSlot?.technicianId ?? ""} />
        <input
          type="hidden"
          name="scheduledAt"
          value={selectedDate && selectedSlot ? `${selectedDate}T${selectedSlot.startTime}:00` : ""}
        />

        {/* STEP 0: Date & Time */}
        <div className={step === 0 ? "space-y-8" : "hidden"}>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 dark:text-gray-100">{t.booking.chooseDate}</h2>
            <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
              <BookingCalendar selectedDate={selectedDate} onSelect={setSelectedDate} />
            </div>
          </div>
          {selectedDate && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 dark:text-gray-100">{t.booking.chooseSlot}</h2>
              <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
                <SlotPicker slots={slots} selectedSlot={selectedSlot} onSelect={setSelectedSlot} isLoading={slotsLoading} />
              </div>
            </div>
          )}
          <button
            type="button"
            disabled={!canProceedStep0}
            onClick={() => setStep(1)}
            className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {t.booking.continueDetails}
          </button>
        </div>

        {/* STEP 1: Contact & Address — hidden with CSS, NOT removed from DOM */}
        <div className={step === 1 ? "space-y-6" : "hidden"}>
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 dark:text-gray-100">{t.booking.contactInfo}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={t.booking.fullName} name="fullName" required error={fieldErrors.fullName?.[0]} />
              <Field label={t.booking.phone} name="phone" type="tel" required error={fieldErrors.phone?.[0]} />
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 dark:text-gray-100">{t.booking.serviceAddress}</h2>
            <div className="space-y-4">
              <Field label={t.booking.addressLine1} name="addressLine1" required error={fieldErrors.addressLine1?.[0]} />
              <Field label={t.booking.addressLine2} name="addressLine2" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label={t.booking.city} name="city" required error={fieldErrors.city?.[0]} />
                <Field label={t.booking.province} name="province" required error={fieldErrors.province?.[0]} />
                <Field label={t.booking.postalCode} name="postalCode" required error={fieldErrors.postalCode?.[0]} />
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-1 dark:text-gray-100">
              {t.booking.acDetails}{" "}
              <span className="text-gray-400 font-normal text-base">{t.booking.acDetailsOptional}</span>
            </h2>
            <p className="text-sm text-gray-500 mb-4 dark:text-gray-400">{t.booking.acDetailsHint}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label={t.booking.brand} name="acBrand" placeholder={t.booking.brandPlaceholder} />
              <Field label={t.booking.model} name="acModel" placeholder={t.booking.modelPlaceholder} />
              <Field label={t.booking.yearInstalled} name="acYearInstalled" type="number" placeholder={t.booking.yearPlaceholder} />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                {t.booking.acType}
              </label>
              <select
                name="acType"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              >
                <option value="">{t.booking.selectType}</option>
                <option value="split">{t.booking.splitType}</option>
                <option value="window">{t.booking.windowType}</option>
                <option value="portable">{t.booking.portable}</option>
                <option value="cassette">{t.booking.cassette}</option>
                <option value="central">{t.booking.central}</option>
              </select>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                {t.booking.notes}
              </label>
              <textarea
                name="customerNotes"
                rows={3}
                placeholder={t.booking.notesPlaceholder}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              />
            </div>
          </section>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(0)}
              className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              {t.booking.back}
            </button>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
            >
              {t.booking.reviewBooking}
            </button>
          </div>
        </div>

        {/* STEP 2: Review & Confirm */}
        <div className={step === 2 ? "space-y-6" : "hidden"}>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t.booking.reviewTitle}</h2>

          <div className="rounded-xl border border-gray-200 bg-gray-50 divide-y divide-gray-200 dark:border-gray-700 dark:bg-gray-800/50 dark:divide-gray-700">
            <Row label={t.booking.rowService} value={service.title} />
            <Row
              label={t.booking.rowDate}
              value={new Date(selectedDate + "T12:00:00").toLocaleDateString("en-PH", {
                weekday: "long", year: "numeric", month: "long", day: "numeric",
              })}
            />
            <Row label={t.booking.rowTime} value={`${selectedSlot?.startTime} – ${selectedSlot?.endTime}`} />
            <Row label={t.booking.rowTechnician} value={selectedSlot?.technicianName ?? "—"} />
            <Row label={t.booking.rowDuration} value={t.booking.durationValue(service.durationMinutes)} />
            <Row label={t.booking.rowStartingPrice} value={formatPrice(service.basePriceInSatang)} />
          </div>

          <p className="text-xs text-gray-400 dark:text-gray-500">{t.booking.priceDisclaimer}</p>

          {globalError && (
            <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400">
              {globalError}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              {t.booking.back}
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? t.booking.confirming : t.booking.confirmBooking}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function Field({
  label, name, type = "text", required, placeholder, error, defaultValue,
}: {
  label: string; name: string; type?: string; required?: boolean;
  placeholder?: string; error?: string; defaultValue?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={name} name={name} type={type} placeholder={placeholder}
        defaultValue={defaultValue}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 text-sm">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className="font-medium text-gray-900 text-right dark:text-gray-100">{value}</span>
    </div>
  );
}
