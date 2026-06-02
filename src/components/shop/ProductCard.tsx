import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { formatPrice, discountPercent } from "@/lib/helpers/price";

type Props = {
  product: {
    id: string;
    name: string;
    slug: string;
    shortDescription: string | null;
    category: string;
    priceInCents: number;
    comparePriceInCents: number | null;
    stock: number;
    isFeatured: boolean;
    primaryImage: { url: string; altText: string | null } | null;
  };
};

export function ProductCard({ product }: Props) {
  const discount = discountPercent(
    product.comparePriceInCents,
    product.priceInCents
  );
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const isOutOfStock = product.stock === 0;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col rounded-xl border border-gray-200 bg-white overflow-hidden hover:shadow-md hover:border-blue-200 transition-all duration-200"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-gray-50 overflow-hidden">
        {product.primaryImage?.url ? (
          <Image
            src={product.primaryImage.url}
            alt={product.primaryImage.altText ?? product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              className="h-16 w-16 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {discount !== null && (
            <Badge className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5">
              -{discount}%
            </Badge>
          )}
          {product.isFeatured && (
            <Badge className="bg-blue-600 text-white text-xs px-1.5 py-0.5">
              Featured
            </Badge>
          )}
        </div>

        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="text-sm font-semibold text-gray-500">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1.5 p-4 flex-1">
        <p className="text-xs text-blue-600 font-medium capitalize">
          {product.category.replace("_", " ")} Type
        </p>
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {product.name}
        </h3>
        {product.shortDescription && (
          <p className="text-xs text-gray-500 line-clamp-2">
            {product.shortDescription}
          </p>
        )}

        <div className="mt-auto pt-3 flex items-end justify-between gap-2">
          <div>
            <p className="text-lg font-bold text-gray-900">
              {formatPrice(product.priceInCents)}
            </p>
            {product.comparePriceInCents && (
              <p className="text-xs text-gray-400 line-through">
                {formatPrice(product.comparePriceInCents)}
              </p>
            )}
          </div>
          {isLowStock && (
            <span className="text-xs text-orange-500 font-medium whitespace-nowrap">
              Only {product.stock} left
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
