import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create an account to book AC services and track your orders.",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
