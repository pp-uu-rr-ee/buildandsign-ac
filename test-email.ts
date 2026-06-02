/**
 * Quick smoke-test for Resend. Run with:
 *   npx tsx test-email.ts
 *
 * Delete this file after confirming emails work.
 */
import "dotenv/config";
import { Resend } from "resend";

const key = process.env.RESEND_API_KEY;
if (!key) {
  console.error("❌  RESEND_API_KEY is not set in .env");
  process.exit(1);
}

const TO = process.env.TEST_EMAIL_TO;
if (!TO) {
  console.error("❌  Set TEST_EMAIL_TO=your@email.com in .env first");
  process.exit(1);
}

const resend = new Resend(key);

console.log(`Sending test email to ${TO} …`);

const { data, error } = await resend.emails.send({
  from: "onboarding@resend.dev",   // Resend's test sender — no domain verification needed
  to: TO,
  subject: "Cool Air Services — email test",
  html: `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;">
      <h2 style="color:#2563eb;">✅ Resend is working!</h2>
      <p>Your email notifications are correctly wired up for Cool Air Services.</p>
      <p style="color:#6b7280;font-size:13px;">
        Sent at ${new Date().toLocaleString()}
      </p>
    </div>
  `,
});

if (error) {
  console.error("❌  Resend returned an error:", error);
  process.exit(1);
}

console.log("✅  Email sent! Resend ID:", data?.id);
console.log("    Check your inbox (and spam folder).");
