import { db } from "@/db";
import { products, productImages } from "@/db/schema";
import { and, asc, desc, eq, gte, ilike, lte, inArray, sql } from "drizzle-orm";
import type { ProductCategoryEnum } from "@/types";

export type ProductFilters = {
  category?: ProductCategoryEnum[];
  minPrice?: number; // in cents
  maxPrice?: number; // in cents
  search?: string;
  featured?: boolean;
  sort?: "price_asc" | "price_desc" | "newest" | "name_asc";
  page?: number;
  limit?: number;
};

export async function getProducts(filters: ProductFilters = {}) {
  const {
    category,
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
    minPrice !== undefined ? gte(products.priceInSatang, minPrice) : undefined,
    maxPrice !== undefined ? lte(products.priceInSatang, maxPrice) : undefined,
    search ? ilike(products.name, `%${search}%`) : undefined,
    featured !== undefined ? eq(products.isFeatured, featured) : undefined,
  );

  const orderBy =
    sort === "price_asc"
      ? asc(products.priceInSatang)
      : sort === "price_desc"
      ? desc(products.priceInSatang)
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
        priceInSatang: products.priceInSatang,
        comparePriceInSatang: products.comparePriceInSatang,
        stock: products.stock,
        isFeatured: products.isFeatured,
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

  const images = await db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, product.id))
    .orderBy(asc(productImages.sortOrder));

  return { ...product, images };
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
      priceInSatang: products.priceInSatang,
      comparePriceInSatang: products.comparePriceInSatang,
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
