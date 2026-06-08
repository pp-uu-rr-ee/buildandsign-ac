"use server";

import { redirect } from "next/navigation";
import { eq, and, gt, isNull } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { db } from "@/db";
import { users, passwordResetTokens } from "@/db/schema";
import { createSession, deleteSession } from "@/lib/session";
import { registerSchema, loginSchema } from "@/lib/validations/auth";
import { sendPasswordReset } from "@/lib/email";
import { siteConfig } from "@/config/site";

export type ActionResult =
  | { success: true }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

export async function registerAction(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { name, email, phone, password } = parsed.data;

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing.length > 0) {
    return { success: false, error: "An account with this email already exists" };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const [user] = await db
    .insert(users)
    .values({
      name,
      email,
      phone,
      passwordHash,
      role: "customer",
    })
    .returning({ id: users.id, role: users.role, name: users.name, email: users.email });

  await createSession({
    userId: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
  });

  redirect("/");
}

export async function loginAction(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { email, password } = parsed.data;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    return { success: false, error: "Invalid email or password" };
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    return { success: false, error: "Invalid email or password" };
  }

  await createSession({
    userId: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
  });

  // Redirect based on role
  if (user.role === "admin") redirect("/admin/dashboard");
  if (user.role === "technician") redirect("/technician/calendar");
  redirect("/");
}

export async function logoutAction(): Promise<void> {
  await deleteSession();
  redirect("/");
}

// ── Forgot password ───────────────────────────────────────────────────────────
export type ForgotPasswordResult =
  | { success: true }
  | { success: false; error: string };

export async function requestPasswordResetAction(
  _prev: ForgotPasswordResult,
  formData: FormData
): Promise<ForgotPasswordResult> {
  const email = (formData.get("email") as string | null)?.trim().toLowerCase();
  if (!email) return { success: false, error: "Email is required." };

  const [user] = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  // Always return success to avoid email enumeration
  if (!user) return { success: true };

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Delete any existing unused tokens for this user
  await db
    .delete(passwordResetTokens)
    .where(and(eq(passwordResetTokens.userId, user.id), isNull(passwordResetTokens.usedAt)));

  await db.insert(passwordResetTokens).values({ userId: user.id, token, expiresAt });

  const resetUrl = `${siteConfig.url}/reset-password?token=${token}`;
  try {
    await sendPasswordReset({ to: user.email, customerName: user.name, resetUrl });
  } catch {
    // Fire-and-forget — don't block on email failure
  }

  return { success: true };
}

// ── Reset password ────────────────────────────────────────────────────────────
export type ResetPasswordResult =
  | { success: true }
  | { success: false; error: string };

export async function resetPasswordAction(
  _prev: ResetPasswordResult,
  formData: FormData
): Promise<ResetPasswordResult> {
  const token = (formData.get("token") as string | null)?.trim();
  const password = formData.get("password") as string | null;
  const confirmPassword = formData.get("confirmPassword") as string | null;

  if (!token) return { success: false, error: "Invalid reset link." };
  if (!password || password.length < 8)
    return { success: false, error: "Password must be at least 8 characters." };
  if (password !== confirmPassword)
    return { success: false, error: "Passwords do not match." };

  const now = new Date();
  const [record] = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.token, token),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, now)
      )
    )
    .limit(1);

  if (!record) return { success: false, error: "This reset link is invalid or has expired." };

  const passwordHash = await bcrypt.hash(password, 12);

  await Promise.all([
    db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, record.userId)),
    db.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.id, record.id)),
  ]);

  redirect("/login?reset=1");
}
