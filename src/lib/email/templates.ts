import { formatPrice } from "@/lib/helpers/price";
import { siteConfig } from "@/config/site";

const brand = {
  primary: "#2563eb",
  primaryDark: "#1e3a8a",
  accent: "#0ea5e9",
  bg: "#f1f5f9",
  card: "#ffffff",
  text: "#0f172a",
  muted: "#64748b",
  border: "#e2e8f0",
  success: "#16a34a",
};

function base(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:${brand.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <!-- Preheader (hidden) -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${brand.bg};">${title}</div>

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:${brand.bg};padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;">

          <!-- Header — gradient brand bar with logo -->
          <tr>
            <td style="background:linear-gradient(135deg,${brand.primaryDark} 0%,${brand.primary} 60%,${brand.accent} 100%);border-radius:14px 14px 0 0;padding:30px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td>
                    <table cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="vertical-align:middle;padding-right:12px;">
                          <!-- Inline SVG-ish snowflake using text — supported widely -->
                          <div style="display:inline-block;width:36px;height:36px;border-radius:10px;background:rgba(255,255,255,0.18);text-align:center;line-height:36px;font-size:18px;">❄</div>
                        </td>
                        <td style="vertical-align:middle;">
                          <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;line-height:1.2;">${siteConfig.name}</p>
                          <p style="margin:2px 0 0;font-size:12px;color:rgba(255,255,255,0.85);line-height:1.3;">${siteConfig.tagline}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:${brand.card};padding:36px 32px;border-left:1px solid ${brand.border};border-right:1px solid ${brand.border};">
              ${body}
            </td>
          </tr>

          <!-- Footer card -->
          <tr>
            <td style="background:${brand.card};border-radius:0 0 14px 14px;padding:24px 32px 28px;border:1px solid ${brand.border};border-top:1px solid ${brand.border};">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="text-align:center;padding-bottom:12px;border-bottom:1px solid ${brand.border};">
                    <a href="${siteConfig.url}" style="font-size:13px;color:${brand.primary};text-decoration:none;font-weight:600;">${siteConfig.url.replace(/^https?:\/\//, "")}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:16px;font-size:12px;color:${brand.muted};text-align:center;line-height:1.7;">
                    <strong style="color:${brand.text};">${siteConfig.name}</strong><br />
                    ${siteConfig.address.streetAddress}, ${siteConfig.address.addressLocality} ${siteConfig.address.postalCode}<br />
                    <a href="tel:${siteConfig.phone}" style="color:${brand.muted};text-decoration:none;">${siteConfig.phone}</a> ·
                    <a href="mailto:${siteConfig.email}" style="color:${brand.muted};text-decoration:none;">${siteConfig.email}</a><br />
                    Mon–Sat, 8 AM – 6 PM
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:12px;text-align:center;">
                    <a href="${siteConfig.social.facebook}" style="display:inline-block;margin:0 6px;font-size:11px;color:${brand.muted};text-decoration:none;">Facebook</a>
                    <span style="color:${brand.border};">·</span>
                    <a href="${siteConfig.social.line}" style="display:inline-block;margin:0 6px;font-size:11px;color:${brand.muted};text-decoration:none;">Line</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:14px;font-size:10px;color:${brand.muted};text-align:center;line-height:1.5;">
                    © ${new Date().getFullYear()} ${siteConfig.name}. All rights reserved.<br />
                    You received this email because of activity on your account.
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
  const date = d.scheduledAt.toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  const time = d.scheduledAt.toLocaleTimeString("en-US", {
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
  unitPriceInSatang: number;
  totalInSatang: number;
};

type OrderEmailData = {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
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
          ${formatPrice(item.totalInSatang)}
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
            <td style="padding:10px 0 4px;font-size:14px;color:${brand.text};text-align:right;">${formatPrice(d.subtotalInSatang)}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;font-size:14px;color:${brand.muted};">Shipping</td>
            <td style="padding:4px 0;font-size:14px;color:${brand.text};text-align:right;">${d.shippingInSatang === 0 ? "Free" : formatPrice(d.shippingInSatang)}</td>
          </tr>
          <tr>
            <td style="padding:12px 0 0;font-size:16px;font-weight:700;color:${brand.text};border-top:2px solid ${brand.border};">Total</td>
            <td style="padding:12px 0 0;font-size:16px;font-weight:700;color:${brand.primary};text-align:right;border-top:2px solid ${brand.border};">${formatPrice(d.totalInSatang)}</td>
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

// ── Booking Quote Ready ───────────────────────────────────────────────────────
export function bookingQuoteReadyHtml(d: {
  bookingNumber: string;
  customerName: string;
  serviceTitle: string;
  depositInSatang: number;
  quotedTotalInSatang: number;
  balanceInSatang: number;
  payBalanceUrl: string;
}): string {
  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${brand.text};">Your quote is ready</h2>
    <p style="margin:0 0 24px;font-size:15px;color:${brand.muted};">Hi ${d.customerName},</p>
    <p style="margin:0 0 24px;font-size:14px;color:${brand.text};line-height:1.6;">
      Our technician has evaluated your <strong>${d.serviceTitle}</strong> booking
      <strong style="font-family:monospace;">${d.bookingNumber}</strong> and the final price is now ready.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${brand.border};border-radius:8px;margin-bottom:24px;">
      <tr>
        <td style="padding:12px 16px;font-size:14px;color:${brand.muted};">Total quote</td>
        <td style="padding:12px 16px;font-size:14px;color:${brand.text};font-weight:600;text-align:right;">${formatPrice(d.quotedTotalInSatang)}</td>
      </tr>
      <tr style="background:#fafafa;">
        <td style="padding:12px 16px;font-size:14px;color:${brand.muted};border-top:1px solid ${brand.border};">Deposit paid</td>
        <td style="padding:12px 16px;font-size:14px;color:${brand.text};font-weight:500;text-align:right;border-top:1px solid ${brand.border};">− ${formatPrice(d.depositInSatang)}</td>
      </tr>
      <tr>
        <td style="padding:14px 16px;font-size:15px;color:${brand.text};font-weight:700;border-top:2px solid ${brand.border};">Balance due</td>
        <td style="padding:14px 16px;font-size:18px;color:${brand.primary};font-weight:700;text-align:right;border-top:2px solid ${brand.border};">${formatPrice(d.balanceInSatang)}</td>
      </tr>
    </table>

    <div style="text-align:center;margin:32px 0;">
      <a href="${d.payBalanceUrl}" style="display:inline-block;background:${brand.primary};color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 36px;border-radius:8px;">
        Pay Balance ${formatPrice(d.balanceInSatang)}
      </a>
    </div>

    <p style="margin:0;font-size:13px;color:${brand.muted};text-align:center;line-height:1.6;">
      You can pay using a new or saved card.<br />
      Questions? Reply to this email or call us.
    </p>
  `;
  return base(`Quote ready — ${d.bookingNumber}`, body);
}

// ── Password Reset ────────────────────────────────────────────────────────────
export function passwordResetHtml(d: { customerName: string; resetUrl: string }): string {
  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${brand.text};">Reset your password</h2>
    <p style="margin:0 0 24px;font-size:15px;color:${brand.muted};">Hi ${d.customerName},</p>
    <p style="margin:0 0 24px;font-size:14px;color:${brand.text};line-height:1.6;">
      We received a request to reset the password for your Cool Air Services account.
      Click the button below to choose a new password. This link expires in <strong>1 hour</strong>.
    </p>

    <div style="text-align:center;margin:32px 0;">
      <a href="${d.resetUrl}" style="display:inline-block;background:${brand.primary};color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 36px;border-radius:8px;">
        Reset Password
      </a>
    </div>

    <p style="margin:0 0 8px;font-size:13px;color:${brand.muted};text-align:center;">
      If you didn't request a password reset, you can safely ignore this email — your password will not change.
    </p>
    <p style="margin:0;font-size:13px;color:${brand.muted};text-align:center;">
      Or copy this link into your browser:<br />
      <span style="word-break:break-all;color:${brand.primary};">${d.resetUrl}</span>
    </p>
  `;
  return base("Reset your Cool Air Services password", body);
}

