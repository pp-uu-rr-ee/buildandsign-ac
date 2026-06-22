"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";
import { registerAction } from "@/lib/actions/auth";
import { useLanguage } from "@/components/providers/LanguageProvider";
import type { ActionResult } from "@/lib/actions/auth";

const initialState: ActionResult = { success: true };

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(registerAction, initialState);
  const { t } = useLanguage();
  const [password, setPassword] = useState("");

  // Live password requirements (must mirror registerSchema).
  const passwordReqs = [
    { ok: password.length >= 8, label: t.auth.pwReqLength },
    { ok: /[A-Za-z]/.test(password), label: t.auth.pwReqLetter },
    { ok: /[0-9]/.test(password), label: t.auth.pwReqNumber },
  ];

  const fieldErrors = !state.success ? state.fieldErrors : undefined;
  const globalError = !state.success && !state.fieldErrors ? state.error : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t.auth.createAccount}</h1>
        <p className="text-sm text-gray-500 mt-1">{t.auth.registerSubtitle}</p>
      </div>

      {globalError && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400">
          {globalError}
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            {t.auth.fullName}
          </label>
          <input
            id="name" name="name" type="text" autoComplete="name" required
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            disabled={isPending}
          />
          {fieldErrors?.name && <p className="mt-1 text-xs text-red-600">{fieldErrors.name[0]}</p>}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            {t.auth.email}
          </label>
          <input
            id="email" name="email" type="email" autoComplete="email" required
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            disabled={isPending}
          />
          {fieldErrors?.email && <p className="mt-1 text-xs text-red-600">{fieldErrors.email[0]}</p>}
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium mb-1">
            {t.auth.phone} <span className="text-red-500">*</span>
          </label>
          <input
            id="phone" name="phone" type="tel" autoComplete="tel" required
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            disabled={isPending}
          />
          {fieldErrors?.phone && <p className="mt-1 text-xs text-red-600">{fieldErrors.phone[0]}</p>}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            {t.auth.password}
          </label>
          <input
            id="password" name="password" type="password" autoComplete="new-password" required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            disabled={isPending}
          />
          {fieldErrors?.password && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.password[0]}</p>
          )}
          <ul className="mt-2 space-y-1">
            {passwordReqs.map((req) => (
              <li
                key={req.label}
                className={`flex items-center gap-1.5 text-xs transition-colors ${
                  req.ok
                    ? "text-green-600 dark:text-green-400"
                    : "text-gray-400 dark:text-gray-500"
                }`}
              >
                {req.ok ? (
                  <Check className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <X className="h-3.5 w-3.5 shrink-0" />
                )}
                {req.label}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
            {t.auth.confirmPassword}
          </label>
          <input
            id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            disabled={isPending}
          />
          {fieldErrors?.confirmPassword && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.confirmPassword[0]}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? t.auth.registering : t.auth.register}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
        {t.auth.haveAccount}{" "}
        <Link href="/login" className="text-blue-600 font-medium hover:underline dark:text-blue-400">
          {t.auth.signInLink}
        </Link>
      </p>
    </div>
  );
}
