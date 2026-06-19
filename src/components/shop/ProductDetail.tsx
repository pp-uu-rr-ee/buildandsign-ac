"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ShoppingCart, Check, Phone, Star, Truck, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/lib/store/cart";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ImageGallery } from "@/components/shop/ImageGallery";
import { formatPrice, discountPercent } from "@/lib/helpers/price";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { siteConfig } from "@/config/site";
import type { ProductVariant } from "@/types";

/**
 * Energy ratings are stored as "5", "5*", "5**", "5***". When a value ends in
 * one-or-more asterisks, render the leading text plus that many filled star
 * icons instead of literal asterisks. Other spec values render as-is.
 */
function renderSpecValue(value: string): React.ReactNode {
  const match = value.match(/^(.*?)(\*+)$/);
  if (!match) return value;
  const [, base, stars] = match;
  return (
    <span className="inline-flex items-center gap-1">
      {base.trim() && <span>{base.trim()}</span>}
      <span className="inline-flex items-center text-amber-500">
        {Array.from({ length: stars.length }).map((_, i) => (
          <Star key={i} className="h-3.5 w-3.5 fill-current" />
        ))}
      </span>
    </span>
  );
}

type Props = {
  productId: string;
  productName: string;
  productSlug: string;
  /** Pre-localized series short description (intro line under the price). */
  shortDescription: string | null;
  /** Pre-localized long description (Details tab). */
  description: string | null;
  images: { url: string; altText: string | null }[];
  primaryImageUrl: string | null;
  /** Series-shared free-form specs from the JSONB column. */
  sharedSpecs: Record<string, string> | null;
  /** Typed series-level specs (Brand, EER, Voltage, Refrigerant, Warranty). */
  sharedTyped: {
    Brand?: string | null;
    EER?: string | null;
    Voltage?: string | null;
    Refrigerant?: string | null;
    Warranty?: string | null;
  };
  variants: ProductVariant[];
  isFeatured: boolean;
  categoryLabel: string;
};

export function ProductDetail({
  productId,
  productName,
  productSlug,
  shortDescription,
  description,
  images,
  primaryImageUrl,
  sharedSpecs,
  sharedTyped,
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

  // Build the merged spec table. Kept in a memo so it only recomputes when the
  // selected variant changes. Variant-specific values come first.
  const mergedSpecs = useMemo(() => {
    if (!selected) return {} as Record<string, string>;

    const typedShared: Record<string, string> = {};
    for (const [k, v] of Object.entries(sharedTyped)) {
      if (v != null && String(v).trim() !== "") typedShared[k] = String(v);
    }

    const typedVariant: Record<string, string> = {};
    if (selected.coolingCapacityBtu != null) {
      typedVariant["Cooling Capacity"] = `${selected.coolingCapacityBtu.toLocaleString()} BTU/hr`;
    }
    if (selected.noiseLevelDb != null) {
      typedVariant["Noise Level"] = `${selected.noiseLevelDb} dB(A)`;
    }
    if (selected.energyRating) {
      typedVariant[lang === "th" ? "ฉลากประหยัดไฟ" : "Energy Rating"] =
        selected.energyRating;
    }
    if (selected.roomSizeSqm) {
      typedVariant["Recommended Room Size"] = `${selected.roomSizeSqm} m²`;
    }

    return {
      ...typedVariant,
      ...((selected.specifications as Record<string, string> | null) ?? {}),
      ...typedShared,
      ...(sharedSpecs ?? {}),
    };
  }, [selected, sharedTyped, sharedSpecs, lang]);

  if (!selected) return null;

  const isOutOfStock = selected.stock === 0;
  const discount = discountPercent(
    selected.comparePriceInSatang,
    selected.priceInSatang
  );

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
    queueMicrotask(() => setQty(cappedQty));
  }

  const hasSpecs = Object.keys(mergedSpecs).length > 0;
  const hasDescription = Boolean(description);

  // Shared content blocks — reused by the mobile tabs and the desktop
  // side-by-side layout so the markup lives in one place.
  const descriptionBlock = (
    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
      {description}
    </p>
  );

  const specsBlock = (
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
                {renderSpecValue(value)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-12">
      {/* ── Top: gallery + buy box ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
        {/* Gallery sticks while the buy box scrolls on desktop. */}
        <div className="lg:sticky lg:top-24 self-start">
          <ImageGallery images={images} productName={productName} />
        </div>

        {/* Buy box */}
        <div className="flex flex-col gap-5">
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
              <Badge
                variant="outline"
                className="text-red-500 border-red-200 dark:border-red-800"
              >
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

          {shortDescription && (
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              {shortDescription}
            </p>
          )}

          <Separator />

          {/* Size picker */}
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {lang === "th" ? "เลือกขนาด" : "Select size"}
              <span className="ml-2 font-normal text-gray-400 dark:text-gray-500">
                ({selected.size})
              </span>
            </p>
            <div className="flex flex-wrap gap-2">
              {variants.map((v) => {
                const active = v.id === selected.id;
                const oos = v.stock === 0;
                return (
                  <button
                    key={v.id}
                    type="button"
                    disabled={oos}
                    onClick={() => setSelectedId(v.id)}
                    className={`relative flex-1 basis-28 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all text-left ${
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
                    {isOutOfStock ? t.products.outOfStock : t.products.addToCart}
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

          {/* Trust row (no online payment in this build — delivery / warranty /
              stock only). */}
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="inline-flex items-center gap-1.5">
              <Truck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              {lang === "th" ? "จัดส่งทั่วประเทศ" : "Nationwide delivery"}
            </span>
            {sharedTyped.Warranty && (
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                {sharedTyped.Warranty}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Check
                className={`h-4 w-4 ${
                  isOutOfStock ? "text-gray-400" : "text-green-600"
                }`}
              />
              {isOutOfStock ? t.products.outOfStock : t.products.inStock ?? "In stock"}
            </span>
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
        </div>
      </div>

      {/* ── Bottom: details + specs ────────────────────────────────────── */}
      {/* Mobile: compact tabs. */}
      {(hasDescription || hasSpecs) && (
        <div className="lg:hidden">
          <Tabs defaultValue={hasDescription ? "details" : "specs"}>
            <TabsList
              variant="line"
              className="h-auto w-full justify-start gap-5 rounded-none border-b border-gray-200 p-0 dark:border-gray-800"
            >
              {hasDescription && (
                <TabsTrigger value="details" className="flex-none px-0 pb-2">
                  {t.products.aboutProduct}
                </TabsTrigger>
              )}
              {hasSpecs && (
                <TabsTrigger value="specs" className="flex-none px-0 pb-2">
                  {t.products.specifications}
                </TabsTrigger>
              )}
            </TabsList>

            {hasDescription && (
              <TabsContent value="details" className="pt-5">
                {descriptionBlock}
              </TabsContent>
            )}
            {hasSpecs && (
              <TabsContent value="specs" className="pt-5">
                {specsBlock}
              </TabsContent>
            )}
          </Tabs>
        </div>
      )}

      {/* Desktop: description (left, under the gallery) and specs (right),
          side by side and aligned with the columns above. */}
      {(hasDescription || hasSpecs) && (
        <div className="hidden lg:grid lg:grid-cols-2 gap-10 lg:gap-16">
          <section>
            {hasDescription && (
              <>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  {t.products.aboutProduct}
                </h2>
                {descriptionBlock}
              </>
            )}
          </section>
          <section>
            {hasSpecs && (
              <>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  {t.products.specifications}
                </h2>
                {specsBlock}
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
