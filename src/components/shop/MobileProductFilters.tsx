"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ProductFilters } from "@/components/shop/ProductFilters";
import { useLanguage } from "@/components/providers/LanguageProvider";

export function MobileProductFilters({ brands }: { brands: string[] }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const searchParams = useSearchParams();

  // Count applied filters so the trigger can show a badge.
  const activeCount =
    searchParams.getAll("brand").length +
    (searchParams.get("minPrice") || searchParams.get("maxPrice") ? 1 : 0);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className="lg:hidden inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
        aria-label={t.products.filtersTitle}
      >
        <SlidersHorizontal className="h-4 w-4" />
        {t.products.filtersTitle}
        {activeCount > 0 && (
          <span className="h-5 min-w-5 px-1 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
            {activeCount}
          </span>
        )}
      </SheetTrigger>

      <SheetContent
        side="left"
        className="w-80 max-w-[85vw] p-6 pt-12 bg-white dark:bg-gray-950 dark:border-gray-800 overflow-y-auto"
      >
        <ProductFilters brands={brands} />
      </SheetContent>
    </Sheet>
  );
}
