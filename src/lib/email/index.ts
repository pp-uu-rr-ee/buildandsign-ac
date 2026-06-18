import { Resend } from "resend";
import { siteConfig } from "@/config/site";
import {
  bookingConfirmationHtml,
  bookingQuoteReadyHtml,
  orderReceiptHtml,
  passwordResetHtml,
} from "./templates";

// Lazy-init the Resend client. Constructing it at module load throws when
// RESEND_API_KEY is absent (e.g. during `next build`'s page-data collection),
// which would fail the whole build. We build it on first use instead, and the
// send functions already early-return when the key is missing.
let _resend: Resend | null = null;
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}
const FROM = process.env.EMAIL_FROM ?? "no-reply@coolairservices.com";
const APP_URL = siteConfig.url;

export type BookingEmailPayload = {
  to: string;
  bookingNumber: string;
  customerName: string;
  serviceTitle: string;
  scheduledAt: Date;
  durationMinutes: number;
  serviceAddress: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string | null;
    city: string;
    province: string;
    postalCode: string;
  };
  technicianName?: string | null;
  bookingId: string;
};

export async function sendBookingConfirmation(payload: BookingEmailPayload): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  const { error } = await resend.emails.send({
    from: `${siteConfig.name} <${FROM}>`,
    to: payload.to,
    subject: `Booking Confirmed — ${payload.bookingNumber}`,
    html: bookingConfirmationHtml({
      bookingNumber: payload.bookingNumber,
      customerName: payload.customerName,
      serviceTitle: payload.serviceTitle,
      scheduledAt: payload.scheduledAt,
      durationMinutes: payload.durationMinutes,
      serviceAddress: payload.serviceAddress,
      technicianName: payload.technicianName,
      bookingUrl: `${APP_URL}/bookings/${payload.bookingId}/confirmation`,
    }),
  });

  if (error) throw new Error(`Resend error: ${error.message}`);
}

export type OrderEmailPayload = {
  to: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: {
    productName: string;
    quantity: number;
    unitPriceInSatang: number;
    totalInSatang: number;
  }[];
  subtotalInSatang: number;
  shippingInSatang: number;
  totalInSatang: number;
  paymentMethod: string;
  shippingAddress: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string | null;
    city: string;
    province: string;
    postalCode: string;
  };
  orderId: string;
};

export async function sendOrderReceipt(payload: OrderEmailPayload): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  const { error } = await resend.emails.send({
    from: `${siteConfig.name} <${FROM}>`,
    to: payload.to,
    subject: `Order Confirmed — ${payload.orderNumber}`,
    html: orderReceiptHtml({
      orderNumber: payload.orderNumber,
      customerName: payload.customerName,
      customerEmail: payload.customerEmail,
      items: payload.items,
      subtotalInSatang: payload.subtotalInSatang,
      shippingInSatang: payload.shippingInSatang,
      totalInSatang: payload.totalInSatang,
      paymentMethod: payload.paymentMethod,
      shippingAddress: payload.shippingAddress,
      orderUrl: `${APP_URL}/orders/${payload.orderId}/confirmation`,
    }),
  });

  if (error) throw new Error(`Resend error: ${error.message}`);
}

// ─── Quote ready (admin set a quote, customer needs to accept) ─────────────
export async function sendBookingQuoteReady(payload: {
  to: string;
  bookingNumber: string;
  customerName: string;
  serviceTitle: string;
  quotedTotalInSatang: number;
  bookingId: string;
}): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  const { error } = await resend.emails.send({
    from: `${siteConfig.name} <${FROM}>`,
    to: payload.to,
    subject: `Quote ready — ${payload.bookingNumber}`,
    html: bookingQuoteReadyHtml({
      bookingNumber: payload.bookingNumber,
      customerName: payload.customerName,
      serviceTitle: payload.serviceTitle,
      quotedTotalInSatang: payload.quotedTotalInSatang,
      acceptUrl: `${APP_URL}/bookings/${payload.bookingId}`,
    }),
  });

  if (error) throw new Error(`Resend error: ${error.message}`);
}

export async function sendPasswordReset(payload: {
  to: string;
  customerName: string;
  resetUrl: string;
}): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  const { error } = await resend.emails.send({
    from: `${siteConfig.name} <${FROM}>`,
    to: payload.to,
    subject: "Reset your Cool Air Services password",
    html: passwordResetHtml({ customerName: payload.customerName, resetUrl: payload.resetUrl }),
  });

  if (error) throw new Error(`Resend error: ${error.message}`);
}
