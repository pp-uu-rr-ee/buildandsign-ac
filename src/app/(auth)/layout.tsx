import type { ReactNode } from "react";
import Link from "next/link";
import { siteConfig } from "@/config/site";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between bg-blue-600 p-12 text-white">
        <Link href="/" className="text-2xl font-bold tracking-tight">
          {siteConfig.name}
        </Link>
        <blockquote className="space-y-2">
          <p className="text-lg leading-relaxed">
            &ldquo;Expert AC services you can trust — installation, repair, and
            cleaning, right when you need it.&rdquo;
          </p>
          <footer className="text-blue-200 text-sm">
            Serving Metro Manila &amp; surrounding areas
          </footer>
        </blockquote>
        <p className="text-blue-200 text-sm">{siteConfig.openingHours}</p>
      </div>

      {/* Right panel — form */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="block mb-8 text-xl font-bold text-blue-600 lg:hidden"
          >
            {siteConfig.name}
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
