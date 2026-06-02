import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Phone } from "lucide-react";
import { getProductBySlug, getRelatedProducts } from "@/lib/queries/products";
import { ImageGallery } from "@/components/shop/ImageGallery";
import { AddToCartButton } from "@/components/shop/AddToCartButton";
import { ProductCard } from "@/components/shop/ProductCard";
import { ProductJsonLd } from "@/components/seo/ProductJsonLd";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatPrice, discountPercent } from "@/lib/helpers/price";
import { siteConfig } from "@/config/site";

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
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product.category, product.id);
  const primaryImage = product.images.find((i) => i.isPrimary);
  const discount = discountPercent(product.comparePriceInCents, product.priceInCents);
  const isOutOfStock = product.stock === 0;

  return (
    <>
      <ProductJsonLd
        product={{
          ...product,
          primaryImageUrl: primaryImage?.url,
        }}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm text-gray-500 mb-8">
          <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/products" className="hover:text-blue-600 transition-colors">Products</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-gray-900 capitalize">
            {product.category.replace("_", " ")} Type
          </span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-gray-900 line-clamp-1">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Left — Image gallery */}
          <ImageGallery images={product.images} productName={product.name} />

          {/* Right — Product info */}
          <div className="flex flex-col gap-5">
            {/* Category + badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="capitalize text-blue-600 border-blue-200 bg-blue-50">
                {product.category.replace("_", " ")} Type
              </Badge>
              {product.isFeatured && (
                <Badge className="bg-blue-600 text-white">Featured</Badge>
              )}
              {isOutOfStock && (
                <Badge variant="outline" className="text-red-500 border-red-200">
                  Out of Stock
                </Badge>
              )}
            </div>

            {/* Name */}
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
              {product.name}
            </h1>

            {/* Short description */}
            {product.shortDescription && (
              <p className="text-gray-600">{product.shortDescription}</p>
            )}

            {/* Price */}
            <div className="flex items-end gap-3">
              <span className="text-3xl font-bold text-gray-900">
                {formatPrice(product.priceInCents)}
              </span>
              {product.comparePriceInCents && (
                <span className="text-lg text-gray-400 line-through pb-0.5">
                  {formatPrice(product.comparePriceInCents)}
                </span>
              )}
              {discount !== null && (
                <Badge className="bg-red-500 text-white mb-0.5">
                  Save {discount}%
                </Badge>
              )}
            </div>

            <Separator />

            {/* Add to cart */}
            <AddToCartButton
              productId={product.id}
              productName={product.name}
              slug={product.slug}
              imageUrl={primaryImage?.url ?? null}
              priceInCents={product.priceInCents}
              stock={product.stock}
            />

            {/* Service CTA */}
            <div className="rounded-lg bg-blue-50 border border-blue-100 p-4 flex items-start gap-3">
              <Phone className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-blue-900">
                  Need professional installation?
                </p>
                <p className="text-sm text-blue-700 mt-0.5">
                  Call us at{" "}
                  <a href={`tel:${siteConfig.phone}`} className="font-medium underline">
                    {siteConfig.phone}
                  </a>{" "}
                  or{" "}
                  <Link href="/book/installation" className="font-medium underline">
                    book a technician online
                  </Link>
                  .
                </p>
              </div>
            </div>

            {/* Specifications */}
            {product.specifications &&
              Object.keys(product.specifications).length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">
                    Specifications
                  </h2>
                  <div className="rounded-lg border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm">
                      <tbody>
                        {Object.entries(product.specifications).map(
                          ([key, value], i) => (
                            <tr
                              key={key}
                              className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}
                            >
                              <td className="px-4 py-2.5 font-medium text-gray-600 w-2/5">
                                {key}
                              </td>
                              <td className="px-4 py-2.5 text-gray-900">
                                {value}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            {/* Full description */}
            {product.description && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  About this product
                </h2>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Related Products
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {related.map((p) => (
                <ProductCard
                  key={p.id}
                  product={{
                    ...p,
                    shortDescription: null,
                    category: product.category,
                    stock: 1,
                    isFeatured: false,
                  }}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
