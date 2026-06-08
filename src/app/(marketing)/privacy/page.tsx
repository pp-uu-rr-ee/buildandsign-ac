import type { Metadata } from "next";
import { getLang } from "@/lib/helpers/lang";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Privacy Policy | Cool Air Services",
  description: "How Cool Air Services collects, uses, and protects your personal data.",
  robots: { index: true, follow: true },
};

export default async function PrivacyPage() {
  const lang = await getLang();
  const isTh = lang === "th";
  const updated = new Date("2026-01-01").toLocaleDateString(
    isTh ? "th-TH" : "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  );

  return (
    <article className="mx-auto max-w-3xl px-4 sm:px-6 py-12 prose prose-blue dark:prose-invert">
      <h1>{isTh ? "นโยบายความเป็นส่วนตัว" : "Privacy Policy"}</h1>
      <p className="text-sm text-gray-500">
        {isTh ? "อัปเดตล่าสุด" : "Last updated"}: {updated}
      </p>

      {isTh ? (
        <>
          <p>
            {siteConfig.name} ("เรา") ให้ความสำคัญกับความเป็นส่วนตัวของคุณ
            นโยบายนี้อธิบายว่าเราเก็บ ใช้ และปกป้องข้อมูลของคุณอย่างไร
          </p>
          <h2>1. ข้อมูลที่เราเก็บ</h2>
          <ul>
            <li>ชื่อ-นามสกุล, อีเมล, เบอร์โทรศัพท์ (เพื่อสร้างบัญชีและติดต่อ)</li>
            <li>ที่อยู่ในการให้บริการ (สำหรับการจัดส่งและจอง)</li>
            <li>รายละเอียดการสั่งซื้อและการจองบริการ</li>
            <li>ข้อมูลบัตรเครดิตจะถูกประมวลผลโดย Opn Payments เท่านั้น เราไม่จัดเก็บเลขบัตร</li>
          </ul>
          <h2>2. การใช้ข้อมูล</h2>
          <ul>
            <li>เพื่อให้บริการ ติดตั้ง ซ่อม ล้างแอร์ และส่งสินค้า</li>
            <li>เพื่อติดต่อยืนยันคำสั่งซื้อหรือการจอง</li>
            <li>เพื่อปรับปรุงคุณภาพการให้บริการ</li>
          </ul>
          <h2>3. การแชร์ข้อมูล</h2>
          <p>
            เราไม่ขายข้อมูลให้บุคคลที่สาม ข้อมูลจะถูกส่งให้คู่ค้าเฉพาะเท่าที่จำเป็น
            (เช่น Opn Payments สำหรับชำระเงิน, ผู้ให้บริการขนส่งสำหรับการจัดส่ง)
          </p>
          <h2>4. การเก็บรักษา</h2>
          <p>
            เราเก็บข้อมูลเท่าที่กฎหมายกำหนดและจำเป็นต่อการให้บริการ คุณสามารถขอให้ลบข้อมูลได้
          </p>
          <h2>5. ติดต่อเรา</h2>
          <p>
            หากมีคำถามเกี่ยวกับนโยบายนี้ ติดต่อได้ที่{" "}
            <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>
          </p>
        </>
      ) : (
        <>
          <p>
            {siteConfig.name} ("we") respects your privacy. This policy explains what
            information we collect, how we use it, and how we protect it.
          </p>
          <h2>1. Information We Collect</h2>
          <ul>
            <li>Name, email, phone number — for your account and contact</li>
            <li>Service address — for bookings and deliveries</li>
            <li>Order and booking details</li>
            <li>
              Credit-card data is processed by Opn Payments only — we never store
              card numbers on our servers
            </li>
          </ul>
          <h2>2. How We Use It</h2>
          <ul>
            <li>To fulfil installation, repair, cleaning, and product orders</li>
            <li>To contact you to confirm bookings or orders</li>
            <li>To improve the quality of our service</li>
          </ul>
          <h2>3. Sharing</h2>
          <p>
            We do not sell your data. We share only what is necessary with partners
            (Opn Payments for payment, couriers for delivery).
          </p>
          <h2>4. Retention</h2>
          <p>
            We retain data only as required by law and as needed to provide our
            service. You may request deletion at any time.
          </p>
          <h2>5. Contact</h2>
          <p>
            Questions about this policy: <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>
          </p>
        </>
      )}
    </article>
  );
}
