/**
 * Import products + variants from a published Google Sheet CSV.
 *
 * ─── Setup ────────────────────────────────────────────────────────────────────
 * 1. In Google Sheets:  File → Share → Publish to web → Sheet1 → CSV → Publish
 * 2. Copy the published URL.
 *
 * ─── Usage ────────────────────────────────────────────────────────────────────
 *   npm run db:import-sheet -- "<published_csv_url>"             # upsert (default)
 *   npm run db:import-sheet -- "<published_csv_url>" --replace   # wipe + insert
 *
 * Examples:
 *   npm run db:import-sheet -- "https://docs.google.com/spreadsheets/d/e/2PACX-…/pub?output=csv"
 *   npm run db:import-sheet -- ./aircon_master_list.csv          # local file works too
 *
 * ─── Required CSV columns (one row per VARIANT) ──────────────────────────────
 *   series_name      — Product series name (e.g. "Carrier Inverter Split Type")
 *   slug             — URL slug. Auto-generated from series_name if blank.
 *   category         — split | window | portable | central | cassette | ducted
 *   size             — Variant size label, e.g. "1.0 HP"
 *   price_baht       — Variant price in BAHT (not satang!)
 *
 * ─── Optional columns ────────────────────────────────────────────────────────
 *   Series-level (same value across all rows of the same series):
 *     series_name_th             Thai series name
 *     short_description          English short description
 *     short_description_th
 *     description                English long description
 *     description_th
 *     status                     active | draft | archived | out_of_stock (default: active)
 *     is_featured                TRUE / 1 / yes (anything else = false)
 *     image_url                  URL or /images path for the primary image
 *     spec.<KEY>                 Series-shared spec, e.g. "spec.Brand", "spec.EER"
 *
 *   Variant-level:
 *     sort_order                 Integer for display order (default: row index × 100)
 *     sku                        Variant SKU
 *     compare_price_baht         Crossed-out price in BAHT
 *     stock                      Integer (default: 0)
 *     low_stock_threshold        Integer (default: 5)
 *     variant_spec.<KEY>         Variant-specific spec, e.g. "variant_spec.Capacity"
 */
import "dotenv/config";
import { db } from "./index";
import { products, productImages, productVariants } from "./schema";
import { eq } from "drizzle-orm";
import { readFileSync } from "node:fs";

// ─── CLI args ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const replaceMode = args.includes("--replace");
const source = args.find((a) => !a.startsWith("--"));

if (!source) {
  console.error(
    "Usage: npm run db:import-sheet -- <csv_url_or_path> [--replace]"
  );
  process.exit(1);
}

// ─── Minimal CSV parser (handles quoted fields + escaped quotes + commas/newlines in quotes) ──
// ─── Header alias map ────────────────────────────────────────────────────────
// Maps the canonical column name we want to a list of acceptable aliases
// (English variants + Thai). All comparisons are lowercased and have
// non-alphanumerics stripped, so "Series Name", "series_name", "ชื่อรุ่น"
// all match. The script renames every header to the canonical form before
// downstream code touches the row.
const HEADER_ALIASES: Record<string, string[]> = {
  series_name: ["series", "seriesname", "name", "productname", "ชื่อรุ่น", "ชื่อสินค้า", "รุ่น"],
  series_name_th: ["seriesnameth", "nameth", "ชื่อรุ่นไทย", "ชื่อภาษาไทย"],
  slug: ["url", "urlslug"],
  category: ["cat", "type", "ประเภท", "หมวด", "หมวดหมู่"],
  size: ["variantsize", "ขนาด", "btu"],
  sort_order: ["sortorder", "order", "ลำดับ"],
  sku: ["รหัส", "รหัสสินค้า"],
  price_baht: ["price", "ราคา"],
  compare_price_baht: ["compareprice", "originalprice", "ราคาเดิม", "ราคาเปรียบเทียบ"],
  stock: ["qty", "quantity", "จำนวน", "สต็อก", "สต๊อก"],
  low_stock_threshold: ["lowstock", "lowstockthreshold"],
  short_description: ["shortdesc", "shortdescription"],
  short_description_th: ["shortdescth", "shortdescriptionth", "คำอธิบายสั้น"],
  description: ["desc", "longdesc"],
  description_th: ["descth", "descriptionth", "คำอธิบาย"],
  status: ["state", "สถานะ"],
  is_featured: ["featured", "isfeatured", "แนะนำ"],
  image_url: ["image", "imageurl", "img", "รูป"],

  // ── Typed series-level specs ────────────────────────────────────────────
  brand: ["brandname", "ยี่ห้อ"],
  eer: ["energyefficiencyratio", "seer"],
  voltage: ["powersupply", "power", "แรงดันไฟฟ้า", "ไฟ"],
  refrigerant: ["gas", "น้ำยา", "สารทำความเย็น"],
  warranty_text: ["warranty", "การรับประกัน", "รับประกัน"],
  energy_rating: ["energyrating", "energylabel", "เบอร์ประหยัดไฟ", "ฉลากประหยัดไฟ", "rating"],

  // ── Typed variant-level specs ───────────────────────────────────────────
  cooling_capacity_btu: ["coolingcapacity", "coolingcapacitybtu", "btuvalue", "ความสามารถในการทำความเย็น"],
  noise_level_db: ["noiselevel", "noise", "soundlevel", "ระดับเสียง"],
  dimensions: ["dim", "indoordimensions", "size_mm", "มิติ"],
  room_size_sqm: ["roomsize", "roomsizesqm", "roomarea", "coveragearea", "ขนาดห้อง", "พื้นที่"],
};

