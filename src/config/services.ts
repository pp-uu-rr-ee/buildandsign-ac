import {
  Wrench,
  Sparkles,
  Package,
  ClipboardCheck,
  type LucideIcon,
} from "lucide-react";

/** Services that are currently bookable end-to-end (also matches DB enum). */
export type ServiceId = "cleaning" | "repair" | "installation" | "inspection";

/** Top-level grouping shown on the services page. */
export type ServiceGroup = "btu" | "diagnostic";

export type BtuTier = {
  /** Display label, e.g. "9,000–13,000 BTU" */
  range: string;
  rangeTh: string;
  /** Price for this tier, in satang (1 THB = 100). */
  priceInSatang: number;
  /** Set true to show a "+" after the price (entry-level / starts at). */
  startingAt?: boolean;
};

export type ServiceConfig = {
  /** Stable id. Bookable services must use a value of ServiceId. */
  id: string;
  title: string;
  titleTh: string;
  tagline: string;
  taglineTh: string;
  description: string;
  descriptionTh: string;
  durationMinutes: number;

  /**
   * Lowest visible price (in satang). For BTU services this is the smallest
   * tier; for diagnostic services this is the diagnostic fee.
   */
  basePriceInSatang: number;

  /** If true, base price represents a starting/entry price, not a flat rate. */
  startingPrice?: boolean;

  /** Group this service belongs to. */
  group: ServiceGroup;

  /** BTU pricing tiers (only for group="btu"). */
  btuPricing?: BtuTier[];

  /** Diagnostic fee in satang (only for group="diagnostic"). Same as basePriceInSatang. */
  diagnosticFeeInSatang?: number;

  /** Per-service overrides shown above the fee notice in diagnostic cards. */
  feeLabel?: string;
  feeLabelTh?: string;
  feeNote?: string;
  feeNoteTh?: string;

  /** Extra variables that affect price (installation: extra pipe, drilling, etc). */
  extraFactors?: string[];
  extraFactorsTh?: string[];

  /** Common symptoms users select for diagnostic services. */
  commonSymptoms?: string[];
  commonSymptomsTh?: string[];

  icon: LucideIcon;

  /** False = display only, no online booking yet (show "call to book"). */
  bookable: boolean;

  /** Surface this service on the marketing homepage. */
  featuredOnHome?: boolean;

  includes: string[];
  includesTh: string[];
  faqs: { question: string; answer: string }[];
  faqsTh: { question: string; answer: string }[];
};

