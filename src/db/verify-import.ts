import "dotenv/config";
import { db } from "./index";
import { products, productVariants } from "./schema";
import { eq, sql, asc } from "drizzle-orm";

async function main() {
  const [{ totalProducts }] = await db
    .select({ totalProducts: sql<number>`count(*)::int` })
    .from(products);

  const [{ totalVariants }] = await db
    .select({ totalVariants: sql<number>`count(*)::int` })
    .from(productVariants);

  const seriesWithoutVariants = await db
    .select({ name: products.name, slug: products.slug })
    .from(products)
    .where(
      sql`NOT EXISTS (SELECT 1 FROM product_variants WHERE product_id = ${products.id})`
    );

  // Categories breakdown
  const byCategory = await db
    .select({
      category: products.category,
      count: sql<number>`count(*)::int`,
    })
    .from(products)
    .groupBy(products.category);

  // Sample series with variants
  const samples = await db
    .select()
    .from(products)
    .limit(3);

  console.log(`📦 Products (series): ${totalProducts}`);
  console.log(`🔢 Variants: ${totalVariants}`);
  console.log("");
  console.log("Categories:");
  for (const c of byCategory) {
    console.log(`  ${c.category}: ${c.count}`);
  }
  console.log("");
  console.log(`Series with NO variants (issues): ${seriesWithoutVariants.length}`);
  for (const s of seriesWithoutVariants) {
    console.log(`  ⚠ ${s.name} (${s.slug})`);
  }

  console.log("");
  console.log("Sample series + variants:");
  for (const p of samples) {
    const variants = await db
      .select({
        size: productVariants.size,
        sku: productVariants.sku,
        priceInSatang: productVariants.priceInSatang,
        stock: productVariants.stock,
      })
      .from(productVariants)
      .where(eq(productVariants.productId, p.id))
      .orderBy(asc(productVariants.sortOrder));
    console.log(`\n  📦 ${p.name} (${p.slug}) — ${p.category}`);
    for (const v of variants) {
      console.log(
        `     • ${v.size} | SKU=${v.sku} | ฿${(v.priceInSatang / 100).toLocaleString()} | stock=${v.stock}`
      );
    }
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
