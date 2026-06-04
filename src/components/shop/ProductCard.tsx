"use client";

import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { formatPrice, discountPercent } from "@/lib/helpers/price";
import { useLanguage } from "@/components/providers/LanguageProvider";

type Props = {
  product: {
    id: string;
    name: string;
    nameTh?: string | null;
    slug: string;
    shortDescription: string | null;
    shortDescriptionTh?: string | null;
    category: string;
    priceInSatang: number;
    comparePriceInSatang: number | null;
    stock: number;
    isFeatured: boolean;
    primaryImage: { url: string; altText: string | null } | null;
  };
};

export function ProductCard({ product }: Props) {
  const { lang, t } = useLanguage();
  const discount = discountPercent(product.comparePriceInSatang, product.priceInSatang);
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const isOutOfStock = product.stock === 0;

  const displayName =
    lang === "th" && product.nameTh ? product.nameTh : product.name;
  const displayShortDesc =
    lang === "th" && product.shortDescriptionTh
      ? product.shortDescriptionTh
      : product.shortDescription;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col rounded-xl border border-gray-200 bg-white overflow-hidden hover:shadow-md hover:border-blue-200 transition-all duration-200 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-700"
    >
      <div className="relative aspect-[4/3] bg-gray-50 overflow-hidden dark:bg-gray-800">
        {product.primaryImage?.url ? (
          <Image
            src={product.primaryImage.url}
            alt={product.primaryImage.altText ?? displayName}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              className="h-16 w-16 text-gray-300 dark:text-gray-600"
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

        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {discount !== null && (
            <Badge className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5">
              -{discount}%
            </Badge>
          )}
          {product.isFeatured && (
            <Badge className="bg-blue-600 text-white text-xs px-1.5 py-0.5">
              {t.products.featured}
            </Badge>
          )}
        </div>

        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/70 dark:bg-gray-900/70 flex items-center justify-center">
            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
              {t.products.outOfStock}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5 p-4 flex-1">
        <p className="text-xs text-blue-600 font-medium capitalize dark:text-blue-400">
          {t.products.type(product.category.replace("_", " "))}
        </p>
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors dark:text-gray-100 dark:group-hover:text-blue-400">
          {displayName}
        </h3>
        {displayShortDesc && (
          <p className="text-xs text-gray-500 line-clamp-2 dark:text-gray-400">
            {displayShortDesc}
          </p>
        )}

        <div className="mt-auto pt-3 flex items-end justify-between gap-2">
          <div>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {formatPrice(product.priceInSatang)}
            </p>
            {product.comparePriceInSatang && (
              <p className="text-xs text-gray-400 dark:text-gray-500 line-through">
                {formatPrice(product.comparePriceInSatang)}
              </p>
            )}
          </div>
          {isLowStock && (
            <span className="text-xs text-orange-500 dark:text-orange-400 font-medium whitespace-nowrap">
              {t.products.onlyLeft(product.stock)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
