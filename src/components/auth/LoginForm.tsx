"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction } from "@/lib/actions/auth";
import { useLanguage } from "@/components/providers/LanguageProvider";
import type { ActionResult } from "@/lib/actions/auth";

const initialState: ActionResult = { success: true };

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);
  const { t } = useLanguage();

  const fieldErrors = !state.success ? state.fieldErrors : undefined;
  const globalError = !state.success && !state.fieldErrors ? state.error : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t.auth.welcomeBack}</h1>
        <p className="text-sm text-gray-500 mt-1">{t.auth.signInSubtitle}</p>
      </div>

      {globalError && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400">
          {globalError}
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            {t.auth.email}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            disabled={isPending}
          />
          {fieldErrors?.email && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.email[0]}</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="password" className="block text-sm font-medium">
              {t.auth.password}
            </label>
            <Link href="/forgot-password" className="text-xs text-blue-600 hover:underline dark:text-blue-400">
              {t.auth.forgotPassword}
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            disabled={isPending}
          />
          {fieldErrors?.password && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.password[0]}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? t.auth.signingIn : t.auth.signIn}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
        {t.auth.noAccount}{" "}
        <Link href="/register" className="text-blue-600 font-medium hover:underline dark:text-blue-400">
          {t.auth.createOne}
        </Link>
      </p>
    </div>
  );
}