/** Strip everything that isn't a letter/digit and lowercase, for fuzzy header matching. */
function normalizeHeader(s: string): string {
  return s
    .replace(/^﻿/, "") // strip leading BOM
    .toLowerCase()
    .replace(/[\s._-]+/g, "")
    .trim();
}

/** Resolve a raw header to its canonical name (or keep raw for spec.* / variant_spec.*). */
function canonicalizeHeader(raw: string): string {
  const r = raw.trim();
  if (!r) return r;

  // spec.<key> and variant_spec.<key> stay as-is (only the prefix matters).
  if (/^spec\./i.test(r)) return "spec." + r.slice(5).trim();
  if (/^variant_spec\./i.test(r)) return "variant_spec." + r.slice(13).trim();

  const norm = normalizeHeader(r);
  for (const [canonical, aliases] of Object.entries(HEADER_ALIASES)) {
    if (norm === normalizeHeader(canonical)) return canonical;
    if (aliases.some((a) => normalizeHeader(a) === norm)) return canonical;
  }
  return r;
}

function parseCsv(text: string): {
  rows: Record<string, string>[];
  headers: string[];
  rawHeaders: string[];
} {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  // Strip BOM if present
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i += 2;
      } else if (c === '"') {
        inQuotes = false;
        i++;
      } else {
        field += c;
        i++;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
        i++;
      } else if (c === ",") {
        row.push(field);
        field = "";
        i++;
      } else if (c === "\r") {
        // ignore — handled by \n
        i++;
      } else if (c === "\n") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
        i++;
      } else {
        field += c;
        i++;
      }
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  if (rows.length === 0) return { rows: [], headers: [], rawHeaders: [] };
  const rawHeaders = rows[0].map((h) => h.trim());
  const headers = rawHeaders.map(canonicalizeHeader);

  const data = rows.slice(1)
    .filter((r) => r.some((cell) => cell.trim() !== ""))
    .map((r) => {
      const obj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        obj[h] = (r[idx] ?? "").trim();
      });
      return obj;
    });
  return { rows: data, headers, rawHeaders };
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

function truthy(v: string | undefined): boolean {
  if (!v) return false;
  const x = v.trim().toLowerCase();
  return x === "true" || x === "1" || x === "yes" || x === "y";
}

function toInt(v: string | undefined, fallback = 0): number {
  const n = parseInt((v ?? "").replace(/[, ]/g, ""), 10);
  return Number.isFinite(n) ? n : fallback;
}

