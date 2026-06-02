import { formatPrice } from "@/lib/helpers/price";
import { siteConfig } from "@/config/site";

const brand = {
  primary: "#2563eb",
  bg: "#f8fafc",
  card: "#ffffff",
  text: "#111827",
  muted: "#6b7280",
  border: "#e5e7eb",
  success: "#16a34a",
};

function base(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:${brand.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${brand.bg};padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:${brand.primary};border-radius:12px 12px 0 0;padding:28px 32px;">
              <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;">
                ❄ ${siteConfig.name}
              </p>
              <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.75);">
                ${siteConfig.tagline}
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:${brand.card};border-radius:0 0 12px 12px;padding:32px;border:1px solid ${brand.border};border-top:none;">
              ${body}

              <!-- Footer -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;padding-top:24px;border-top:1px solid ${brand.border};">
                <tr>
                  <td style="font-size:12px;color:${brand.muted};text-align:center;">
                    <p style="margin:0 0 4px;">${siteConfig.name} · ${siteConfig.address.streetAddress}, ${siteConfig.address.addressLocality}</p>
                    <p style="margin:0 0 4px;">${siteConfig.phone} · ${siteConfig.email}</p>
                    <p style="margin:0;">Mon–Sat, 8 AM–6 PM</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function row(label: string, value: string): string {
  return `<tr>
    <td style="padding:8px 0;font-size:14px;color:${brand.muted};width:40%;vertical-align:top;">${label}</td>
    <td style="padding:8px 0;font-size:14px;color:${brand.text};font-weight:500;">${value}</td>
  </tr>`;
}

function section(title: string, content: string): string {
  return `<div style="margin:24px 0;">
    <p style="margin:0 0 12px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:${brand.muted};">${title}</p>
    <div style="background:${brand.bg};border:1px solid ${brand.border};border-radius:8px;padding:16px 20px;">
      <table width="100%" cellpadding="0" cellspacing="0">${content}</table>
    </div>
  </div>`;
}

// ── Booking confirmation ──────────────────────────────────────────────────────

type BookingEmailData = {
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
  bookingUrl: string;
};

export function bookingConfirmationHtml(d: BookingEmailData): string {
  const date = d.scheduledAt.toLocaleDateString("en-PH", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  const time = d.scheduledAt.toLocaleTimeString("en-PH", {
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
  const addressLines = [
    d.serviceAddress.addressLine1,
    d.serviceAddress.addressLine2,
    `${d.serviceAddress.city}, ${d.serviceAddress.province} ${d.serviceAddress.postalCode}`,
  ].filter(Boolean).join("<br />");

  const body = `
    <!-- Success badge -->
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;background:#dcfce7;border-radius:50%;width:56px;height:56px;line-height:56px;font-size:28px;margin-bottom:12px;">✓</div>
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${brand.text};">Booking Confirmed!</h1>
      <p style="margin:0;font-size:15px;color:${brand.muted};">
        Hi ${d.customerName}, your service has been booked.
      </p>
    </div>

    <!-- Reference number -->
    <div style="text-align:center;background:${brand.bg};border:2px dashed ${brand.border};border-radius:8px;padding:16px;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:12px;color:${brand.muted};text-transform:uppercase;letter-spacing:0.05em;">Booking Reference</p>
      <p style="margin:0;font-size:24px;font-weight:700;color:${brand.primary};letter-spacing:0.05em;">${d.bookingNumber}</p>
    </div>

    ${section("Service Details",
      row("Service", d.serviceTitle) +
      row("Date", date) +
      row("Time", time) +
      row("Duration", `~${d.durationMinutes} minutes`) +
      (d.technicianName ? row("Technician", d.technicianName) : "")
    )}

    ${section("Service Address",
      row("Name", d.serviceAddress.fullName) +
      row("Phone", d.serviceAddress.phone) +
      row("Address", addressLines)
    )}

    <!-- CTA -->
    <div style="text-align:center;margin-top:28px;">
      <a href="${d.bookingUrl}" style="display:inline-block;background:${brand.primary};color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;">
        View Booking Details
      </a>
    </div>

    <p style="margin:24px 0 0;font-size:13px;color:${brand.muted};text-align:center;">
      Our technician will arrive within the scheduled time window. You'll receive a call 30 minutes before arrival.<br />
      Questions? Call us at <strong>${siteConfig.phone}</strong>
    </p>
  `;

  return base(`Booking Confirmed — ${d.bookingNumber}`, body);
}

// ── Order receipt ─────────────────────────────────────────────────────────────

type OrderItem = {
  productName: string;
  quantity: number;
  unitPriceInCents: number;
  totalInCents: number;
};

type OrderEmailData = {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
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
  orderUrl: string;
};

const PAYMENT_LABELS: Record<string, string> = {
  cod: "Cash on Delivery",
  gcash: "GCash",
  bank_transfer: "Bank Transfer",
};

export function orderReceiptHtml(d: OrderEmailData): string {
  const addressLines = [
    d.shippingAddress.addressLine1,
    d.shippingAddress.addressLine2,
    `${d.shippingAddress.city}, ${d.shippingAddress.province} ${d.shippingAddress.postalCode}`,
  ].filter(Boolean).join("<br />");

  const itemRows = d.items
    .map(
      (item) => `<tr>
        <td style="padding:10px 0;font-size:14px;color:${brand.text};border-bottom:1px solid ${brand.border};">
          ${item.productName}
          <span style="color:${brand.muted};"> × ${item.quantity}</span>
        </td>
        <td style="padding:10px 0;font-size:14px;color:${brand.text};font-weight:600;text-align:right;border-bottom:1px solid ${brand.border};">
          ${formatPrice(item.totalInCents)}
        </td>
      </tr>`
    )
    .join("");

  const body = `
    <!-- Success badge -->
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;background:#dbeafe;border-radius:50%;width:56px;height:56px;line-height:56px;font-size:28px;margin-bottom:12px;">🛍</div>
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${brand.text};">Order Received!</h1>
      <p style="margin:0;font-size:15px;color:${brand.muted};">
        Thanks ${d.customerName}, we've received your order.
      </p>
    </div>

    <!-- Reference number -->
    <div style="text-align:center;background:${brand.bg};border:2px dashed ${brand.border};border-radius:8px;padding:16px;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:12px;color:${brand.muted};text-transform:uppercase;letter-spacing:0.05em;">Order Number</p>
      <p style="margin:0;font-size:24px;font-weight:700;color:${brand.primary};letter-spacing:0.05em;">${d.orderNumber}</p>
    </div>

    <!-- Items -->
    <div style="margin:24px 0;">
      <p style="margin:0 0 12px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:${brand.muted};">Items Ordered</p>
      <div style="background:${brand.bg};border:1px solid ${brand.border};border-radius:8px;padding:16px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          ${itemRows}
          <tr>
            <td style="padding:10px 0 4px;font-size:14px;color:${brand.muted};">Subtotal</td>
            <td style="padding:10px 0 4px;font-size:14px;color:${brand.text};text-align:right;">${formatPrice(d.subtotalInCents)}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;font-size:14px;color:${brand.muted};">Shipping</td>
            <td style="padding:4px 0;font-size:14px;color:${brand.text};text-align:right;">${d.shippingInCents === 0 ? "Free" : formatPrice(d.shippingInCents)}</td>
          </tr>
          <tr>
            <td style="padding:12px 0 0;font-size:16px;font-weight:700;color:${brand.text};border-top:2px solid ${brand.border};">Total</td>
            <td style="padding:12px 0 0;font-size:16px;font-weight:700;color:${brand.primary};text-align:right;border-top:2px solid ${brand.border};">${formatPrice(d.totalInCents)}</td>
          </tr>
        </table>
      </div>
    </div>

    ${section("Shipping Address",
      row("Name", d.shippingAddress.fullName) +
      row("Phone", d.shippingAddress.phone) +
      row("Address", addressLines)
    )}

    ${section("Payment",
      row("Method", PAYMENT_LABELS[d.paymentMethod] ?? d.paymentMethod)
    )}

    <!-- CTA -->
    <div style="text-align:center;margin-top:28px;">
      <a href="${d.orderUrl}" style="display:inline-block;background:${brand.primary};color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;">
        View Order Details
      </a>
    </div>

    <p style="margin:24px 0 0;font-size:13px;color:${brand.muted};text-align:center;">
      We'll confirm your order shortly. For COD orders our team will contact you to arrange delivery.<br />
      Questions? Call us at <strong>${siteConfig.phone}</strong>
    </p>
  `;

  return base(`Order Confirmed — ${d.orderNumber}`, body);
}