export const servicesConfig: ServiceConfig[] = [
  // ─── Group A: BTU-based pricing ────────────────────────────────────────────
  {
    id: "cleaning",
    title: "AC Cleaning",
    titleTh: "ล้างแอร์",
    tagline: "Best for online booking — priced clearly by BTU.",
    taglineTh: "เหมาะที่สุดสำหรับการจองออนไลน์ — ราคาชัดเจนตามขนาด BTU",
    description:
      "Routine cleaning that removes dust, mold, and bacteria from filters, coils, and the drainage system. A clean unit runs more efficiently and improves indoor air quality.",
    descriptionTh:
      "บริการล้างแอร์ตามรอบ ขจัดฝุ่น เชื้อรา และแบคทีเรียออกจากฟิลเตอร์ คอยล์ และระบบระบายน้ำ เครื่องที่สะอาดทำงานได้มีประสิทธิภาพมากขึ้นและช่วยปรับปรุงคุณภาพอากาศภายในบ้าน",
    durationMinutes: 60,
    basePriceInSatang: 50000, // 500 บาท
    group: "btu",
    bookable: true,
    featuredOnHome: true,
    btuPricing: [
      { range: "9,000–13,000 BTU", rangeTh: "9,000–13,000 BTU", priceInSatang: 50000 },
      { range: "18,000–24,000 BTU", rangeTh: "18,000–24,000 BTU", priceInSatang: 70000 },
      { range: "30,000–36,000 BTU", rangeTh: "30,000–36,000 BTU", priceInSatang: 90000 },
      { range: "48,000+ BTU", rangeTh: "48,000+ BTU", priceInSatang: 120000, startingAt: true },
    ],
    icon: Sparkles,
    includes: [
      "Filter wash and dry",
      "Evaporator coil cleaning",
      "Drainage pipe flush",
      "Fan blade wipe-down",
      "Exterior cabinet wipe",
      "Before-and-after performance check",
    ],
    includesTh: [
      "ล้างและอบแห้งฟิลเตอร์",
      "ล้างคอยล์เย็น",
      "เป่าล้างท่อระบายน้ำ",
      "เช็ดใบพัดลม",
      "เช็ดถูตัวเครื่องภายนอก",
      "ตรวจสอบประสิทธิภาพก่อนและหลังให้บริการ",
    ],
    faqs: [
      {
        question: "How often should I have my AC cleaned?",
        answer:
          "Every 3–6 months for residential units. Heavy-use or commercial units benefit from cleaning every 2–3 months.",
      },
      {
        question: "How long does cleaning take?",
        answer: "Approximately 1 hour per indoor unit.",
      },
    ],
    faqsTh: [
      {
        question: "ควรล้างแอร์บ่อยแค่ไหน?",
        answer: "ทุก 3–6 เดือนสำหรับเครื่องใช้ในบ้าน เครื่องที่ใช้งานหนักหรือเชิงพาณิชย์ควรล้างทุก 2–3 เดือน",
      },
      {
        question: "ล้างแอร์ใช้เวลานานแค่ไหน?",
        answer: "ประมาณ 1 ชั่วโมงต่อเครื่อง",
      },
    ],
  },

  {
    id: "installation",
    title: "New AC Installation",
    titleTh: "ติดตั้งแอร์ใหม่",
    tagline: "Starting price by BTU — final quote depends on the site.",
    taglineTh: "ราคาเริ่มต้นตาม BTU — ราคาจริงขึ้นอยู่กับหน้างาน",
    description:
      "Proper installation is critical to your AC's lifespan and efficiency. The starting price covers bracket mounting, refrigerant line up to 3m, electrical connection, and commissioning. Final quote depends on pipe length, drilling, brackets and electrical work needed.",
    descriptionTh:
      "การติดตั้งที่ถูกต้องเป็นสิ่งสำคัญต่ออายุการใช้งานและประสิทธิภาพของแอร์ ราคาเริ่มต้นครอบคลุมการติดตั้งแบรกเกต ท่อน้ำยาไม่เกิน 3 เมตร เดินไฟ และทดสอบระบบ ราคาจริงขึ้นอยู่กับระยะท่อ การเจาะผนัง ขาแขวน และงานไฟฟ้าที่ต้องเพิ่ม",
    durationMinutes: 180,
    basePriceInSatang: 300000, // 3,000 บาท
    startingPrice: true,
    group: "btu",
    bookable: true,
    featuredOnHome: true,
    btuPricing: [
      { range: "Up to 18,000 BTU", rangeTh: "ไม่เกิน 18,000 BTU", priceInSatang: 300000 },
      { range: "24,000 BTU", rangeTh: "24,000 BTU", priceInSatang: 400000 },
      { range: "36,000+ BTU", rangeTh: "36,000+ BTU", priceInSatang: 500000, startingAt: true },
    ],
    extraFactors: [
      "Refrigerant pipe length (per metre)",
      "Extra electrical wiring",
      "Wall drilling",
      "Mounting bracket",
    ],
    extraFactorsTh: [
      "ระยะท่อ (คิดเป็นเมตร)",
      "เดินไฟเพิ่ม",
      "เจาะผนัง",
      "ขาแขวน",
    ],
    icon: Package,
    includes: [
      "Standard bracket installation",
      "Up to 3 metres of refrigerant line",
      "Electrical connection",
      "Vacuum and refrigerant charge",
      "Thermostat and remote setup",
      "Test run and client walkthrough",
    ],
    includesTh: [
      "ติดตั้งแบรกเกตมาตรฐาน",
      "ท่อน้ำยาสูงสุด 3 เมตร",
      "ต่อสายไฟฟ้า",
      "ดูดสูญญากาศและเติมน้ำยา",
      "ตั้งค่าเทอร์โมสตัทและรีโมต",
      "ทดสอบการทำงานและอธิบายการใช้งาน",
    ],
    faqs: [
      {
        question: "Why is this only a starting price?",
        answer:
          "Installation depends heavily on the site — pipe length, drilling, electrical work and bracket type all add to the final cost. We confirm the full quote on-site before any work starts.",
      },
    ],
    faqsTh: [
      {
        question: "ทำไมถึงเป็นราคาเริ่มต้นเท่านั้น?",
        answer:
          "การติดตั้งขึ้นกับหน้างาน — ระยะท่อ การเจาะ งานไฟ และขาแขวนจะมีผลต่อราคาจริง เราจะแจ้งราคารวมหน้างานก่อนเริ่มทำเสมอ",
      },
    ],
  },

  // ─── Group B: Diagnostic-fee pricing ───────────────────────────────────────
  {
    id: "repair",
    title: "AC Repair",
    titleTh: "ซ่อมแอร์",
    tagline: "Pay a flat diagnostic fee — repair quote given on-site.",
    taglineTh: "จ่ายค่าตรวจเช็คแบบเหมา — ราคาซ่อมแจ้งหลังประเมิน",
    description:
      "AC repairs vary wildly — refrigerant top-up, capacitor swap, motor replacement, PCB swap, drain pipe flush. We charge a flat ฿300 diagnostic fee and quote the actual repair after our technician evaluates the unit on-site.",
    descriptionTh:
      "งานซ่อมแต่ละเคสราคาต่างกันมาก — เติมน้ำยา เปลี่ยนคาปาซิเตอร์ เปลี่ยนมอเตอร์ เปลี่ยนบอร์ด ล้างท่อน้ำทิ้ง เราเก็บค่าตรวจเช็คแบบเหมา 300 บาท แล้วช่างจะเสนอราคาซ่อมจริงหลังตรวจหน้างาน",
    durationMinutes: 60,
    basePriceInSatang: 30000, // 300 บาท — diagnostic fee
    diagnosticFeeInSatang: 30000,
    group: "diagnostic",
    bookable: true,
    featuredOnHome: true,
    commonSymptoms: [
      "Refrigerant top-up",
      "Capacitor replacement",
      "Motor replacement",
      "PCB / control board replacement",
      "Drain pipe flush",
    ],
    commonSymptomsTh: [
      "เติมน้ำยา",
      "เปลี่ยนคาปาซิเตอร์",
      "เปลี่ยนมอเตอร์",
      "เปลี่ยนบอร์ด",
      "ล้างท่อน้ำทิ้ง",
    ],
    icon: Wrench,
    includes: [
      "On-site diagnosis",
      "Error code reading",
      "Refrigerant pressure check",
      "Component inspection",
      "Written quote for repair",
      "Diagnostic fee waived if you proceed with repair",
    ],
    includesTh: [
      "วินิจฉัยถึงหน้างาน",
      "อ่านรหัสข้อผิดพลาด",
      "ทดสอบความดันน้ำยา",
      "ตรวจสอบชิ้นส่วน",
      "ใบเสนอราคาซ่อมเป็นลายลักษณ์อักษร",
      "ค่าตรวจหักออกหากตกลงซ่อมต่อ",
    ],
    faqs: [
      {
        question: "Why a separate diagnostic fee?",
        answer:
          "Repair prices vary too much by issue (a refrigerant top-up vs a PCB replacement) to publish upfront. The ฿300 covers our travel + diagnosis time. If you go ahead with the repair, the fee is deducted from the total.",
      },
    ],
    faqsTh: [
      {
        question: "ทำไมต้องคิดค่าตรวจแยก?",
        answer:
          "ราคาซ่อมแต่ละเคสต่างกันมาก (เติมน้ำยา vs เปลี่ยนบอร์ด) จึงไม่สามารถประกาศราคาคงที่ได้ ค่าตรวจ 300 บาทคือค่าเดินทาง + เวลาตรวจ ถ้าตกลงซ่อมต่อจะหักค่าตรวจออกจากยอดรวม",
      },
    ],
  },

  {
    id: "inspection",
    title: "AC Inspection",
    titleTh: "ตรวจสภาพแอร์",
    tagline: "Preventive 25-point health check with a written report.",
    taglineTh: "ตรวจสุขภาพแอร์เชิงป้องกัน 25 จุด พร้อมรายงานสรุป",
    description:
      "A scheduled, no-problem-required check-up. Our technician runs a 25-point inspection across cooling performance, refrigerant level, electrical safety, mounting and drainage — then hands you a detailed report. Ideal before peak summer, after a long period without service, or when buying a secondhand unit.",
    descriptionTh:
      "การตรวจสภาพแบบป้องกัน ไม่ต้องรอให้เสียก่อน ช่างจะตรวจ 25 จุดทั่วระบบ ทั้งประสิทธิภาพการทำความเย็น ระดับน้ำยา ความปลอดภัยทางไฟฟ้า การยึดติด และการระบายน้ำ พร้อมส่งรายงานสรุปให้ เหมาะก่อนเข้าหน้าร้อน หลังไม่ได้ใช้บริการนาน หรือก่อนซื้อเครื่องมือสอง",
    durationMinutes: 60,
    basePriceInSatang: 50000, // 500 บาท inspection fee
    diagnosticFeeInSatang: 50000,
    group: "diagnostic",
    bookable: true,
    featuredOnHome: true,
    feeLabel: "Inspection fee",
    feeLabelTh: "ค่าตรวจสภาพ",
    feeNote:
      "Includes the full 25-point report. No repair work is done — we recommend follow-ups separately if needed.",
    feeNoteTh:
      "รวมรายงาน 25 จุดครบถ้วน ไม่มีงานซ่อม หากเจอจุดที่ต้องแก้ไขเราจะแนะนำให้จองรอบใหม่",
    commonSymptoms: [
      "Pre-summer tune-up",
      "Annual maintenance",
      "Pre-purchase inspection (secondhand)",
      "Post-storm check",
      "Move-in / move-out",
    ],
    commonSymptomsTh: [
      "ตรวจก่อนเข้าหน้าร้อน",
      "ตรวจประจำปี",
      "ตรวจก่อนซื้อเครื่องมือสอง",
      "ตรวจหลังพายุ",
      "ตรวจก่อนเข้า/ออกบ้าน",
    ],
    icon: ClipboardCheck,
    includes: [
      "25-point system check",
      "Refrigerant level assessment",
      "Electrical safety inspection",
      "Mounting and structural check",
      "Detailed PDF report with photos",
      "Recommendations for cleaning or repair if needed",
    ],
    includesTh: [
      "ตรวจสอบ 25 จุด",
      "ประเมินระดับน้ำยา",
      "ตรวจสอบความปลอดภัยทางไฟฟ้า",
      "ตรวจสอบการยึดติดและโครงสร้าง",
      "รายงาน PDF พร้อมภาพถ่ายโดยละเอียด",
      "คำแนะนำให้ล้างหรือซ่อมหากจำเป็น",
    ],
    faqs: [
      {
        question: "How is this different from AC Repair?",
        answer:
          "Repair is for when something is wrong — we diagnose and fix it. Inspection is preventive: a scheduled check-up to catch issues early and confirm the unit is running well. No problem required.",
      },
      {
        question: "Will you fix things during the inspection?",
        answer:
          "No — inspection is observation + report only. If we find something that needs work, we'll recommend cleaning or repair and you can book it as a separate visit.",
      },
    ],
    faqsTh: [
      {
        question: "ต่างจากบริการซ่อมแอร์ยังไง?",
        answer:
          "ซ่อมคือมีปัญหาแล้วต้องแก้ — เราวินิจฉัยและซ่อมให้ ส่วนตรวจสภาพคือการป้องกัน เป็นการเช็คตามรอบเพื่อจับปัญหาแต่เนิ่นๆ และยืนยันว่าเครื่องยังทำงานดี ไม่จำเป็นต้องมีอาการเสีย",
      },
      {
        question: "ระหว่างตรวจจะซ่อมให้เลยไหม?",
        answer:
          "ไม่ — บริการตรวจสภาพคือตรวจและรายงานเท่านั้น ถ้าพบจุดที่ต้องแก้ไข เราจะแนะนำให้ล้างหรือซ่อม และคุณสามารถจองเป็นรอบใหม่ได้",
      },
    ],
  },
];

