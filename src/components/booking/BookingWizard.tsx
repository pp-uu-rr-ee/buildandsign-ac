"use client";

import { useState, useEffect, useActionState, useRef, startTransition } from "react";
import { Plus, Trash2, AirVent } from "lucide-react";
import { BookingCalendar } from "./BookingCalendar";
import { SlotPicker } from "./SlotPicker";
import { createBookingAction } from "@/lib/actions/bookings";
import { useLanguage } from "@/components/providers/LanguageProvider";
import type { TimeSlot } from "@/types";
import type { ServiceId, ServiceGroup } from "@/config/services";
import type { BookingActionResult } from "@/lib/actions/bookings";

type SerializableService = {
  id: ServiceId;
  title: string;
  tagline: string;
  durationMinutes: number;
  basePriceInSatang: number;
  includes: string[];
  group: ServiceGroup;
};

type Props = {
  service: SerializableService;
};

const initialState: BookingActionResult = { success: true, bookingId: "" };

type Unit = {
  brand: string;
  btu: number | "";
  type: string;
  quantity: number;
};

const blankUnit: Unit = { brand: "", btu: "", type: "split", quantity: 1 };

const UNIT_TYPES = [
  { value: "split", label: "Split / ติดผนัง" },
  { value: "window", label: "Window / หน้าต่าง" },
  { value: "cassette", label: "Cassette / ฝังฝ้า" },
  { value: "ceiling", label: "Ceiling / แขวน" },
  { value: "portable", label: "Portable / เคลื่อนที่" },
  { value: "central", label: "Central / Ducted" },
];

const COMMON_BTU = [9000, 12000, 13000, 18000, 24000, 30000, 36000, 48000, 60000];

