import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your account to manage bookings and orders.",
};

export default function LoginPage() {
  return <LoginForm />;
}
