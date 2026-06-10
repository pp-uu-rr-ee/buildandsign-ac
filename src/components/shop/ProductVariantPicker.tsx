"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ShoppingCart, Check, Phone } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/lib/store/cart";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatPrice, discountPercent } from "@/lib/helpers/price";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { siteConfig } from "@/config/site";
import type { ProductVariant } from "@/types";

type Props = {
  productId: string;
  productName: string;
  productSlug: string;
  primaryImageUrl: string | null;
  /** Series-shared specs displayed before variant-specific specs. */
  sharedSpecs: Record<string, string> | null;
  variants: ProductVariant[];
  isFeatured: boolean;
  categoryLabel: string;
};

export function ProductVariantPicker({
  productId,
  productName,
  productSlug,
  primaryImageUrl,
  sharedSpecs,
  variants,
  isFeatured,
  categoryLabel,
}: Props) {
  const { t, lang } = useLanguage();
  const addItem = useCart((s) => s.addItem);

  // Variants come from the server already sorted by sortOrder.
  const defaultVariantId =
    variants.find((v) => v.stock > 0)?.id ?? variants[0]?.id ?? "";
  const [selectedId, setSelectedId] = useState(defaultVariantId);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const selected = useMemo(
    () => variants.find((v) => v.id === selectedId) ?? variants[0],
    [variants, selectedId]
  );

  if (!selected) return null;

  const isOutOfStock = selected.stock === 0;
  const discount = discountPercent(
    selected.comparePriceInSatang,
    selected.priceInSatang
  );

  // Merge shared + variant-specific specs for display. Variant overrides shared.
  const mergedSpecs: Record<string, string> = {
    ...(sharedSpecs ?? {}),
    ...((selected.specifications as Record<string, string> | null) ?? {}),
  };

  const handleAdd = () => {
    addItem({
      variantId: selected.id,
      productId,
      name: productName,
      size: selected.size,
      slug: productSlug,
      imageUrl: primaryImageUrl,
      unitPriceInSatang: selected.priceInSatang,
      quantity: qty,
    });
    setAdded(true);
    toast.success(`${productName} (${selected.size}) added to cart`);
    setTimeout(() => setAdded(false), 2000);
  };

  // Keep qty within the selected variant's stock when the user switches sizes.
  const cappedQty = Math.max(1, Math.min(qty, Math.max(1, selected.stock)));
  if (cappedQty !== qty) {
    // Defer to next tick to avoid setState in render.
    queueMicrotask(() => setQty(cappedQty));
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Category + badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge
          variant="outline"
          className="capitalize text-blue-600 border-blue-200 bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:bg-blue-950"
        >
          {categoryLabel}
        </Badge>
        {isFeatured && (
          <Badge className="bg-blue-600 text-white dark:bg-blue-500">
            {t.products.featured}
          </Badge>
        )}
        {isOutOfStock && (
          <Badge variant="outline" className="text-red-500 border-red-200 dark:border-red-800">
            {t.products.outOfStock}
          </Badge>
        )}
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
        {productName}
      </h1>

      {/* Price */}
      <div className="flex items-end gap-3">
        <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {formatPrice(selected.priceInSatang)}
        </span>
        {selected.comparePriceInSatang && (
          <span className="text-lg text-gray-400 dark:text-gray-500 line-through pb-0.5">
            {formatPrice(selected.comparePriceInSatang)}
          </span>
        )}
        {discount !== null && (
          <Badge className="bg-red-500 text-white mb-0.5">
            {t.products.save(discount)}
          </Badge>
        )}
      </div>

      <Separator />

      {/* Size picker */}
      <div>
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          {lang === "th" ? "เลือกขนาด" : "Select size"}
          <span className="ml-2 font-normal text-gray-400 dark:text-gray-500">
            ({selected.size})
          </span>
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {variants.map((v) => {
            const active = v.id === selected.id;
            const oos = v.stock === 0;
            return (
              <button
                key={v.id}
                type="button"
                disabled={oos}
                onClick={() => setSelectedId(v.id)}
                className={`relative rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all text-left ${
                  active
                    ? "border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 ring-1 ring-blue-600"
                    : oos
                    ? "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-600 cursor-not-allowed line-through"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:border-blue-400"
                }`}
              >
                <div className="text-base">{v.size}</div>
                <div className="text-[11px] font-normal mt-0.5 opacity-80">
                  {formatPrice(v.priceInSatang)}
                </div>
                {oos && !active && (
                  <span className="absolute top-1 right-1 text-[9px] uppercase tracking-wide text-red-500">
                    {lang === "th" ? "หมด" : "OOS"}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quantity + actions */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t.products.quantity ?? "Quantity"}
          </span>
          <div className="flex items-center border border-gray-300 dark:border-gray-700 rounded-md overflow-hidden">
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={qty <= 1 || isOutOfStock}
              className="px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors"
            >
              −
            </button>
            <span className="px-4 py-2 text-sm font-semibold border-x border-gray-300 dark:border-gray-700 min-w-[3rem] text-center text-gray-900 dark:text-gray-100">
              {qty}
            </span>
            <button
              onClick={() => setQty((q) => Math.min(selected.stock, q + 1))}
              disabled={qty >= selected.stock || isOutOfStock}
              className="px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors"
            >
              +
            </button>
          </div>
          {selected.stock > 0 && selected.stock <= 5 && (
            <span className="text-xs text-orange-500 font-medium">
              {lang === "th"
                ? `เหลือเพียง ${selected.stock} ชิ้น`
                : `Only ${selected.stock} left`}
            </span>
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleAdd}
            disabled={isOutOfStock}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-md text-sm font-semibold transition-all duration-200 ${
              added
                ? "bg-green-600 text-white"
                : isOutOfStock
                ? "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {added ? (
              <>
                <Check className="h-4 w-4" /> {t.products.addedToCart ?? "Added"}
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4" />{" "}
                {isOutOfStock
                  ? t.products.outOfStock
                  : t.products.addToCart}
              </>
            )}
          </button>
          <a
            href="/checkout"
            onClick={!added && !isOutOfStock ? handleAdd : undefined}
            className={`flex-1 flex items-center justify-center px-6 py-3 rounded-md border text-sm font-semibold transition-colors ${
              isOutOfStock
                ? "border-gray-200 text-gray-300 cursor-not-allowed pointer-events-none dark:border-gray-700 dark:text-gray-600"
                : "border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
            }`}
          >
            {lang === "th" ? "สอบถาม" : "Inquire"}
          </a>
        </div>
      </div>

      {/* Installation CTA */}
      <div className="rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-100 dark:border-blue-800 p-4 flex items-start gap-3">
        <Phone className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">
            {t.products.needInstallation}
          </p>
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-0.5">
            {t.products.callUsAt}{" "}
            <a href={`tel:${siteConfig.phone}`} className="font-medium underline">
              {siteConfig.phone}
            </a>{" "}
            {t.products.or}{" "}
            <Link href="/book/installation" className="font-medium underline">
              {t.products.bookTechnicianOnline}
            </Link>
            .
          </p>
        </div>
      </div>

      {/* Specifications (merged shared + variant) */}
      {Object.keys(mergedSpecs).length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
            {t.products.specifications}
          </h2>
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {Object.entries(mergedSpecs).map(([key, value], i) => (
                  <tr
                    key={key}
                    className={
                      i % 2 === 0
                        ? "bg-gray-50 dark:bg-gray-800"
                        : "bg-white dark:bg-gray-900"
                    }
                  >
                    <td className="px-4 py-2.5 font-medium text-gray-600 dark:text-gray-400 w-2/5">
                      {key}
                    </td>
                    <td className="px-4 py-2.5 text-gray-900 dark:text-gray-100">
                      {value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
