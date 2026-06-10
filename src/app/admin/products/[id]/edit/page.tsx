import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { db } from "@/db";
import { products, productImages, productVariants } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { ProductEditForm } from "@/components/admin/ProductEditForm";
import { ProductImageManager } from "@/components/admin/ProductImageManager";
import { VariantsManager } from "@/components/admin/VariantsManager";

type Props = { params: Promise<{ id: string }> };

export default async function AdminProductEditPage({ params }: Props) {
  const { id } = await params;

  const [product, images, variants] = await Promise.all([
    db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1)
      .then((r) => r[0]),
    db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, id))
      .orderBy(asc(productImages.sortOrder)),
    db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, id))
      .orderBy(asc(productVariants.sortOrder)),
  ]);

  if (!product) notFound();

  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/products"
          className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className="h-5 w-5 text-gray-500" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Edit Product</h1>
      </div>

      {/* Images */}
      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Product Images</h2>
          <p className="text-sm text-gray-500">
            The primary image appears on product cards and listings.
          </p>
        </div>
        <ProductImageManager productId={product.id} images={images} />
      </section>

      <hr className="border-gray-200" />

      {/* Variants (sizes) */}
      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Variants</h2>
          <p className="text-sm text-gray-500">
            Sizes the customer can pick. Click a row to edit it inline.
          </p>
        </div>
        <VariantsManager productId={product.id} variants={variants} />
      </section>

      <hr className="border-gray-200" />

      {/* Product details */}
      <section>
        <h2 className="text-base font-semibold text-gray-900 mb-4">Product Details</h2>
        <ProductEditForm product={product} />
      </section>
    </div>
  );
}
