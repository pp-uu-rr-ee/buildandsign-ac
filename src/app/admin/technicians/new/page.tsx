import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { TechnicianCreateForm } from "@/components/admin/TechnicianCreateForm";

export const metadata = { title: "New Technician | Admin" };

export default function NewTechnicianPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/technicians"
          className="p-1.5 rounded-md hover:bg-gray-100 transition-colors shrink-0"
        >
          <ChevronLeft className="h-5 w-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            New Technician
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Create a technician account and profile
          </p>
        </div>
      </div>

      <TechnicianCreateForm />
    </div>
  );
}
