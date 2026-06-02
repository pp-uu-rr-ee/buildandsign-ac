"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = { page: number; pages: number; total: number };

export function Pagination({ page, pages, total }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  if (pages <= 1) return null;

  const go = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: true });
    });
  };

  const pageNumbers: (number | "…")[] = [];
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || (i >= page - 1 && i <= page + 1)) {
      pageNumbers.push(i);
    } else if (
      pageNumbers[pageNumbers.length - 1] !== "…"
    ) {
      pageNumbers.push("…");
    }
  }

  return (
    <nav className="flex items-center justify-between pt-4">
      <p className="text-sm text-gray-500">
        Page {page} of {pages} ({total} products)
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => go(page - 1)}
          disabled={page <= 1}
          className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {pageNumbers.map((p, i) =>
          p === "…" ? (
            <span key={`ellipsis-${i}`} className="px-2 text-gray-400 text-sm">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => go(p)}
              className={`h-8 w-8 rounded-md text-sm font-medium transition-colors ${
                p === page
                  ? "bg-blue-600 text-white"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => go(page + 1)}
          disabled={page >= pages}
          className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
}
