import { Resend } from "resend";
import { siteConfig } from "@/config/site";
import { bookingConfirmationHtml, orderReceiptHtml } from "./templates";

const resend = new Resend(process.env.RESEND_API_KEY);
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
  if (!process.env.RESEND_API_KEY) return;

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
    unitPriceInCents: number;
    totalInCents: number;
  }[];
  subtotalInCents: number;
  shippingInCents: number;
  totalInCents: number;
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
  if (!process.env.RESEND_API_KEY) return;

  const { error } = await resend.emails.send({
    from: `${siteConfig.name} <${FROM}>`,
    to: payload.to,
    subject: `Order Confirmed — ${payload.orderNumber}`,
    html: orderReceiptHtml({
      orderNumber: payload.orderNumber,
      customerName: payload.customerName,
      customerEmail: payload.customerEmail,
      items: payload.items,
      subtotalInCents: payload.subtotalInCents,
      shippingInCents: payload.shippingInCents,
      totalInCents: payload.totalInCents,
      paymentMethod: payload.paymentMethod,
      shippingAddress: payload.shippingAddress,
      orderUrl: `${APP_URL}/orders/${payload.orderId}/confirmation`,
    }),
  });

  if (error) throw new Error(`Resend error: ${error.message}`);
}
