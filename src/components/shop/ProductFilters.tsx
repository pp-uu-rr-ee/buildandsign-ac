"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/components/providers/LanguageProvider";

export function ProductFilters({ brands }: { brands: string[] }) {
  const { t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const activeBrands = searchParams.getAll("brand");
  const activeMin = searchParams.get("minPrice");
  const activeMax = searchParams.get("maxPrice");

  const PRICE_RANGES = [
    { label: t.products.priceLt20k, min: 0, max: 2000000 },
    { label: t.products.price20k35k, min: 2000000, max: 3500000 },
    { label: t.products.price35k50k, min: 3500000, max: 5000000 },
    { label: t.products.priceGt50k, min: 5000000, max: 99999900 },
  ];

  const setParam = useCallback(
    (updates: Record<string, string | string[] | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("page");
      for (const [key, value] of Object.entries(updates)) {
        params.delete(key);
        if (value === null) continue;
        if (Array.isArray(value)) {
          value.forEach((v) => params.append(key, v));
        } else {
          params.set(key, value);
        }
      }
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [router, pathname, searchParams]
  );

  const toggleBrand = (value: string) => {
    const next = activeBrands.includes(value)
      ? activeBrands.filter((b) => b !== value)
      : [...activeBrands, value];
    setParam({ brand: next.length > 0 ? next : null });
  };

  const setPriceRange = (min: number, max: number) => {
    const alreadyActive = activeMin === String(min) && activeMax === String(max);
    if (alreadyActive) {
      setParam({ minPrice: null, maxPrice: null });
    } else {
      setParam({ minPrice: String(min), maxPrice: String(max) });
    }
  };

  const clearAll = () =>
    startTransition(() => {
      router.push(pathname, { scroll: false });
    });

  const hasActiveFilters = activeBrands.length > 0 || activeMin || activeMax;

  return (
    <aside className={`space-y-6 transition-opacity ${isPending ? "opacity-50" : ""}`}>
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">
          {t.products.filtersTitle}
        </h2>
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="text-xs text-blue-600 hover:underline dark:text-blue-400"
          >
            {t.products.clearAll}
          </button>
        )}
      </div>

      {brands.length > 0 && (
        <>
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {t.products.brand}
            </h3>
            <div className="space-y-2">
              {brands.map((brand) => {
                const checked = activeBrands.includes(brand);
                return (
                  <label key={brand} className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleBrand(brand)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 accent-blue-600 cursor-pointer"
                    />
                    <span
                      className={`text-sm transition-colors ${
                        checked
                          ? "text-blue-600 font-medium dark:text-blue-400"
                          : "text-gray-600 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-gray-100"
                      }`}
                    >
                      {brand}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <Separator />
        </>
      )}

      <div>
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          {t.products.priceRange}
        </h3>
        <div className="space-y-2">
          {PRICE_RANGES.map((range) => {
            const isActive =
              activeMin === String(range.min) && activeMax === String(range.max);
            return (
              <label key={range.label} className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="radio"
                  name="priceRange"
                  checked={isActive}
                  onChange={() => setPriceRange(range.min, range.max)}
                  className="h-4 w-4 border-gray-300 text-blue-600 accent-blue-600 cursor-pointer"
                />
                <span
                  className={`text-sm transition-colors ${
                    isActive
                      ? "text-blue-600 font-medium dark:text-blue-400"
                      : "text-gray-600 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-gray-100"
                  }`}
                >
                  {range.label}
                </span>
              </label>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