export function BookingWizard({ service }: Props) {
  const { t, lang } = useLanguage();
  const locale = lang === "th" ? "th-TH" : "en-US";
  const STEPS = [t.booking.stepDateTime, t.booking.stepDetails, t.booking.stepReview] as const;

  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const [units, setUnits] = useState<Unit[]>([{ ...blankUnit }]);

  const [state, formAction, isPending] = useActionState(createBookingAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  // Auto-jump to the right step when the server returns field errors
  useEffect(() => {
    if (!state.success) {
      const fe = state.fieldErrors ?? {};
      const step0Fields = ["scheduledAt", "technicianId", "durationMinutes", "serviceType"];
      if (step0Fields.some((k) => fe[k])) {
        setStep(0);
        return;
      }
      const step1Fields = [
        "fullName",
        "phone",
        "addressLine1",
        "city",
        "province",
        "postalCode",
        "units",
      ];
      if (step1Fields.some((k) => fe[k])) {
        setStep(1);
      }
    }
  }, [state]);

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

  const handleSubmit = () => {
    if (!selectedDate || !selectedSlot) {
      setStep(0);
      return;
    }
    const fd = new FormData(formRef.current!);
    // Pack units as JSON so the server can parse them as a single field.
    fd.set(
      "unitsJson",
      JSON.stringify(
        units
          .filter((u) => u.brand && u.btu && u.type && u.quantity > 0)
          .map((u) => ({
            brand: u.brand.trim(),
            btu: Number(u.btu),
            type: u.type,
            quantity: Number(u.quantity),
          }))
      )
    );
    startTransition(() => {
      formAction(fd);
    });
  };

  // ── Unit handlers ────────────────────────────────────────────────────────
  const addUnit = () => setUnits((u) => [...u, { ...blankUnit }]);
  const removeUnit = (i: number) =>
    setUnits((u) => (u.length > 1 ? u.filter((_, idx) => idx !== i) : u));
  const updateUnit = (i: number, patch: Partial<Unit>) =>
    setUnits((u) => u.map((unit, idx) => (idx === i ? { ...unit, ...patch } : unit)));

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

      <form
        ref={formRef}
        onSubmit={(e) => {
          e.preventDefault();
          if (step === 2 && !isPending) handleSubmit();
        }}
      >
        <input type="hidden" name="serviceType" value={service.id} />
        <input type="hidden" name="durationMinutes" value={service.durationMinutes} />
        <input type="hidden" name="technicianId" value={selectedSlot?.technicianId ?? ""} />
        <input
          type="hidden"
          name="scheduledAt"
          value={selectedDate && selectedSlot ? `${selectedDate}T${selectedSlot.startTime}:00` : ""}
        />
        <input type="hidden" name="unitsJson" value="" />

        {/* STEP 0 — Date & Time */}
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

        {/* STEP 1 — Details (kept in DOM via CSS toggle) */}
        <div className={step === 1 ? "space-y-6" : "hidden"}>
          {/* Contact */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 dark:text-gray-100">{t.booking.contactInfo}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={t.booking.fullName} name="fullName" required error={fieldErrors.fullName?.[0]} />
              <Field label={t.booking.phone} name="phone" type="tel" required error={fieldErrors.phone?.[0]} />
            </div>
          </section>

          {/* Address */}
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

          {/* AC units */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {t.booking.acDetails}
              </h2>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {units.length} {units.length === 1 ? "unit" : "units"}
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-4 dark:text-gray-400">
              {t.booking.acDetailsHint}
            </p>

            <div className="space-y-3">
              {units.map((u, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                      <AirVent className="h-4 w-4 text-blue-600" />
                      Unit #{i + 1}
                    </div>
                    {units.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeUnit(i)}
                        className="p-1.5 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                        aria-label="Remove unit"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        {t.booking.brand} *
                      </label>
                      <input
                        type="text"
                        value={u.brand}
                        onChange={(e) => updateUnit(i, { brand: e.target.value })}
                        placeholder="Daikin"
                        className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        BTU *
                      </label>
                      <input
                        type="number"
                        list={`btu-list-${i}`}
                        value={u.btu}
                        onChange={(e) =>
                          updateUnit(i, {
                            btu: e.target.value === "" ? "" : Number(e.target.value),
                          })
                        }
                        placeholder="18000"
                        className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1.5 text-sm"
                      />
                      <datalist id={`btu-list-${i}`}>
                        {COMMON_BTU.map((b) => (
                          <option key={b} value={b} />
                        ))}
                      </datalist>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        {t.booking.acType} *
                      </label>
                      <select
                        value={u.type}
                        onChange={(e) => updateUnit(i, { type: e.target.value })}
                        className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1.5 text-sm"
                      >
                        {UNIT_TYPES.map((tp) => (
                          <option key={tp.value} value={tp.value}>
                            {tp.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Qty *
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={u.quantity}
                        onChange={(e) =>
                          updateUnit(i, {
                            quantity: Math.max(1, Math.min(20, Number(e.target.value) || 1)),
                          })
                        }
                        className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1.5 text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addUnit}
                className="w-full py-2.5 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 text-sm font-medium text-blue-600 dark:text-blue-400 hover:border-blue-400 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add another unit
              </button>
              {fieldErrors.units && (
                <p className="text-xs text-red-600 mt-1">{fieldErrors.units[0]}</p>
              )}
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

        {/* STEP 2 — Review (no payment) */}
        <div className={step === 2 ? "space-y-6" : "hidden"}>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t.booking.reviewTitle}</h2>

          <div className="rounded-xl border border-gray-200 bg-gray-50 divide-y divide-gray-200 dark:border-gray-700 dark:bg-gray-800/50 dark:divide-gray-700">
            <Row label={t.booking.rowService} value={service.title} />
            <Row
              label={t.booking.rowDate}
              value={
                selectedDate
                  ? new Date(selectedDate + "T12:00:00").toLocaleDateString(locale, {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "—"
              }
            />
            <Row label={t.booking.rowTime} value={`${selectedSlot?.startTime ?? "—"} – ${selectedSlot?.endTime ?? "—"}`} />
            <Row label={t.booking.rowTechnician} value={selectedSlot?.technicianName ?? "—"} />
            <Row label={t.booking.rowDuration} value={t.booking.durationValue(service.durationMinutes)} />
          </div>

          {/* Unit summary */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              AC Units ({units.length})
            </p>
            <ul className="space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
              {units.map((u, i) => (
                <li key={i} className="flex items-center gap-2">
                  <AirVent className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                  <span className="font-medium">{u.brand || "—"}</span>
                  <span className="text-gray-500">·</span>
                  <span>{u.btu || "—"} BTU</span>
                  <span className="text-gray-500">·</span>
                  <span className="capitalize">{u.type}</span>
                  <span className="text-gray-500">·</span>
                  <span>×{u.quantity}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Quote-flow info */}
          <div className="rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/40 dark:bg-blue-950/20 p-4 text-sm text-blue-900 dark:text-blue-200">
            <p className="font-semibold mb-1">
              {lang === "th"
                ? "ไม่เก็บค่าใช้จ่ายตอนจอง"
                : "No charge at booking time"}
            </p>
            <p className="text-xs leading-relaxed">
              {lang === "th"
                ? "หลังจองเสร็จ ทีมงานจะตรวจสอบและส่งใบเสนอราคามาให้ภายใน 24 ชั่วโมง คุณสามารถยืนยันราคาเพื่อล็อกคิวได้ในขั้นตอนถัดไป"
                : "Our team will review your booking and send you a quote within 24 hours. You'll be able to accept it to lock your slot."}
            </p>
          </div>

          {globalError && (
            <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400">
              {globalError}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              disabled={isPending}
              className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-50 transition-colors dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              {t.booking.back}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
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
