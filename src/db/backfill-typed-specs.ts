/**
 * One-shot backfill: move common keys from the `specifications` JSONB into
 * the typed columns added in migration 0009.
 *
 * Run after applying the migration:
 *   npx tsx src/db/backfill-typed-specs.ts
 *
 * Behaviour:
 *   - For each products row: read `specifications`, peel off Brand / EER /
 *     Voltage / Refrigerant / Warranty / Energy Rating into typed columns.
 *   - For each product_variants row: peel off Cooling Capacity / Noise Level /
 *     Dimensions / Power Consumption.
 *   - Unknown keys remain in `specifications` so nothing is lost.
 *   - Idempotent — re-running on already-backfilled data is a no-op.
 */
import "dotenv/config";
import { db } from "./index";
import { products, productVariants } from "./schema";
import { eq } from "drizzle-orm";

// ─── Series-level mapping ───────────────────────────────────────────────────
// Each entry: { typed column, list of JSONB keys to look for }.
const SERIES_KEYS: Array<{
  column: "brand" | "eer" | "voltage" | "refrigerant" | "warrantyText" | "energyRating";
  keys: string[];
  parse?: (s: string) => string | null;
}> = [
  {
    column: "brand",
    keys: ["Brand", "Brand Name", "ยี่ห้อ"],
  },
  {
    column: "eer",
    keys: ["EER", "Energy Efficiency Ratio", "SEER"],
    // Drop anything that isn't part of a decimal number.
    parse: (s) => {
      const m = s.match(/\d+(\.\d+)?/);
      return m ? m[0] : null;
    },
  },
  {
    column: "voltage",
    keys: ["Voltage", "Power Supply", "Power", "แรงดันไฟฟ้า"],
  },
  {
    column: "refrigerant",
    keys: ["Refrigerant", "Gas", "น้ำยา", "สารทำความเย็น"],
  },
  {
    column: "warrantyText",
    keys: ["Warranty", "การรับประกัน", "รับประกัน"],
  },
  {
    column: "energyRating",
    keys: ["Energy Rating", "Energy Label", "เบอร์ประหยัดไฟ", "ฉลากประหยัดไฟ"],
  },
];

// ─── Variant-level mapping ──────────────────────────────────────────────────
const VARIANT_KEYS: Array<{
  column: "coolingCapacityBtu" | "noiseLevelDb" | "dimensions" | "roomSizeSqm";
  keys: string[];
  parse?: (s: string) => string | number | null;
}> = [
  {
    column: "coolingCapacityBtu",
    keys: [
      "Cooling Capacity",
      "Cooling",
      "BTU",
      "BTU/hr",
      "Capacity (BTU)",
      "ความสามารถในการทำความเย็น",
    ],
    parse: (s) => {
      // Extract the integer BTU value: "9,000 BTU/hr" → 9000, "18000 btu" → 18000.
      const m = s.replace(/,/g, "").match(/(\d{3,6})/);
      return m ? parseInt(m[1], 10) : null;
    },
  },
  {
    column: "noiseLevelDb",
    keys: ["Noise Level", "Noise", "Sound Level", "Sound", "ระดับเสียง"],
    parse: (s) => {
      const m = s.match(/(\d+(?:\.\d+)?)/);
      return m ? m[1] : null;
    },
  },
  {
    column: "dimensions",
    keys: ["Dimensions", "Size", "Indoor Dimensions", "ขนาด", "มิติ"],
  },
  {
    column: "roomSizeSqm",
    keys: ["Room Size", "Recommended Room Size", "Coverage Area", "Area", "ขนาดห้อง", "พื้นที่"],
    // Keep the label as-is — admins might enter ranges like "25-30" or "Up to 18".
    // Just strip a trailing unit so it doesn't duplicate when we render " m²".
    parse: (s) => s.replace(/\s*(m²|sqm|sq\.m|ตร\.ม\.|ตารางเมตร)\s*$/i, "").trim() || null,
  },
];

function caseInsensitiveGet(
  obj: Record<string, string>,
  candidates: string[]
): { value: string; matchedKey: string } | null {
  const lowerMap = new Map<string, { key: string; value: string }>();
  for (const [k, v] of Object.entries(obj)) {
    lowerMap.set(k.toLowerCase().trim(), { key: k, value: v });
  }
  for (const candidate of candidates) {
    const hit = lowerMap.get(candidate.toLowerCase().trim());
    if (hit) return { value: hit.value, matchedKey: hit.key };
  }
  return null;
}

async function backfillSeries() {
  console.log("📦 Backfilling products (series-level)...");
  const rows = await db.select().from(products);
  let updated = 0;

  for (const p of rows) {
    const specs = (p.specifications ?? {}) as Record<string, string>;
    const updates: Record<string, string | null> = {};
    const remaining: Record<string, string> = { ...specs };

    for (const { column, keys, parse } of SERIES_KEYS) {
      // Skip if the typed column already has a value (idempotency).
      if (p[column]) continue;

      const hit = caseInsensitiveGet(specs, keys);
      if (!hit) continue;

      const parsed = parse ? parse(hit.value) : hit.value;
      if (parsed == null || (typeof parsed === "string" && parsed.trim() === "")) {
        continue;
      }
      updates[column] = String(parsed);
      delete remaining[hit.matchedKey];
    }

    if (Object.keys(updates).length === 0) continue;

    await db
      .update(products)
      .set({
        ...updates,
        specifications: Object.keys(remaining).length > 0 ? remaining : null,
        updatedAt: new Date(),
      })
      .where(eq(products.id, p.id));
    updated++;
  }
  console.log(`   ✓ Updated ${updated}/${rows.length} series rows`);
}

async function backfillVariants() {
  console.log("🔢 Backfilling product_variants...");
  const rows = await db.select().from(productVariants);
  let updated = 0;

  for (const v of rows) {
    const specs = (v.specifications ?? {}) as Record<string, string>;
    const updates: Record<string, string | number | null> = {};
    const remaining: Record<string, string> = { ...specs };

    for (const { column, keys, parse } of VARIANT_KEYS) {
      const current = v[column];
      if (current != null && current !== "") continue;

      const hit = caseInsensitiveGet(specs, keys);
      if (!hit) continue;

      const parsed = parse ? parse(hit.value) : hit.value;
      if (parsed == null || (typeof parsed === "string" && parsed.trim() === "")) {
        continue;
      }
      updates[column] = parsed;
      delete remaining[hit.matchedKey];
    }

    if (Object.keys(updates).length === 0) continue;

    await db
      .update(productVariants)
      .set({
        ...updates,
        specifications: Object.keys(remaining).length > 0 ? remaining : null,
        updatedAt: new Date(),
      })
      .where(eq(productVariants.id, v.id));
    updated++;
  }
  console.log(`   ✓ Updated ${updated}/${rows.length} variant rows`);
}

async function main() {
  console.log("Starting backfill from JSONB → typed columns...\n");
  await backfillSeries();
  await backfillVariants();
  console.log("\n✅ Backfill complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Backfill failed:", err);
  process.exit(1);
});
