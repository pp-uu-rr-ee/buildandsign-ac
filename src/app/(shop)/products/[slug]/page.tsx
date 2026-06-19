import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getProductBySlug, getRelatedProducts } from "@/lib/queries/products";
import { ProductDetail } from "@/components/shop/ProductDetail";
import { ProductCard } from "@/components/shop/ProductCard";
import { getT, getLang } from "@/lib/helpers/lang";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};

  const primaryImage = product.images.find((i) => i.isPrimary);

  return {
    title: product.metaTitle ?? product.name,
    description:
      product.metaDescription ?? product.shortDescription ?? undefined,
    openGraph: {
      title: product.metaTitle ?? product.name,
      description:
        product.metaDescription ?? product.shortDescription ?? undefined,
      images: primaryImage ? [{ url: primaryImage.url }] : [],
      type: "website",
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const [product, t, lang] = await Promise.all([
    getProductBySlug(slug),
    getT(),
    getLang(),
  ]);
  if (!product) notFound();

  const related = await getRelatedProducts(product.category, product.id);
  const primaryImage = product.images.find((i) => i.isPrimary);

  const displayName =
    lang === "th" && product.nameTh ? product.nameTh : product.name;
  const displayShortDesc =
    lang === "th" && product.shortDescriptionTh
      ? product.shortDescriptionTh
      : product.shortDescription;
  const displayDesc =
    lang === "th" && product.descriptionTh
      ? product.descriptionTh
      : product.description;

  const categoryLabel = t.products.type(product.category.replace("_", " "));

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-8">
        <Link href="/" className="hover:text-blue-600 transition-colors dark:hover:text-blue-400">
          {t.common.home}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/products" className="hover:text-blue-600 transition-colors dark:hover:text-blue-400">
          {t.nav.products}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-gray-900 dark:text-gray-200 capitalize">
          {categoryLabel}
        </span>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-gray-900 dark:text-gray-200 line-clamp-1">{displayName}</span>
      </nav>

      <ProductDetail
        productId={product.id}
        productName={displayName}
        productSlug={product.slug}
        shortDescription={displayShortDesc ?? null}
        description={displayDesc ?? null}
        images={product.images}
        primaryImageUrl={primaryImage?.url ?? null}
        sharedSpecs={product.specifications}
        sharedTyped={{
          Brand: product.brand,
          EER: product.eer,
          Voltage: product.voltage,
          Refrigerant: product.refrigerant,
          Warranty: product.warrantyText,
        }}
        variants={product.variants}
        isFeatured={product.isFeatured}
        categoryLabel={categoryLabel}
      />

      {/* Related products */}
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            {t.products.relatedProducts}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {related.map((p) => (
              <ProductCard
                key={p.id}
                product={{
                  id: p.id,
                  name: p.name,
                  nameTh: p.nameTh,
                  slug: p.slug,
                  shortDescription: null,
                  shortDescriptionTh: null,
                  category: product.category,
                  isFeatured: false,
                  minPriceInSatang: p.minPriceInSatang,
                  maxPriceInSatang: p.minPriceInSatang,
                  maxComparePriceInSatang: p.maxComparePriceInSatang,
                  totalStock: 1,
                  variantCount: 1,
                  primaryImage: p.primaryImage,
                }}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