function toBahtCents(v: string | undefined): number | null {
  if (v == null || v.trim() === "") return null;
  const n = parseFloat((v ?? "").replace(/[, ]/g, ""));
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

const VALID_CATEGORIES = [
  "split", "window", "portable", "central", "cassette", "ducted",
] as const;
type Category = (typeof VALID_CATEGORIES)[number];

/** Map friendly category labels in the sheet to our DB enum. */
const CATEGORY_ALIASES: Record<string, Category> = {
  // Split type / wall-mounted indoor unit
  split: "split",
  "wall-mounted": "split",
  "wallmounted": "split",
  wallmount: "split",
  wall: "split",
  ติดผนัง: "split",
  แอร์ผนัง: "split",
  // Window
  window: "window",
  windowtype: "window",
  หน้าต่าง: "window",
  // Portable
  portable: "portable",
  เคลื่อนที่: "portable",
  // Central / ducted
  central: "central",
  centralac: "central",
  ducted: "ducted",
  duct: "ducted",
  // Cassette / ceiling
  cassette: "cassette",
  ceiling: "cassette",
  ceilingcassette: "cassette",
  ฝังฝ้า: "cassette",
  แคสเซท: "cassette",
};

function normalizeCategory(raw: string | undefined): Category | null {
  if (!raw) return null;
  const key = raw
    .toLowerCase()
    .replace(/[\s._-]+/g, "")
    .trim();
  return CATEGORY_ALIASES[key] ?? null;
}

const VALID_STATUSES = [
  "active", "draft", "archived", "out_of_stock",
] as const;
type Status = (typeof VALID_STATUSES)[number];

/** Friendly status labels in the sheet → our DB enum. */
const STATUS_ALIASES: Record<string, Status> = {
  active: "active",
  on: "active",
  enabled: "active",
  ใช้งาน: "active",
  ขาย: "active",

  inactive: "archived",
  off: "archived",
  disabled: "archived",
  archived: "archived",
  hidden: "archived",
  ไม่ใช้งาน: "archived",
  ยกเลิก: "archived",

  draft: "draft",
  pending: "draft",
  ร่าง: "draft",

  outofstock: "out_of_stock",
  out_of_stock: "out_of_stock",
  oos: "out_of_stock",
  สินค้าหมด: "out_of_stock",
  หมด: "out_of_stock",
};

function normalizeStatus(raw: string | undefined): Status {
  if (!raw) return "active";
  const key = raw
    .toLowerCase()
    .replace(/[\s._-]+/g, "")
    .trim();
  return STATUS_ALIASES[key] ?? "active";
}

function pickSpecs(row: Record<string, string>, prefix: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(row)) {
    if (!k.startsWith(prefix)) continue;
    if (!v || !v.trim()) continue;
    const key = k.slice(prefix.length).trim();
    if (key) out[key] = v.trim();
  }
  return out;
}

function trimOrNull(v: string | undefined): string | null {
  if (!v) return null;
  const t = v.trim();
  return t ? t : null;
}

/** Extract just the leading number from a string (e.g. "12.50 EER" → "12.50"). */
function extractDecimal(v: string | undefined): string | null {
  if (!v) return null;
  const m = v.match(/\d+(\.\d+)?/);
  return m ? m[0] : null;
}

