// test-email.ts  (delete after testing)
import "dotenv/config";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const { data, error } = await resend.emails.send({
  from: "onboarding@resend.dev",   // works without a verified domain
  to: "phuvadej.anks@email.com",   // where you want to receive it
  subject: "Cool Air — test email",
  html: "<p>Resend is wired up correctly.</p>",
});

console.log({ data, error });