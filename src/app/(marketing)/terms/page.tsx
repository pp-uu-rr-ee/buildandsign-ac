import type { Metadata } from "next";
import { getLang } from "@/lib/helpers/lang";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Terms of Service | Cool Air Services",
  description: "Terms and conditions for using Cool Air Services.",
  robots: { index: true, follow: true },
};

export default async function TermsPage() {
  const lang = await getLang();
  const isTh = lang === "th";
  const updated = new Date("2026-01-01").toLocaleDateString(
    isTh ? "th-TH" : "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  );

  return (
    <article className="mx-auto max-w-3xl px-4 sm:px-6 py-12 prose prose-blue dark:prose-invert">
      <h1>{isTh ? "ข้อกำหนดการใช้บริการ" : "Terms of Service"}</h1>
      <p className="text-sm text-gray-500">
        {isTh ? "อัปเดตล่าสุด" : "Last updated"}: {updated}
      </p>

      {isTh ? (
        <>
          <p>
            การใช้บริการของ {siteConfig.name} ถือว่าคุณยอมรับข้อกำหนดต่อไปนี้
          </p>
          <h2>1. การจองและการชำระเงิน</h2>
          <ul>
            <li>การจองบริการต้องชำระมัดจำตามที่กำหนด (โดยทั่วไป 200–500 บาทขึ้นกับประเภทบริการ)</li>
            <li>ราคาจริงจะถูกยืนยันโดยช่างที่หน้างาน หากเป็นบริการที่ต้องประเมินก่อน</li>
            <li>ค่าตรวจเช็คจะถูกหักออกจากยอดรวมหากตกลงรับบริการต่อ</li>
          </ul>
          <h2>2. การยกเลิกและคืนเงิน</h2>
          <ul>
            <li>ยกเลิกก่อน 24 ชั่วโมง: คืนเงินมัดจำเต็มจำนวน</li>
            <li>ยกเลิกภายใน 24 ชั่วโมง: ขอสงวนสิทธิ์เก็บค่ามัดจำ</li>
            <li>หากช่างไม่สามารถมาตามนัด เราคืนเงินเต็มจำนวนและเสนอนัดใหม่</li>
          </ul>
          <h2>3. การรับประกันงาน</h2>
          <p>
            งานติดตั้งและซ่อมทุกรายการมีรับประกันฝีมือ 90 วัน หากปัญหาเดิมเกิดขึ้นภายในระยะเวลานี้
            เราจะกลับมาแก้ไขโดยไม่เก็บค่าใช้จ่ายเพิ่ม
          </p>
          <h2>4. ความรับผิด</h2>
          <p>
            เราไม่รับผิดต่อความเสียหายที่เกิดจากการใช้งานผิดประเภท, ไฟกระชาก, หรือเหตุสุดวิสัย
          </p>
          <h2>5. การเปลี่ยนแปลงข้อกำหนด</h2>
          <p>
            เราอาจปรับปรุงข้อกำหนดเหล่านี้เป็นครั้งคราว การใช้บริการต่อหลังจากปรับปรุงถือว่ายอมรับ
          </p>
          <h2>6. ติดต่อเรา</h2>
          <p>
            <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>
          </p>
        </>
      ) : (
        <>
          <p>By using {siteConfig.name} you agree to the following terms.</p>
          <h2>1. Bookings & Payment</h2>
          <ul>
            <li>A deposit is required to confirm a booking (typically ฿200–500 depending on service type).</li>
            <li>For services requiring on-site evaluation, the final price is quoted by the technician after inspection.</li>
            <li>Diagnostic fees are deducted from the total if you proceed with the recommended work.</li>
          </ul>
          <h2>2. Cancellations & Refunds</h2>
          <ul>
            <li>Cancel 24+ hours in advance: full deposit refund.</li>
            <li>Cancel within 24 hours: deposit is non-refundable.</li>
            <li>If the technician cannot make the appointment, we issue a full refund and reschedule.</li>
          </ul>
          <h2>3. Workmanship Guarantee</h2>
          <p>
            All installation and repair work carries a 90-day workmanship guarantee.
            If the same issue recurs in that window, we come back at no charge.
          </p>
          <h2>4. Liability</h2>
          <p>
            We are not liable for damage caused by misuse, power surges, or force majeure events.
          </p>
          <h2>5. Changes</h2>
          <p>
            We may update these terms occasionally. Continued use after changes means acceptance.
          </p>
          <h2>6. Contact</h2>
          <p>
            <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>
          </p>
        </>
      )}
    </article>
  );
}
