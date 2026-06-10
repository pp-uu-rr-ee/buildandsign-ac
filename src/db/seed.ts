import "dotenv/config";
import { db } from "./index";
import { products, productImages, productVariants } from "./schema";

type SeedVariant = {
  size: string;
  sortOrder: number;
  sku: string;
  priceInSatang: number;
  comparePriceInSatang?: number;
  stock: number;
  // Specs that change with size — Capacity, Cooling Capacity, Noise Level,
  // Indoor Dimensions are typical.
  specifications: Record<string, string>;
};

type SeedProduct = {
  name: string;
  nameTh?: string;
  slug: string;
  shortDescription: string;
  shortDescriptionTh?: string;
  description: string;
  descriptionTh?: string;
  category: "split" | "window" | "portable" | "central" | "cassette" | "ducted";
  status: "active" | "draft" | "archived" | "out_of_stock";
  isFeatured: boolean;
  // Shared specs — Brand, Type, Voltage, Refrigerant, Warranty, EER. These
  // don't change per variant in our catalogue.
  specifications: Record<string, string>;
  metaTitle: string;
  metaDescription: string;
  variants: SeedVariant[];
};

const seedProducts: SeedProduct[] = [
  {
    name: "Carrier Inverter Split Type",
    nameTh: "Carrier อินเวอร์เตอร์ แบบติดผนัง",
    slug: "carrier-inverter-split",
    shortDescription: "Energy-saving inverter technology with auto-clean filter.",
    shortDescriptionTh: "อินเวอร์เตอร์ประหยัดพลังงาน พร้อมฟิลเตอร์ทำความสะอาดตัวเอง",
    description:
      "Carrier Inverter Split Type delivers quiet, efficient cooling for bedrooms and offices. Features auto-restart, sleep mode, and a self-cleaning filter that reduces maintenance.",
    descriptionTh:
      "Carrier แบบติดผนังอินเวอร์เตอร์ ให้ความเย็นเงียบและประหยัดไฟ เหมาะกับห้องนอนและออฟฟิศ มาพร้อมระบบ Auto-Restart, Sleep Mode และฟิลเตอร์ทำความสะอาดตัวเองช่วยลดงานบำรุงรักษา",
    category: "split",
    status: "active",
    isFeatured: true,
    specifications: {
      Brand: "Carrier",
      Type: "Inverter Split Type",
      Voltage: "230V / 50Hz",
      Refrigerant: "R-32",
      EER: "12.5",
      Warranty: "3 years parts & labor",
    },
    metaTitle: "Carrier Inverter Split Type AC | Best Price",
    metaDescription:
      "Carrier inverter split type air conditioner. Energy-efficient, whisper-quiet, with auto-clean filter. Multiple sizes available.",
    variants: [
      {
        size: "0.75 HP",
        sortOrder: 75,
        sku: "CAR-INV-075HP",
        priceInSatang: 2499900,
        comparePriceInSatang: 2799900,
        stock: 12,
        specifications: {
          Capacity: "0.75 HP",
          "Cooling Capacity": "7,000 BTU/hr",
          "Noise Level": "17 dB(A)",
          Dimensions: "770 × 250 × 200 mm (indoor)",
        },
      },
      {
        size: "1.0 HP",
        sortOrder: 100,
        sku: "CAR-INV-10HP",
        priceInSatang: 2899900,
        comparePriceInSatang: 3299900,
        stock: 15,
        specifications: {
          Capacity: "1.0 HP",
          "Cooling Capacity": "9,000 BTU/hr",
          "Noise Level": "19 dB(A)",
          Dimensions: "800 × 280 × 200 mm (indoor)",
        },
      },
      {
        size: "1.5 HP",
        sortOrder: 150,
        sku: "CAR-INV-15HP",
        priceInSatang: 3399900,
        comparePriceInSatang: 3799900,
        stock: 8,
        specifications: {
          Capacity: "1.5 HP",
          "Cooling Capacity": "13,000 BTU/hr",
          "Noise Level": "21 dB(A)",
          Dimensions: "900 × 295 × 220 mm (indoor)",
        },
      },
      {
        size: "2.0 HP",
        sortOrder: 200,
        sku: "CAR-INV-20HP",
        priceInSatang: 3899900,
        stock: 6,
        specifications: {
          Capacity: "2.0 HP",
          "Cooling Capacity": "18,000 BTU/hr",
          "Noise Level": "23 dB(A)",
          Dimensions: "1050 × 310 × 240 mm (indoor)",
        },
      },
    ],
  },
  {
    name: "Daikin Inverter Split Type",
    nameTh: "Daikin อินเวอร์เตอร์ แบบติดผนัง",
    slug: "daikin-inverter-split",
    shortDescription: "Streamer discharge purification + 5-star energy rating.",
    shortDescriptionTh: "ระบบฟอกอากาศ Streamer และประหยัดไฟระดับ 5 ดาว",
    description:
      "Daikin inverter unit uses Streamer technology to break down allergens and odors. Its intelligent-eye sensor detects room occupancy and adjusts cooling automatically to save energy.",
    descriptionTh:
      "Daikin อินเวอร์เตอร์ใช้เทคโนโลยี Streamer สลายสารก่อภูมิแพ้และกลิ่นไม่พึงประสงค์ พร้อมเซนเซอร์ Intelligent Eye ตรวจจับคนในห้องและปรับการทำงานเองเพื่อประหยัดพลังงาน",
    category: "split",
    status: "active",
    isFeatured: true,
    specifications: {
      Brand: "Daikin",
      Type: "Inverter Split Type",
      Voltage: "230V / 50Hz",
      Refrigerant: "R-32",
      EER: "13.0",
      Warranty: "5 years compressor",
    },
    metaTitle: "Daikin Inverter Split AC | Streamer Purification",
    metaDescription:
      "Daikin inverter AC with Streamer purification and intelligent-eye sensor. Multiple sizes from 1.0 HP to 2.5 HP.",
    variants: [
      {
        size: "1.0 HP",
        sortOrder: 100,
        sku: "DAI-INV-10HP",
        priceInSatang: 3199900,
        comparePriceInSatang: 3499900,
        stock: 10,
        specifications: {
          Capacity: "1.0 HP",
          "Cooling Capacity": "9,000 BTU/hr",
          "Noise Level": "19 dB(A)",
          Dimensions: "770 × 285 × 215 mm (indoor)",
        },
      },
      {
        size: "1.5 HP",
        sortOrder: 150,
        sku: "DAI-INV-15HP",
        priceInSatang: 3799900,
        comparePriceInSatang: 4199900,
        stock: 9,
        specifications: {
          Capacity: "1.5 HP",
          "Cooling Capacity": "14,000 BTU/hr",
          "Noise Level": "21 dB(A)",
          Dimensions: "998 × 295 × 218 mm (indoor)",
        },
      },
      {
        size: "2.0 HP",
        sortOrder: 200,
        sku: "DAI-INV-20HP",
        priceInSatang: 4399900,
        stock: 6,
        specifications: {
          Capacity: "2.0 HP",
          "Cooling Capacity": "18,000 BTU/hr",
          "Noise Level": "23 dB(A)",
          Dimensions: "1065 × 310 × 240 mm (indoor)",
        },
      },
      {
        size: "2.5 HP",
        sortOrder: 250,
        sku: "DAI-INV-25HP",
        priceInSatang: 4999900,
        stock: 4,
        specifications: {
          Capacity: "2.5 HP",
          "Cooling Capacity": "24,000 BTU/hr",
          "Noise Level": "25 dB(A)",
          Dimensions: "1170 × 320 × 245 mm (indoor)",
        },
      },
    ],
  },
  {
    name: "Samsung WindFree™ Inverter",
    nameTh: "Samsung WindFree™ อินเวอร์เตอร์",
    slug: "samsung-windfree-inverter",
    shortDescription: "21,000 micro-holes deliver still air without direct airflow.",
    shortDescriptionTh: "ปล่อยลมเย็นผ่านรูเล็กกว่า 21,000 รู สบายโดยไม่โดนลมตรง",
    description:
      "Samsung WindFree™ disperses cold air through 21,000 micro-holes to maintain comfort without cold drafts. AI auto-cooling learns your preferences over time for maximum efficiency.",
    descriptionTh:
      "Samsung WindFree™ กระจายลมเย็นผ่านรูเล็กกว่า 21,000 รู ให้ห้องเย็นสบายโดยไม่โดนลมเป่าโดยตรง พร้อม AI Auto-Cooling เรียนรู้พฤติกรรมการใช้งานเพื่อประสิทธิภาพสูงสุด",
    category: "split",
    status: "active",
    isFeatured: true,
    specifications: {
      Brand: "Samsung",
      Type: "Inverter Split Type",
      Voltage: "230V / 50Hz",
      Refrigerant: "R-32",
      EER: "13.2",
      Warranty: "3 years compressor",
    },
    metaTitle: "Samsung WindFree™ Inverter AC | Still Air Comfort",
    metaDescription:
      "Samsung WindFree™ inverter AC with AI auto-cooling. No cold drafts, whisper-quiet from 16dB. Multiple sizes available.",
    variants: [
      {
        size: "1.0 HP",
        sortOrder: 100,
        sku: "SAM-WF-10HP",
        priceInSatang: 3299900,
        comparePriceInSatang: 3699900,
        stock: 12,
        specifications: {
          Capacity: "1.0 HP",
          "Cooling Capacity": "9,000 BTU/hr",
          "Noise Level": "16 dB(A)",
          Dimensions: "889 × 298 × 215 mm (indoor)",
        },
      },
      {
        size: "1.5 HP",
        sortOrder: 150,
        sku: "SAM-WF-15HP",
        priceInSatang: 3899900,
        comparePriceInSatang: 4299900,
        stock: 8,
        specifications: {
          Capacity: "1.5 HP",
          "Cooling Capacity": "14,000 BTU/hr",
          "Noise Level": "18 dB(A)",
          Dimensions: "1055 × 299 × 215 mm (indoor)",
        },
      },
      {
        size: "2.0 HP",
        sortOrder: 200,
        sku: "SAM-WF-20HP",
        priceInSatang: 4499900,
        stock: 5,
        specifications: {
          Capacity: "2.0 HP",
          "Cooling Capacity": "18,000 BTU/hr",
          "Noise Level": "21 dB(A)",
          Dimensions: "1055 × 299 × 215 mm (indoor)",
        },
      },
    ],
  },
  {
    name: "Panasonic ECONAVI Inverter",
    nameTh: "Panasonic ECONAVI อินเวอร์เตอร์",
    slug: "panasonic-econavi-inverter",
    shortDescription: "ECONAVI sensor optimises cooling based on human activity.",
    shortDescriptionTh: "เซนเซอร์ ECONAVI ปรับการทำความเย็นตามกิจกรรมในห้อง",
    description:
      "The Panasonic ECONAVI inverter system uses dual sensors — Human Activity and Sunlight — to reduce energy consumption by up to 30% without sacrificing comfort.",
    descriptionTh:
      "Panasonic ECONAVI อินเวอร์เตอร์ใช้เซนเซอร์คู่ — ตรวจจับการเคลื่อนไหวและแสงแดด — ช่วยลดการใช้พลังงานได้ถึง 30% โดยไม่ลดทอนความเย็นสบาย",
    category: "split",
    status: "active",
    isFeatured: false,
    specifications: {
      Brand: "Panasonic",
      Type: "Inverter Split Type",
      Voltage: "230V / 50Hz",
      Refrigerant: "R-32",
      EER: "13.5",
      Warranty: "3 years compressor",
    },
    metaTitle: "Panasonic ECONAVI Inverter AC | Up to 30% Energy Savings",
    metaDescription:
      "Panasonic ECONAVI inverter AC with dual-sensor technology. Save up to 30% on electricity.",
    variants: [
      {
        size: "1.0 HP",
        sortOrder: 100,
        sku: "PAN-ECO-10HP",
        priceInSatang: 2999900,
        stock: 10,
        specifications: {
          Capacity: "1.0 HP",
          "Cooling Capacity": "9,000 BTU/hr",
          "Noise Level": "19 dB(A)",
          Dimensions: "780 × 290 × 215 mm (indoor)",
        },
      },
      {
        size: "1.5 HP",
        sortOrder: 150,
        sku: "PAN-ECO-15HP",
        priceInSatang: 3599900,
        stock: 7,
        specifications: {
          Capacity: "1.5 HP",
          "Cooling Capacity": "14,000 BTU/hr",
          "Noise Level": "21 dB(A)",
          Dimensions: "1000 × 295 × 230 mm (indoor)",
        },
      },
      {
        size: "2.0 HP",
        sortOrder: 200,
        sku: "PAN-ECO-20HP",
        priceInSatang: 4599900,
        stock: 8,
        specifications: {
          Capacity: "2.0 HP",
          "Cooling Capacity": "18,000 BTU/hr",
          "Noise Level": "22 dB(A)",
          Dimensions: "1100 × 300 × 240 mm (indoor)",
        },
      },
    ],
  },
  {
    name: "LG Dual Cool Window Type",
    nameTh: "LG Dual Cool แบบหน้าต่าง",
    slug: "lg-dual-cool-window",
    shortDescription: "Compact, budget-friendly window AC for small rooms.",
    shortDescriptionTh: "แอร์หน้าต่างขนาดกะทัดรัด ราคาประหยัด เหมาะกับห้องเล็ก",
    description:
      "LG's Dual Cool window unit is perfect for small bedrooms. Easy to install, built-in dehumidifier, and auto-clean function keep it low-maintenance.",
    descriptionTh:
      "LG Dual Cool แอร์หน้าต่างเหมาะกับห้องนอนขนาดเล็ก ติดตั้งง่าย มีระบบลดความชื้นในตัว และฟังก์ชัน Auto-Clean ลดงานบำรุงรักษา",
    category: "window",
    status: "active",
    isFeatured: false,
    specifications: {
      Brand: "LG",
      Type: "Window Type",
      Voltage: "230V / 50Hz",
      Refrigerant: "R-22",
      EER: "10.8",
      Warranty: "1 year parts & labor",
    },
    metaTitle: "LG Window Type AC | Budget Cooling Solution",
    metaDescription:
      "LG Dual Cool window AC for small rooms. Easy DIY installation, built-in dehumidifier.",
    variants: [
      {
        size: "0.75 HP",
        sortOrder: 75,
        sku: "LG-WIN-075HP",
        priceInSatang: 1599900,
        comparePriceInSatang: 1799900,
        stock: 22,
        specifications: {
          Capacity: "0.75 HP",
          "Cooling Capacity": "7,000 BTU/hr",
          "Coverage Area": "Up to 12 sqm",
        },
      },
      {
        size: "1.0 HP",
        sortOrder: 100,
        sku: "LG-WIN-10HP",
        priceInSatang: 1899900,
        comparePriceInSatang: 2099900,
        stock: 15,
        specifications: {
          Capacity: "1.0 HP",
          "Cooling Capacity": "9,000 BTU/hr",
          "Coverage Area": "Up to 18 sqm",
        },
      },
      {
        size: "1.5 HP",
        sortOrder: 150,
        sku: "LG-WIN-15HP",
        priceInSatang: 2299900,
        stock: 10,
        specifications: {
          Capacity: "1.5 HP",
          "Cooling Capacity": "13,000 BTU/hr",
          "Coverage Area": "Up to 22 sqm",
        },
      },
    ],
  },
];

async function seed() {
  console.log("🌱 Seeding products + variants...");

  // Cascade through children: variants delete via FK cascade on products,
  // images delete via FK cascade on products too. order_items keeps its
  // snapshot rows (FK is ON DELETE SET NULL).
  await db.delete(productImages);
  await db.delete(productVariants);
  await db.delete(products);

  for (const p of seedProducts) {
    const { variants, ...productRow } = p;
    const [inserted] = await db
      .insert(products)
      .values(productRow)
      .returning({ id: products.id });

    await db.insert(productImages).values({
      productId: inserted.id,
      url: `/images/products/${p.slug}.jpg`,
      altText: p.name,
      isPrimary: true,
      sortOrder: 0,
    });

    await db.insert(productVariants).values(
      variants.map((v) => ({
        productId: inserted.id,
        size: v.size,
        sortOrder: v.sortOrder,
        sku: v.sku,
        priceInSatang: v.priceInSatang,
        comparePriceInSatang: v.comparePriceInSatang ?? null,
        stock: v.stock,
        specifications: v.specifications,
      }))
    );

    console.log(`  ✓ ${p.name} (${variants.length} variants)`);
  }

  console.log("✅ Seed complete.");
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
