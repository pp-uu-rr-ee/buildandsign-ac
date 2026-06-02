import "dotenv/config";
import { db } from "./index";
import { products, productImages } from "./schema";

type SeedProduct = {
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  sku: string;
  category: "split" | "window" | "portable" | "central" | "cassette" | "ducted";
  status: "active" | "draft" | "archived" | "out_of_stock";
  priceInCents: number;
  comparePriceInCents?: number;
  stock: number;
  isFeatured: boolean;
  specifications: Record<string, string>;
  metaTitle: string;
  metaDescription: string;
};

const seedProducts: SeedProduct[] = [
  {
    name: "Carrier Inverter Split Type 1.0 HP",
    slug: "carrier-inverter-split-1hp",
    shortDescription: "Energy-saving inverter technology with auto-clean filter.",
    description:
      "The Carrier 1.0 HP Inverter Split Type AC delivers quiet, efficient cooling ideal for small bedrooms and offices. Features auto-restart, sleep mode, and a self-cleaning filter that reduces maintenance.",
    sku: "CAR-INV-10HP",
    category: "split" as const,
    status: "active" as const,
    priceInCents: 2899900,
    comparePriceInCents: 3299900,
    stock: 15,
    isFeatured: true,
    specifications: {
      Brand: "Carrier",
      Capacity: "1.0 HP",
      Type: "Inverter Split Type",
      "Cooling Capacity": "9,000 BTU/hr",
      EER: "12.5",
      Voltage: "230V / 60Hz",
      "Refrigerant": "R-32",
      "Noise Level": "19 dB(A)",
      Dimensions: "800 x 280 x 200 mm (indoor)",
      Warranty: "3 years parts & labor",
    },
    metaTitle: "Carrier 1.0 HP Inverter Split Type AC | Best Price",
    metaDescription:
      "Buy Carrier 1.0 HP Inverter Split Type AC in the Philippines. Energy-efficient, whisper-quiet, with auto-clean filter. Free delivery and installation.",
  },
  {
    name: "Daikin Inverter Split Type 1.5 HP",
    slug: "daikin-inverter-split-15hp",
    shortDescription: "Streamer discharge purification + 5-star energy rating.",
    description:
      "Daikin's 1.5 HP inverter unit uses Streamer technology to break down allergens and odors. Its intelligent-eye sensor detects room occupancy and adjusts cooling automatically to save energy.",
    sku: "DAI-INV-15HP",
    category: "split" as const,
    status: "active" as const,
    priceInCents: 3799900,
    comparePriceInCents: 4199900,
    stock: 10,
    isFeatured: true,
    specifications: {
      Brand: "Daikin",
      Capacity: "1.5 HP",
      Type: "Inverter Split Type",
      "Cooling Capacity": "14,000 BTU/hr",
      EER: "13.0",
      Voltage: "230V / 60Hz",
      Refrigerant: "R-32",
      "Noise Level": "21 dB(A)",
      Dimensions: "998 x 295 x 218 mm (indoor)",
      Warranty: "5 years compressor",
    },
    metaTitle: "Daikin 1.5 HP Inverter Split AC | Streamer Purification",
    metaDescription:
      "Daikin 1.5 HP inverter AC with Streamer purification and intelligent-eye sensor. 5-star energy rating. Shop now for best price.",
  },
  {
    name: "Panasonic ECONAVI Inverter 2.0 HP",
    slug: "panasonic-econavi-inverter-2hp",
    shortDescription: "ECONAVI sensor optimises cooling based on human activity.",
    description:
      "The Panasonic ECONAVI 2.0 HP inverter system uses dual sensors — Human Activity and Sunlight — to reduce energy consumption by up to 30% without sacrificing comfort.",
    sku: "PAN-ECO-20HP",
    category: "split" as const,
    status: "active" as const,
    priceInCents: 4599900,
    stock: 8,
    isFeatured: false,
    specifications: {
      Brand: "Panasonic",
      Capacity: "2.0 HP",
      Type: "Inverter Split Type",
      "Cooling Capacity": "18,000 BTU/hr",
      EER: "13.5",
      Voltage: "230V / 60Hz",
      Refrigerant: "R-32",
      "Noise Level": "22 dB(A)",
      Dimensions: "1100 x 300 x 240 mm (indoor)",
      Warranty: "3 years compressor",
    },
    metaTitle: "Panasonic ECONAVI 2.0 HP Inverter AC | Up to 30% Energy Savings",
    metaDescription:
      "Panasonic ECONAVI 2.0 HP inverter AC with dual-sensor technology. Save up to 30% on electricity. Best price in the Philippines.",
  },
  {
    name: "LG Dual Cool Window Type 0.75 HP",
    slug: "lg-dual-cool-window-075hp",
    shortDescription: "Compact, budget-friendly window AC for small rooms.",
    description:
      "LG's Dual Cool 0.75 HP window unit is perfect for small bedrooms up to 12 sqm. Easy to install, built-in dehumidifier, and auto-clean function keep it low-maintenance.",
    sku: "LG-WIN-075HP",
    category: "window" as const,
    status: "active" as const,
    priceInCents: 1599900,
    comparePriceInCents: 1799900,
    stock: 22,
    isFeatured: false,
    specifications: {
      Brand: "LG",
      Capacity: "0.75 HP",
      Type: "Window Type",
      "Cooling Capacity": "7,000 BTU/hr",
      EER: "10.8",
      Voltage: "230V / 60Hz",
      Refrigerant: "R-22",
      "Coverage Area": "Up to 12 sqm",
      Warranty: "1 year parts & labor",
    },
    metaTitle: "LG 0.75 HP Window Type AC | Budget Cooling Solution",
    metaDescription:
      "LG Dual Cool 0.75 HP window AC for small rooms. Easy DIY installation, built-in dehumidifier. Buy online at best price.",
  },
  {
    name: "Midea Portable Airconditioner 1.0 HP",
    slug: "midea-portable-1hp",
    shortDescription: "No installation needed. Move it anywhere in your home.",
    description:
      "The Midea 1.0 HP portable AC requires no permanent installation — just plug it in and vent through a window. Ideal for renters or rooms that can't accommodate a window or split unit.",
    sku: "MID-PORT-10HP",
    category: "portable" as const,
    status: "active" as const,
    priceInCents: 2199900,
    stock: 5,
    isFeatured: false,
    specifications: {
      Brand: "Midea",
      Capacity: "1.0 HP",
      Type: "Portable",
      "Cooling Capacity": "9,000 BTU/hr",
      EER: "9.5",
      Voltage: "230V / 60Hz",
      Refrigerant: "R-290",
      "Coverage Area": "Up to 20 sqm",
      Warranty: "1 year parts & labor",
    },
    metaTitle: "Midea 1.0 HP Portable AC | No Installation Required",
    metaDescription:
      "Midea portable air conditioner. No installation, no tools — just plug in and cool. Ideal for renters and multi-room use.",
  },
  {
    name: "Samsung WindFree™ Inverter 1.0 HP",
    slug: "samsung-windfree-inverter-1hp",
    shortDescription: "21,000 micro-holes deliver still air without direct airflow.",
    description:
      "Samsung WindFree™ disperses cold air through 21,000 micro-holes to maintain comfort without cold drafts. AI auto-cooling learns your preferences over time for maximum efficiency.",
    sku: "SAM-WF-10HP",
    category: "split" as const,
    status: "active" as const,
    priceInCents: 3299900,
    comparePriceInCents: 3699900,
    stock: 12,
    isFeatured: true,
    specifications: {
      Brand: "Samsung",
      Capacity: "1.0 HP",
      Type: "Inverter Split Type",
      "Cooling Capacity": "9,000 BTU/hr",
      EER: "13.2",
      Voltage: "230V / 60Hz",
      Refrigerant: "R-32",
      "Noise Level": "16 dB(A)",
      Dimensions: "889 x 298 x 215 mm (indoor)",
      Warranty: "3 years compressor",
    },
    metaTitle: "Samsung WindFree™ 1.0 HP Inverter AC | Still Air Comfort",
    metaDescription:
      "Samsung WindFree™ 1.0 HP inverter AC with AI auto-cooling. No cold drafts, whisper-quiet at 16dB. Shop at best price.",
  },
];

async function seed() {
  console.log("🌱 Seeding products...");

  await db.delete(productImages);
  await db.delete(products);

  for (const p of seedProducts) {
    const [inserted] = await db.insert(products).values(p).returning({ id: products.id });

    // Insert placeholder image for each product
    await db.insert(productImages).values({
      productId: inserted.id,
      url: `/images/products/${p.slug}.jpg`,
      altText: p.name,
      isPrimary: true,
      sortOrder: 0,
    });

    console.log(`  ✓ ${p.name}`);
  }

  console.log("✅ Seed complete.");
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
