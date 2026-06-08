import type { Metadata } from "next";
import { Mail, Wrench, Phone } from "lucide-react";
import { siteConfig } from "@/config/site";
import { getLang } from "@/lib/helpers/lang";

export const metadata: Metadata = {
  title: "Careers | Cool Air Services",
  description: "Join the Cool Air Services team — opportunities for certified AC technicians in Bangkok.",
};

export default async function CareersPage() {
  const lang = await getLang();
  const isTh = lang === "th";

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
      <div className="text-center mb-10">
        <Wrench className="h-12 w-12 text-blue-600 mx-auto mb-4" />
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3">
          {isTh ? "ร่วมงานกับเรา" : "Join Our Team"}
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          {isTh
            ? "เรากำลังหาช่างแอร์มืออาชีพมาเสริมทีมในกรุงเทพฯ"
            : "We're hiring certified AC technicians across Bangkok."}
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 sm:p-8 space-y-6">
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
            {isTh ? "คุณสมบัติที่เรามองหา" : "What we're looking for"}
          </h2>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            {(isTh
              ? [
                  "ประสบการณ์งานแอร์ 2 ปีขึ้นไป (ติดตั้ง / ซ่อม / ล้าง)",
                  "ผ่านการรับรองจากแบรนด์ (Daikin, Carrier, Panasonic, LG, Samsung)",
                  "มีรถจักรยานยนต์/รถยนต์ของตัวเอง",
                  "สื่อสารกับลูกค้าได้ดี ตรงต่อเวลา ใส่ใจรายละเอียด",
                ]
              : [
                  "2+ years of AC experience (installation / repair / cleaning)",
                  "Brand certifications a plus (Daikin, Carrier, Panasonic, LG, Samsung)",
                  "Own motorbike or car",
                  "Strong communication, punctual, attention to detail",
                ]
            ).map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
            {isTh ? "สิ่งที่เราเสนอ" : "What we offer"}
          </h2>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            {(isTh
              ? [
                  "รายได้แข่งขันได้ + ค่าคอมต่อรอบงาน",
                  "ตารางงานยืดหยุ่นผ่านแอป",
                  "อบรมและรับรองเพิ่มเติมจากแบรนด์ต่างๆ",
                  "ทีมงานสนับสนุนตลอด",
                ]
              : [
                  "Competitive base pay + per-job commission",
                  "Flexible scheduling via our app",
                  "Brand-certified training and upskilling",
                  "Friendly support team",
                ]
            ).map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">★</span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="pt-4 border-t border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
            {isTh ? "สนใจสมัคร?" : "Apply now"}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {isTh
              ? "ส่งประวัติย่อ + ประสบการณ์มาที่อีเมล หรือโทรหาเราโดยตรง"
              : "Send your resume + experience to our email, or call us directly."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={`mailto:${siteConfig.email}?subject=${encodeURIComponent("Job application — Technician")}`}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
            >
              <Mail className="h-4 w-4" />
              {siteConfig.email}
            </a>
            <a
              href={`tel:${siteConfig.phone}`}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Phone className="h-4 w-4" />
              {siteConfig.phone}
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
