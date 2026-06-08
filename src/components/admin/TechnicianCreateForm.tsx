"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  createTechnicianAction,
  type TechnicianActionResult,
} from "@/lib/actions/admin";

const initialState: TechnicianActionResult = {
  success: true,
  technicianId: "",
};

const SPECIALIZATIONS = [
  { value: "cleaning", label: "AC Cleaning" },
  { value: "repair", label: "AC Repair" },
  { value: "installation", label: "AC Installation" },
  { value: "inspection", label: "AC Inspection" },
] as const;

export function TechnicianCreateForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    createTechnicianAction,
    initialState
  );

  useEffect(() => {
    if (state.success && state.technicianId) {
      toast.success("Technician created");
      router.push("/admin/technicians");
    }
  }, [state, router]);

  const fieldErrors = !state.success ? state.fieldErrors : undefined;
  const globalError = !state.success && !state.fieldErrors ? state.error : null;

  return (
    <form action={formAction} className="space-y-6 max-w-2xl">
      {globalError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {globalError}
        </div>
      )}

      {/* Account */}
      <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="font-semibold text-gray-900 text-sm">Account</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Full name"
            name="name"
            required
            error={fieldErrors?.name?.[0]}
            placeholder="Somchai Jaidee"
          />
          <Field
            label="Phone"
            name="phone"
            type="tel"
            required
            error={fieldErrors?.phone?.[0]}
            placeholder="+66 81 234 5678"
          />
        </div>
        <Field
          label="Email"
          name="email"
          type="email"
          required
          error={fieldErrors?.email?.[0]}
          placeholder="tech@example.com"
        />
        <Field
          label="Temporary password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          error={fieldErrors?.password?.[0]}
          placeholder="Min 8 chars — share with technician privately"
        />
      </section>

      {/* Profile */}
      <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="font-semibold text-gray-900 text-sm">Profile</h2>

        <div>
          <label
            htmlFor="status"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue="active"
            className="w-full sm:w-60 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="on_leave">On leave</option>
          </select>
        </div>

        <div>
          <p className="block text-sm font-medium text-gray-700 mb-2">
            Specializations <span className="text-red-500">*</span>
          </p>
          <div className="grid grid-cols-2 gap-2">
            {SPECIALIZATIONS.map((s) => (
              <label
                key={s.value}
                className="flex items-center gap-2 px-3 py-2 rounded-md border border-gray-200 cursor-pointer hover:border-blue-400 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 transition-colors"
              >
                <input
                  type="checkbox"
                  name="specializations"
                  value={s.value}
                  defaultChecked
                  className="accent-blue-600"
                />
                <span className="text-sm text-gray-700">{s.label}</span>
              </label>
            ))}
          </div>
          {fieldErrors?.specializations && (
            <p className="mt-1 text-xs text-red-600">
              {fieldErrors.specializations[0]}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="bio"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Bio <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={3}
            placeholder="e.g. 5 years experience. Carrier & Daikin certified."
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
          />
          {fieldErrors?.bio && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.bio[0]}</p>
          )}
        </div>

        <p className="text-xs text-gray-400">
          A default weekly schedule (Mon–Fri 8am–6pm, Sat 8am–2pm) will be
          assigned. You can edit it later from this technician&apos;s page.
        </p>
      </section>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? "Creating…" : "Create Technician"}
        </button>
        <Link
          href="/admin/technicians"
          className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  error,
  placeholder,
  autoComplete,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  error?: string;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
