"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Check, X } from "lucide-react";
import { updateProfileAction } from "@/lib/actions/auth";
import type { UpdateProfileResult } from "@/lib/actions/auth";

type Props = {
  name: string;
  email: string;
  phone: string | null;
};

const initialState: UpdateProfileResult = { success: true };

export function ProfileForm({ name, email, phone }: Props) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    updateProfileAction,
    initialState
  );

  const [editing, setEditing] = useState(!phone); // auto-open if missing phone
  const [nameValue, setNameValue] = useState(name);
  const [phoneValue, setPhoneValue] = useState(phone ?? "");

  // Track whether a submit has happened — used to distinguish a "real" success
  // from the initial state (which is also `success: true`).
  const submittedRef = useRef(false);

  // Watch for action results: on success after a submit, close + refresh.
  useEffect(() => {
    if (!submittedRef.current || isPending) return;
    if (state.success) {
      toast.success("Profile updated");
      setEditing(false);
      submittedRef.current = false;
      router.refresh();
    }
  }, [state, isPending, router]);

  const fieldErrors = !state.success ? state.fieldErrors : undefined;
  const globalError = !state.success && !state.fieldErrors ? state.error : null;

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">
            Contact details
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Used for orders, bookings, and account messages.
          </p>
        </div>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
        )}
      </div>

      {!phone && !editing && (
        <div className="rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900 px-3 py-2 mb-4 text-xs text-orange-800 dark:text-orange-300">
          Please add a phone number — you&apos;ll need it to place orders or book a service.
        </div>
      )}

      {editing ? (
        <form
          action={(fd) => {
            submittedRef.current = true;
            formAction(fd);
          }}
          className="space-y-4"
        >
          <ProfileField
            label="Full name"
            name="name"
            value={nameValue}
            onChange={setNameValue}
            error={fieldErrors?.name?.[0]}
            disabled={isPending}
          />
          <div className="rounded-lg bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Email:
            </span>{" "}
            {email}{" "}
            <span className="text-gray-400 dark:text-gray-500">
              (cannot be changed)
            </span>
          </div>
          <ProfileField
            label="Phone"
            name="phone"
            type="tel"
            value={phoneValue}
            onChange={setPhoneValue}
            error={fieldErrors?.phone?.[0]}
            disabled={isPending}
            placeholder="0XX-XXX-XXXX"
          />

          {globalError && (
            <p className="text-xs text-red-600 dark:text-red-400">{globalError}</p>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              <Check className="h-4 w-4" />
              {isPending ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setNameValue(name);
                setPhoneValue(phone ?? "");
              }}
              disabled={isPending}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-60 transition-colors"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-3 text-sm">
          <Row label="Full name" value={name} />
          <Row label="Email" value={email} />
          <Row
            label="Phone"
            value={
              phone ?? (
                <span className="text-orange-600 dark:text-orange-400 font-medium">
                  Not set
                </span>
              )
            }
          />
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide w-20 shrink-0">
        {label}
      </span>
      <span className="font-medium text-gray-900 dark:text-gray-100 break-all">
        {value}
      </span>
    </div>
  );
}

function ProfileField({
  label,
  name,
  type = "text",
  value,
  onChange,
  error,
  disabled,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete={
          name === "name" ? "name" : name === "phone" ? "tel" : undefined
        }
        className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
      />
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