export function getService(id: string): ServiceConfig | undefined {
  return servicesConfig.find((s) => s.id === id);
}

/**
 * Deposit charged at booking time (satang). Two strategies:
 *
 *  - Diagnostic-fee services (repair/inspection): the deposit IS the diagnostic
 *    fee. If the customer goes ahead with the repair, the deposit is deducted
 *    from the final total.
 *
 *  - BTU-priced services (cleaning/installation): we take a small booking
 *    deposit so that "ghost bookings" cost something. The real amount due is
 *    confirmed by the admin after looking at the BTU and site details.
 *
 * Returning a fallback of 20,000 satang (฿200) for any unknown id keeps the
 * action safe even if a new service slips through.
 */
export function calculateBookingDeposit(serviceId: string): number {
  const service = getService(serviceId);
  if (!service) return 20000;

  // Diagnostic group: deposit = diagnostic fee
  if (service.group === "diagnostic") {
    return service.diagnosticFeeInSatang ?? service.basePriceInSatang;
  }

  // BTU group: flat ฿200 booking reservation fee. Admin confirms the real
  // total after evaluating BTU/site, customer pays the balance separately.
  if (service.id === "cleaning") return 50000; // ฿500 — fixed enough to take full deposit
  if (service.id === "installation") return 20000; // ฿200 reservation
  return 20000;
}
