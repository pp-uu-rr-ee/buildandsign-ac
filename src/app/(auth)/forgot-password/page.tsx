import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Forgot Password",
};

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reset your password</h1>
        <p className="text-sm text-gray-500 mt-1">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <form className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 transition-colors"
        >
          Send reset link
        </button>
      </form>

      <p className="text-center text-sm text-gray-500">
        Remembered it?{" "}
        <Link href="/login" className="text-blue-600 font-medium hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
