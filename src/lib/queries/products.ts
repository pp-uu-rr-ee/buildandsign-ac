import { db } from "@/db";
import { products, productImages, productVariants } from "@/db/schema";
import { and, asc, desc, eq, ilike, inArray, sql } from "drizzle-orm";
import type { ProductCategoryEnum } from "@/types";

export type ProductFilters = {
  category?: ProductCategoryEnum[];
  brand?: string[];
  minPrice?: number; // in satang
  maxPrice?: number; // in satang
  search?: string;
  featured?: boolean;
  sort?: "price_asc" | "price_desc" | "newest" | "name_asc";
  page?: number;
  limit?: number;
};

/**
 * Distinct brands across the active catalogue, for the storefront filter.
 * Brand is free-text, so we read the values that actually exist rather than
 * hardcoding a list.
 */
export async function getBrands(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ brand: products.brand })
    .from(products)
    .where(and(eq(products.status, "active"), sql`${products.brand} <> ''`))
    .orderBy(asc(products.brand));

  return rows
    .map((r) => r.brand)
    .filter((b): b is string => b != null && b.trim() !== "");
}

/**
 * Aggregated columns from variants:
 *   minPriceInSatang        — cheapest variant price (the "from ..." label)
 *   maxPriceInSatang        — for showing price range
 *   maxComparePriceInSatang — highest crossed-out price across variants
 *   totalStock              — sum of all variant stock (0 = whole series oos)
 *   variantCount            — how many sizes available
 */
const variantAggSubquery = sql`(
  SELECT
    min(price_in_satang)::int          AS min_price,
    max(price_in_satang)::int          AS max_price,
    max(compare_price_in_satang)::int  AS max_compare,
    coalesce(sum(stock), 0)::int       AS total_stock,
    count(*)::int                      AS variant_count
  FROM product_variants pv
  WHERE pv.product_id = ${products.id}
)`;

export async function getProducts(filters: ProductFilters = {}) {
  const {
    category,
    brand,
    minPrice,
    maxPrice,
    search,
    featured,
    sort = "newest",
    page = 1,
    limit = 12,
  } = filters;

  const where = and(
    eq(products.status, "active"),
    category && category.length > 0
      ? inArray(products.category, category)
      : undefined,
    brand && brand.length > 0 ? inArray(products.brand, brand) : undefined,
    search ? ilike(products.name, `%${search}%`) : undefined,
    featured !== undefined ? eq(products.isFeatured, featured) : undefined,
    // Price filter applies to the cheapest variant of each series.
    minPrice !== undefined
      ? sql`(SELECT min(price_in_satang) FROM product_variants WHERE product_id = ${products.id}) >= ${minPrice}`
      : undefined,
    maxPrice !== undefined
      ? sql`(SELECT min(price_in_satang) FROM product_variants WHERE product_id = ${products.id}) <= ${maxPrice}`
      : undefined,
  );

  const orderBy =
    sort === "price_asc"
      ? sql`(SELECT min(price_in_satang) FROM product_variants WHERE product_id = ${products.id}) ASC NULLS LAST`
      : sort === "price_desc"
      ? sql`(SELECT min(price_in_satang) FROM product_variants WHERE product_id = ${products.id}) DESC NULLS LAST`
      : sort === "name_asc"
      ? asc(products.name)
      : desc(products.createdAt);

  const offset = (page - 1) * limit;

  const [rows, [{ count }]] = await Promise.all([
    db
      .select({
        id: products.id,
        name: products.name,
        nameTh: products.nameTh,
        slug: products.slug,
        shortDescription: products.shortDescription,
        shortDescriptionTh: products.shortDescriptionTh,
        category: products.category,
        isFeatured: products.isFeatured,
        minPriceInSatang: sql<number>`(SELECT min(price_in_satang)::int FROM product_variants WHERE product_id = ${products.id})`,
        maxPriceInSatang: sql<number>`(SELECT max(price_in_satang)::int FROM product_variants WHERE product_id = ${products.id})`,
        maxComparePriceInSatang: sql<number | null>`(SELECT max(compare_price_in_satang)::int FROM product_variants WHERE product_id = ${products.id})`,
        totalStock: sql<number>`(SELECT coalesce(sum(stock), 0)::int FROM product_variants WHERE product_id = ${products.id})`,
        variantCount: sql<number>`(SELECT count(*)::int FROM product_variants WHERE product_id = ${products.id})`,
        primaryImage: {
          url: productImages.url,
          altText: productImages.altText,
        },
      })
      .from(products)
      .leftJoin(
        productImages,
        and(
          eq(productImages.productId, products.id),
          eq(productImages.isPrimary, true)
        )
      )
      .where(where)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset),

    db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(where),
  ]);

  return {
    products: rows,
    total: count,
    pages: Math.ceil(count / limit),
    page,
  };
}

export async function getProductBySlug(slug: string) {
  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.slug, slug), eq(products.status, "active")))
    .limit(1);

  if (!product) return null;

  const [images, variants] = await Promise.all([
    db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, product.id))
      .orderBy(asc(productImages.sortOrder)),
    db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, product.id))
      .orderBy(asc(productVariants.sortOrder)),
  ]);

  return { ...product, images, variants };
}

export async function getRelatedProducts(
  category: ProductCategoryEnum,
  excludeId: string,
  limit = 4
) {
  return db
    .select({
      id: products.id,
      name: products.name,
      nameTh: products.nameTh,
      slug: products.slug,
      minPriceInSatang: sql<number>`(SELECT min(price_in_satang)::int FROM product_variants WHERE product_id = ${products.id})`,
      maxComparePriceInSatang: sql<number | null>`(SELECT max(compare_price_in_satang)::int FROM product_variants WHERE product_id = ${products.id})`,
      primaryImage: {
        url: productImages.url,
        altText: productImages.altText,
      },
    })
    .from(products)
    .leftJoin(
      productImages,
      and(
        eq(productImages.productId, products.id),
        eq(productImages.isPrimary, true)
      )
    )
    .where(
      and(
        eq(products.status, "active"),
        eq(products.category, category),
        sql`${products.id} != ${excludeId}`
      )
    )
    .orderBy(sql`random()`)
    .limit(limit);
}

// Keep the unused subquery exported in case other queries want it.
export { variantAggSubquery };
