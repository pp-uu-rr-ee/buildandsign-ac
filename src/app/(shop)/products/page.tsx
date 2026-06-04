import type { Metadata } from "next";
import { Suspense } from "react";
import { getProducts } from "@/lib/queries/products";
import { ProductCard } from "@/components/shop/ProductCard";
import { ProductFilters } from "@/components/shop/ProductFilters";
import { ProductSort } from "@/components/shop/ProductSort";
import { Pagination } from "@/components/shop/Pagination";
import { getT } from "@/lib/helpers/lang";
import type { ProductCategoryEnum } from "@/types";
import type { ProductFilters as Filters } from "@/lib/queries/products";

export const metadata: Metadata = {
  title: "Shop AC Units",
  description:
    "Browse our full range of air conditioning units — split type, window type, portable and more. Filter by type, price, and brand.",
};

type SearchParams = {
  category?: string | string[];
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
  page?: string;
  search?: string;
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const [sp, t] = await Promise.all([searchParams, getT()]);

  const filters: Filters = {
    category: (
      Array.isArray(sp.category)
        ? sp.category
        : sp.category
        ? [sp.category]
        : []
    ) as ProductCategoryEnum[],
    minPrice: sp.minPrice ? Number(sp.minPrice) : undefined,
    maxPrice: sp.maxPrice ? Number(sp.maxPrice) : undefined,
    sort: (sp.sort as Filters["sort"]) ?? "newest",
    page: sp.page ? Number(sp.page) : 1,
    search: sp.search,
  };

  const { products, total, pages, page } = await getProducts(filters);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {t.products.pageTitle}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {t.products.available(total)}
        </p>
      </div>

      <div className="flex gap-8">
        <aside className="hidden lg:block w-56 shrink-0">
          <Suspense>
            <ProductFilters />
          </Suspense>
        </aside>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-5">
            <Suspense>
              <ProductSort />
            </Suspense>
          </div>

          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {t.products.noResults}
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-sm">
                {t.products.noResultsHint}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              <div className="mt-8">
                <Suspense>
                  <Pagination page={page} pages={pages} total={total} />
                </Suspense>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
