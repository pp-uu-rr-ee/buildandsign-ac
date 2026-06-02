import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ProductCreateForm } from "@/components/admin/ProductCreateForm";

export const metadata = { title: "New Product | Admin" };

export default function AdminNewProductPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/products"
          className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className="h-5 w-5 text-gray-500" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">New Product</h1>
      </div>

      <ProductCreateForm />
    </div>
  );
}