/** Extract the most prominent integer (e.g. "9,000 BTU/hr" → 9000). */
function extractInt(v: string | undefined): number | null {
  if (!v) return null;
  const m = v.replace(/,/g, "").match(/\d+/);
  if (!m) return null;
  const n = parseInt(m[0], 10);
  return Number.isFinite(n) ? n : null;
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function loadCsv(src: string): Promise<string> {
  if (src.startsWith("http://") || src.startsWith("https://")) {
    const res = await fetch(src);
    if (!res.ok) {
      throw new Error(`Failed to fetch CSV (HTTP ${res.status}): ${src}`);
    }
    return await res.text();
  }
  return readFileSync(src, "utf8");
}

async function importSheet() {
  console.log(`📥 Reading: ${source}`);
  const csv = await loadCsv(source!);
  const { rows, headers, rawHeaders } = parseCsv(csv);
  console.log(`   ${rows.length} variant row(s) parsed`);

  // Show what we picked up — helps debug column-name issues quickly.
  console.log(`   Headers found (raw → canonical):`);
  for (let i = 0; i < rawHeaders.length; i++) {
    const raw = rawHeaders[i];
    const canon = headers[i];
    const marker = raw === canon ? " " : "→";
    console.log(`     ${marker} "${raw}"${raw === canon ? "" : ` → "${canon}"`}`);
  }

  if (rows.length === 0) {
    throw new Error("No rows in CSV.");
  }

  // Validate the bare minimum.
  const required = ["series_name", "category", "size", "price_baht"];
  const missing = required.filter((col) => !headers.includes(col));
  if (missing.length > 0) {
    throw new Error(
      `Missing required column(s): ${missing.join(", ")}\n` +
        `   Saw headers: ${rawHeaders.join(", ")}\n` +
        `   Tip: rename your sheet columns to: ${required.join(", ")} ` +
        `(or use Thai aliases — see HEADER_ALIASES in the script).`
    );
  }

  // Group rows by series_name. The per-row `slug` column (if present) is
  // typically a variant SKU like "samsung-ar09aghqa" and is NOT used as a
  // series identifier — we derive the series slug from series_name instead
  // so all variants of the same series land under one product row.
  type SeriesGroup = {
    slug: string;
    seriesName: string;
    rows: Record<string, string>[];
  };
  const groups = new Map<string, SeriesGroup>();
  for (const r of rows) {
    const seriesName = r.series_name?.trim();
    if (!seriesName) continue;
    const key = seriesName.toLowerCase();
    if (!groups.has(key)) {
      // Series slug: derive from series_name to keep it stable across variants.
      const slug = slugify(seriesName);
      groups.set(key, { slug, seriesName, rows: [] });
    }
    groups.get(key)!.rows.push(r);
  }

  console.log(`   ${groups.size} series found`);
  console.log(replaceMode ? "🧹 Mode: REPLACE (wipe existing)" : "🔁 Mode: UPSERT");

  if (replaceMode) {
    await db.delete(productImages);
    await db.delete(productVariants);
    await db.delete(products);
  }

  let createdCount = 0;
  let updatedCount = 0;

  for (const group of groups.values()) {
    const first = group.rows[0];

    const category = normalizeCategory(first.category);
    if (!category) {
      console.warn(
        `  ⚠ Skipping "${group.seriesName}": unknown category "${first.category}". ` +
          `Add an alias in CATEGORY_ALIASES.`
      );
      continue;
    }
    const status = normalizeStatus(first.status);

    const seriesData = {
      name: group.seriesName,
      nameTh: trimOrNull(first.series_name_th),
      slug: group.slug,
      shortDescription: trimOrNull(first.short_description),
      shortDescriptionTh: trimOrNull(first.short_description_th),
      description: trimOrNull(first.description),
      descriptionTh: trimOrNull(first.description_th),
      category,
      status,
      // Typed series-level specs
      brand: trimOrNull(first.brand),
      eer: extractDecimal(first.eer),
      voltage: trimOrNull(first.voltage),
      refrigerant: trimOrNull(first.refrigerant),
      warrantyText: trimOrNull(first.warranty_text),
      energyRating: trimOrNull(first.energy_rating),
      // Anything else under spec.<KEY> goes into JSONB
      specifications: Object.keys(pickSpecs(first, "spec.")).length
        ? pickSpecs(first, "spec.")
        : null,
      isFeatured: truthy(first.is_featured),
      updatedAt: new Date(),
    };

    // Upsert series.
    let productId: string;
    const [existing] = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.slug, group.slug))
      .limit(1);

    if (existing) {
      await db
        .update(products)
        .set(seriesData)
        .where(eq(products.id, existing.id));
      productId = existing.id;
      // Wipe & re-insert variants so the CSV is the source of truth.
      await db.delete(productVariants).where(eq(productVariants.productId, productId));
      updatedCount++;
    } else {
      const [created] = await db
        .insert(products)
        .values(seriesData)
        .returning({ id: products.id });
      productId = created.id;
      createdCount++;
    }

    // Primary image — only insert if URL is provided AND no image exists yet.
    const imageUrl = first.image_url?.trim();
    if (imageUrl) {
      const [hasImage] = await db
        .select({ id: productImages.id })
        .from(productImages)
        .where(eq(productImages.productId, productId))
        .limit(1);
      if (!hasImage) {
        await db.insert(productImages).values({
          productId,
          url: imageUrl,
          altText: group.seriesName,
          isPrimary: true,
          sortOrder: 0,
        });
      }
    }

    // Variants — one row per CSV row in this group.
    const variantValues = group.rows
      .map((r, idx) => {
        const size = r.size?.trim();
        const price = toBahtCents(r.price_baht);
        if (!size || price == null) return null;
        const sortOrder = toInt(r.sort_order, (idx + 1) * 100);
        const sku = r.sku?.trim() || null;
        const compare = toBahtCents(r.compare_price_baht);
        const stock = toInt(r.stock, 0);
        const lowStockThreshold = toInt(r.low_stock_threshold, 5);
        const variantSpecs = pickSpecs(r, "variant_spec.");

        return {
          productId,
          size,
          sortOrder,
          sku,
          priceInSatang: price,
          comparePriceInSatang: compare,
          stock,
          lowStockThreshold,
          // Typed variant-level specs
          coolingCapacityBtu: extractInt(r.cooling_capacity_btu),
          noiseLevelDb: extractDecimal(r.noise_level_db),
          dimensions: trimOrNull(r.dimensions),
          roomSizeSqm: trimOrNull(r.room_size_sqm),
          // Anything else under variant_spec.<KEY> → JSONB
          specifications:
            Object.keys(variantSpecs).length > 0 ? variantSpecs : null,
        };
      })
      .filter((v): v is NonNullable<typeof v> => v !== null);

    if (variantValues.length === 0) {
      console.warn(`  ⚠ "${group.seriesName}": no valid variants — skipping variants`);
    } else {
      await db.insert(productVariants).values(variantValues);
    }

    console.log(
      `  ✓ ${group.seriesName} (${variantValues.length} variant${variantValues.length === 1 ? "" : "s"})`
    );
  }

  console.log("");
  console.log(`✅ Done. Created ${createdCount}, updated ${updatedCount}.`);
  process.exit(0);
}

importSheet().catch((err) => {
  console.error("❌ Import failed:", err);
  process.exit(1);
});
