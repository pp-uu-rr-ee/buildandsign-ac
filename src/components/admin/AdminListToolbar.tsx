"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, Loader2 } from "lucide-react";

export type SelectGroup = {
  /** URL query-param key, e.g. "category" */
  key: string;
  /** Visible label above/before the dropdown */
  label: string;
  options: { value: string; label: string }[];
};

export type ChipGroup = {
  /** URL query-param key, e.g. "status" */
  key: string;
  /** Visible label above/before the chips */
  label: string;
  options: { value: string; label: string }[];
};

type Props = {
  /** Base URL path to navigate to (without query string), e.g. "/admin/orders" */
  basePath: string;
  /** Placeholder text for the search input */
  searchPlaceholder?: string;
  /** Status-style chips (typically one row of pill buttons) */
  chips?: ChipGroup;
  /** Extra dropdown filter(s) shown to the right of the chips */
  selects?: SelectGroup[];
};

/**
 * Generic toolbar for admin list pages.
 *
 * Renders a debounced search input + status chips + optional dropdowns,
 * all syncing to URL search params via `router.replace` (no scroll/jump).
 * Built so the same component drives /admin/products, /admin/orders, and
 * /admin/bookings.
 */
export function AdminListToolbar({
  basePath,
  searchPlaceholder = "Search…",
  chips,
  selects = [],
}: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(params.get("search") ?? "");

  // Debounced URL update on search-input change.
  useEffect(() => {
    const current = params.get("search") ?? "";
    if (search === current) return;

    const t = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (search.trim()) next.set("search", search.trim());
      else next.delete("search");
      next.delete("page");
      startTransition(() => {
        router.replace(`${basePath}?${next.toString()}`, { scroll: false });
      });
    }, 250);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // External URL changes (back/forward) → re-sync input.
  useEffect(() => {
    const current = params.get("search") ?? "";
    if (current !== search) setSearch(current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.get("search")]);

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    startTransition(() => {
      router.replace(`${basePath}?${next.toString()}`, { scroll: false });
    });
  };

  const clearAll = () => {
    setSearch("");
    startTransition(() => {
      router.replace(basePath, { scroll: false });
    });
  };

  const activeChipValue = chips ? params.get(chips.key) ?? "" : "";
  const activeSelectValues = selects.map((s) => params.get(s.key) ?? "");
  const hasFilters =
    !!search || !!activeChipValue || activeSelectValues.some(Boolean);

  return (
    <div className="space-y-3">
      {/* Search input */}
      <div className="relative w-full sm:max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={searchPlaceholder}
          autoComplete="off"
          className="w-full rounded-lg border border-gray-300 pl-9 pr-9 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isPending ? (
            <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
          ) : search ? (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="text-gray-400 hover:text-gray-700"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Chips + selects */}
      {(chips || selects.length > 0) && (
        <div className="flex items-center gap-3 flex-wrap">
          {chips && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wide mr-1">
                {chips.label}
              </span>
              {chips.options.map((opt) => {
                const active = activeChipValue === opt.value;
                return (
                  <button
                    key={opt.value || "all"}
                    type="button"
                    onClick={() => setParam(chips.key, opt.value)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      active
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          )}

          {selects.map((sel, idx) => (
            <div key={sel.key} className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wide mr-1">
                {sel.label}
              </span>
              <select
                value={activeSelectValues[idx]}
                onChange={(e) => setParam(sel.key, e.target.value)}
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {sel.options.map((o) => (
                  <option key={o.value || "all"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          ))}

          {hasFilters && (
            <button
              type="button"
              onClick={clearAll}
              className="ml-auto text-xs font-medium text-gray-500 hover:text-gray-900 underline-offset-2 hover:underline"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
}
