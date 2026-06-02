import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { db } from "@/db";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ProductEditForm } from "@/components/admin/ProductEditForm";

type Props = { params: Promise<{ id: string }> };

export default async function AdminProductEditPage({ params }: Props) {
  const { id } = await params;
  const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!product) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/products" className="p-1.5 rounded-md hover:bg-gray-100 transition-colors">
          <ChevronLeft className="h-5 w-5 text-gray-500" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Edit Product</h1>
      </div>
      <ProductEditForm product={product} />
    </div>
  );
}
