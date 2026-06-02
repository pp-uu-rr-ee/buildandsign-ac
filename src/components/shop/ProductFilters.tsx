"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/helpers/price";

const CATEGORIES = [
  { value: "split", label: "Split Type" },
  { value: "window", label: "Window Type" },
  { value: "portable", label: "Portable" },
  { value: "central", label: "Central / Ducted" },
  { value: "cassette", label: "Cassette" },
];

const PRICE_RANGES = [
  { label: "Under ₱20,000", min: 0, max: 2000000 },
  { label: "₱20,000 – ₱35,000", min: 2000000, max: 3500000 },
  { label: "₱35,000 – ₱50,000", min: 3500000, max: 5000000 },
  { label: "Over ₱50,000", min: 5000000, max: 99999900 },
];

export function ProductFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const activeCategories = searchParams.getAll("category");
  const activeMin = searchParams.get("minPrice");
  const activeMax = searchParams.get("maxPrice");

  const setParam = useCallback(
    (updates: Record<string, string | string[] | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      // Reset page on any filter change
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

  const toggleCategory = (value: string) => {
    const next = activeCategories.includes(value)
      ? activeCategories.filter((c) => c !== value)
      : [...activeCategories, value];
    setParam({ category: next.length > 0 ? next : null });
  };

  const setPriceRange = (min: number, max: number) => {
    const alreadyActive =
      activeMin === String(min) && activeMax === String(max);
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

  const hasActiveFilters =
    activeCategories.length > 0 || activeMin || activeMax;

  return (
    <aside
      className={`space-y-6 transition-opacity ${isPending ? "opacity-50" : ""}`}
    >
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Filters</h2>
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="text-xs text-blue-600 hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Category */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">AC Type</h3>
        <div className="space-y-2">
          {CATEGORIES.map((cat) => {
            const checked = activeCategories.includes(cat.value);
            return (
              <label
                key={cat.value}
                className="flex items-center gap-2.5 cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleCategory(cat.value)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 accent-blue-600 cursor-pointer"
                />
                <span
                  className={`text-sm transition-colors ${
                    checked
                      ? "text-blue-600 font-medium"
                      : "text-gray-600 group-hover:text-gray-900"
                  }`}
                >
                  {cat.label}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Price Range */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Price Range</h3>
        <div className="space-y-2">
          {PRICE_RANGES.map((range) => {
            const isActive =
              activeMin === String(range.min) &&
              activeMax === String(range.max);
            return (
              <label
                key={range.label}
                className="flex items-center gap-2.5 cursor-pointer group"
              >
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
                      ? "text-blue-600 font-medium"
                      : "text-gray-600 group-hover:text-gray-900"
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
