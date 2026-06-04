import { Wrench, Sparkles, Package, ClipboardCheck } from "lucide-react";

export type ServiceId = "cleaning" | "repair" | "installation" | "inspection";

export type ServiceConfig = {
  id: ServiceId;
  title: string;
  titleTh: string;
  tagline: string;
  taglineTh: string;
  description: string;
  descriptionTh: string;
  durationMinutes: number;
  basePriceInSatang: number;
  icon: typeof Wrench;
  includes: string[];
  includesTh: string[];
  faqs: { question: string; answer: string }[];
  faqsTh: { question: string; answer: string }[];
};

export const servicesConfig: ServiceConfig[] = [
  {
    id: "cleaning",
    title: "AC Cleaning",
    titleTh: "ล้างแอร์",
    tagline: "Deep-clean your unit for peak performance.",
    taglineTh: "ล้างทำความสะอาดแบบล้ำลึกเพื่อประสิทธิภาพสูงสุด",
    description:
      "Our thorough AC cleaning service removes dust, mold, and bacteria from filters, coils, and the drainage system. A clean unit runs more efficiently and improves indoor air quality.",
    descriptionTh:
      "บริการล้างแอร์แบบครบวงจร ขจัดฝุ่น เชื้อรา และแบคทีเรียออกจากฟิลเตอร์ คอยล์ และระบบระบายน้ำ เครื่องที่สะอาดทำงานได้มีประสิทธิภาพมากขึ้นและช่วยปรับปรุงคุณภาพอากาศภายในบ้าน",
    durationMinutes: 60,
    basePriceInSatang: 79900,
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
        answer:
          "Approximately 1 hour per indoor unit. Additional units are serviced at a discounted rate.",
      },
      {
        question: "Do I need to be home during the service?",
        answer:
          "Yes, an adult must be present at the start. You can leave after the technician begins if needed.",
      },
    ],
    faqsTh: [
      {
        question: "ควรล้างแอร์บ่อยแค่ไหน?",
        answer:
          "ทุก 3–6 เดือนสำหรับเครื่องใช้ในบ้าน เครื่องที่ใช้งานหนักหรือเชิงพาณิชย์ควรล้างทุก 2–3 เดือน",
      },
      {
        question: "ล้างแอร์ใช้เวลานานแค่ไหน?",
        answer:
          "ประมาณ 1 ชั่วโมงต่อเครื่อง เครื่องเพิ่มเติมจะได้รับส่วนลดพิเศษ",
      },
      {
        question: "ต้องอยู่บ้านระหว่างให้บริการหรือไม่?",
        answer:
          "ต้องมีผู้ใหญ่อยู่ตอนช่างเริ่มงาน หลังจากนั้นสามารถออกไปได้หากจำเป็น",
      },
    ],
  },
  {
    id: "repair",
    title: "AC Repair",
    titleTh: "ซ่อมแอร์",
    tagline: "Fast diagnosis and reliable fixes.",
    taglineTh: "วินิจฉัยเร็ว ซ่อมได้จริง เชื่อถือได้",
    description:
      "Our certified technicians diagnose and repair all makes and models — from refrigerant leaks and compressor issues to sensor faults and PCB problems. We carry common parts in our service vehicles.",
    descriptionTh:
      "ช่างเทคนิคที่ผ่านการรับรองวินิจฉัยและซ่อมทุกยี่ห้อและทุกรุ่น ตั้งแต่น้ำยารั่ว ปัญหาคอมเพรสเซอร์ ไปจนถึงเซนเซอร์และ PCB เสีย เรามีอะไหล่ทั่วไปพร้อมในรถบริการ",
    durationMinutes: 120,
    basePriceInSatang: 149900,
    icon: Wrench,
    includes: [
      "Full system diagnosis",
      "Error code reading",
      "Refrigerant pressure test",
      "Component inspection",
      "Labor for standard repairs",
      "90-day warranty on workmanship",
    ],
    includesTh: [
      "วินิจฉัยระบบทั้งหมด",
      "อ่านรหัสข้อผิดพลาด",
      "ทดสอบความดันน้ำยา",
      "ตรวจสอบชิ้นส่วน",
      "ค่าแรงสำหรับการซ่อมมาตรฐาน",
      "รับประกันผลงาน 90 วัน",
    ],
    faqs: [
      {
        question: "Is the diagnostic fee included?",
        answer:
          "Yes — the booking fee covers diagnosis. Parts and refrigerant top-up are billed separately at market rates.",
      },
      {
        question: "What if my unit needs a major part replacement?",
        answer:
          "We'll provide a written quotation after diagnosis. You can approve or decline with no obligation.",
      },
      {
        question: "Do you service all AC brands?",
        answer:
          "Yes — Carrier, Daikin, Panasonic, LG, Samsung, Midea, Fujitsu, and more.",
      },
    ],
    faqsTh: [
      {
        question: "ค่าวินิจฉัยรวมอยู่ในราคาหรือไม่?",
        answer:
          "รวมแล้ว — ค่าจองครอบคลุมการวินิจฉัย อะไหล่และการเติมน้ำยาคิดแยกตามราคาตลาด",
      },
      {
        question: "ถ้าเครื่องต้องเปลี่ยนอะไหล่ชิ้นใหญ่จะทำอย่างไร?",
        answer:
          "เราจะให้ใบเสนอราคาเป็นลายลักษณ์อักษรหลังการวินิจฉัย สามารถอนุมัติหรือปฏิเสธได้โดยไม่มีข้อผูกมัด",
      },
      {
        question: "ให้บริการแอร์ทุกยี่ห้อหรือไม่?",
        answer:
          "ใช่ — Carrier, Daikin, Panasonic, LG, Samsung, Midea, Fujitsu และอื่นๆ",
      },
    ],
  },
  {
    id: "installation",
    title: "AC Installation",
    titleTh: "ติดตั้งแอร์",
    tagline: "Professional mounting, wiring, and commissioning.",
    taglineTh: "ติดตั้ง เดินสาย และทดสอบระบบอย่างมืออาชีพ",
    description:
      "Proper installation is critical to your AC's lifespan and efficiency. Our team handles everything — bracket mounting, refrigerant line laying, electrical connection, and initial commissioning — to manufacturer specs.",
    descriptionTh:
      "การติดตั้งที่ถูกต้องเป็นสิ่งสำคัญต่ออายุการใช้งานและประสิทธิภาพของแอร์ ทีมงานของเราดูแลทุกขั้นตอน — ติดตั้งแบรกเกต วางท่อน้ำยา เดินไฟฟ้า และทดสอบระบบเบื้องต้น ตามมาตรฐานของผู้ผลิต",
    durationMinutes: 180,
    basePriceInSatang: 249900,
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
        question: "What's included in the standard rate?",
        answer:
          "Standard rate covers up to 3 metres of refrigerant copper line and 2 metres of electrical cable. Additional materials are billed at cost.",
      },
      {
        question: "Do you supply the AC unit?",
        answer:
          "You can purchase one from our shop or supply your own. We install all standard residential split-type and window-type units.",
      },
      {
        question: "Will the installation void my warranty?",
        answer:
          "No — our technicians are brand-certified and follow manufacturer guidelines to preserve your warranty.",
      },
    ],
    faqsTh: [
      {
        question: "อัตรามาตรฐานครอบคลุมอะไรบ้าง?",
        answer:
          "ครอบคลุมท่อทองแดงน้ำยาสูงสุด 3 เมตร และสายไฟฟ้า 2 เมตร วัสดุเพิ่มเติมคิดตามต้นทุน",
      },
      {
        question: "จำหน่ายเครื่องแอร์ด้วยหรือไม่?",
        answer:
          "สามารถซื้อจากร้านของเราหรือนำเครื่องมาเองได้ เราติดตั้งแอร์ผนังและแอร์หน้าต่างมาตรฐานสำหรับที่พักอาศัย",
      },
      {
        question: "การติดตั้งจะทำให้การรับประกันสินค้าสิ้นสุดหรือไม่?",
        answer:
          "ไม่ — ช่างของเราผ่านการรับรองจากแบรนด์และปฏิบัติตามแนวทางของผู้ผลิตเพื่อรักษาการรับประกันของคุณ",
      },
    ],
  },
  {
    id: "inspection",
    title: "AC Inspection",
    titleTh: "ตรวจสอบแอร์",
    tagline: "Comprehensive health check before problems arise.",
    taglineTh: "ตรวจสุขภาพเครื่องปรับอากาศอย่างครอบคลุมก่อนเกิดปัญหา",
    description:
      "Our inspection covers 25 check points across your AC system — from refrigerant levels and electrical safety to structural mounting and drainage. Ideal before buying a secondhand unit or before the summer season.",
    descriptionTh:
      "การตรวจสอบของเราครอบคลุม 25 จุดตรวจสอบทั่วทั้งระบบแอร์ — ตั้งแต่ระดับน้ำยาและความปลอดภัยทางไฟฟ้า ไปจนถึงการยึดติดและระบบระบายน้ำ เหมาะสำหรับก่อนซื้อเครื่องมือสองหรือก่อนเข้าหน้าร้อน",
    durationMinutes: 60,
    basePriceInSatang: 59900,
    icon: ClipboardCheck,
    includes: [
      "25-point system check",
      "Refrigerant level assessment",
      "Electrical safety inspection",
      "Mounting and structural check",
      "Detailed written report",
      "Priority repair booking if needed",
    ],
    includesTh: [
      "ตรวจสอบ 25 จุด",
      "ประเมินระดับน้ำยา",
      "ตรวจสอบความปลอดภัยทางไฟฟ้า",
      "ตรวจสอบการยึดติดและโครงสร้าง",
      "รายงานเป็นลายลักษณ์อักษรโดยละเอียด",
      "สิทธิ์จองซ่อมด่วนหากจำเป็น",
    ],
    faqs: [
      {
        question: "Do I get a written report?",
        answer:
          "Yes — you'll receive a PDF report within 24 hours covering all 25 check points with photos and recommendations.",
      },
      {
        question: "When is inspection most useful?",
        answer:
          "Before the summer heat peaks, before/after a typhoon season, or when buying a secondhand unit.",
      },
    ],
    faqsTh: [
      {
        question: "จะได้รับรายงานเป็นลายลักษณ์อักษรหรือไม่?",
        answer:
          "ใช่ — จะได้รับรายงาน PDF ภายใน 24 ชั่วโมง ครอบคลุม 25 จุดตรวจสอบพร้อมรูปภาพและคำแนะนำ",
      },
      {
        question: "การตรวจสอบมีประโยชน์มากที่สุดเมื่อไหร่?",
        answer:
          "ก่อนหน้าร้อน ก่อน/หลังฤดูพายุ หรือเมื่อซื้อเครื่องมือสอง",
      },
    ],
  },
];

export function getService(id: string): ServiceConfig | undefined {
  return servicesConfig.find((s) => s.id === id);
}
