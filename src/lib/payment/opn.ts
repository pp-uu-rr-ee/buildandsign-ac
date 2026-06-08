const SECRET_KEY = process.env.PAYMENT_SECRET_KEY;
const OPN_API = "https://api.omise.co";

if (!SECRET_KEY) {
  // Fail loudly at startup rather than at first request.
  // Avoid throwing in dev unless we're sure it's needed — guard with NODE_ENV.
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "PAYMENT_SECRET_KEY is not set. Refusing to start payment module in production."
    );
  } else {
    console.warn(
      "[opn] PAYMENT_SECRET_KEY missing — card payments will not work. Set it in .env."
    );
  }
}

function authHeader() {
  return "Basic " + Buffer.from((SECRET_KEY ?? "") + ":").toString("base64");
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface OpnCharge {
  object: "charge";
  id: string;
  status: "successful" | "pending" | "failed" | "reversed" | "expired";
  authorized: boolean;
  captured: boolean;
  amount: number;
  currency: string;
  authorize_uri?: string;
  return_uri?: string;
  failure_code?: string;
  failure_message?: string;
  metadata?: Record<string, string>;
  /** ISO timestamp string */
  expires_at?: string;
  /** ISO timestamp string */
  created_at?: string;
}

export interface OpnCard {
  object: "card";
  id: string;
  last_digits: string;
  brand: string;
  expiration_month: number;
  expiration_year: number;
  name: string;
}

export interface OpnCustomer {
  object: "customer";
  id: string;
  email: string;
  default_card?: string;
  cards?: { data: OpnCard[] };
}

export interface OpnError {
  object: "error";
  code: string;
  message: string;
}

export interface OpnEvent {
  object: "event";
  id: string;
  key: string;             // e.g. "charge.complete"
  livemode: boolean;
  created_at: string;
  data: OpnCharge | unknown;
}

// ─── Internal HTTP helpers ───────────────────────────────────────────────────

async function opnRequest<T>(
  method: "GET" | "POST" | "DELETE",
  path: string,
  body?: URLSearchParams
): Promise<T> {
  const res = await fetch(`${OPN_API}${path}`, {
    method,
    headers: {
      Authorization: authHeader(),
      ...(body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body: body?.toString(),
    cache: "no-store",
  });

  const data = await res.json();

  if (!res.ok || data.object === "error") {
    const err = data as OpnError;
    throw new Error(err.message ?? `Opn API error (${res.status})`);
  }

  return data as T;
}

// ─── Charges ─────────────────────────────────────────────────────────────────

export async function createCharge(params: {
  amount: number;
  currency: string;
  card?: string;       // token (new card) OR Opn card ID (saved card)
  customer?: string;   // Opn customer ID (required when using saved card)
  capture?: boolean;
  description?: string;
  returnUri?: string;
  metadata?: Record<string, string>;
}): Promise<OpnCharge> {
  if (params.amount < 100) {
    // Opn min charge in THB is typically 20.00 = 2000 satang.
    throw new Error("Charge amount too small.");
  }

  const body = new URLSearchParams({
    amount: String(params.amount),
    currency: params.currency,
    capture: String(params.capture ?? true),
  });
  if (params.card) body.set("card", params.card);
  if (params.customer) body.set("customer", params.customer);
  if (params.description) body.set("description", params.description);
  if (params.returnUri) body.set("return_uri", params.returnUri);
  if (params.metadata) {
    for (const [k, v] of Object.entries(params.metadata)) {
      body.set(`metadata[${k}]`, v);
    }
  }

  return opnRequest<OpnCharge>("POST", "/charges", body);
}

export async function retrieveCharge(chargeId: string): Promise<OpnCharge> {
  return opnRequest<OpnCharge>("GET", `/charges/${chargeId}`);
}

// ─── Customers / Saved cards ─────────────────────────────────────────────────

export async function createCustomerWithCard(params: {
  email: string;
  name: string;
  tokenId: string;
}): Promise<{ customer: OpnCustomer; card: OpnCard }> {
  const body = new URLSearchParams({
    email: params.email,
    description: params.name,
    card: params.tokenId,
  });
  const customer = await opnRequest<OpnCustomer>("POST", "/customers", body);
  const card = customer.cards?.data?.[0];
  if (!card?.id) throw new Error("Card not attached to new customer.");
  return { customer, card };
}

export async function addCardToCustomer(
  customerId: string,
  tokenId: string
): Promise<OpnCard> {
  const body = new URLSearchParams({ card: tokenId });
  const card = await opnRequest<OpnCard>(
    "POST",
    `/customers/${customerId}/cards`,
    body
  );
  if (!card?.id) throw new Error("Failed to attach card to customer.");
  return card;
}

export async function deleteCustomerCard(
  customerId: string,
  cardId: string
): Promise<void> {
  await opnRequest<unknown>(
    "DELETE",
    `/customers/${customerId}/cards/${cardId}`
  );
}

// ─── Webhook ─────────────────────────────────────────────────────────────────

/**
 * Verify a webhook payload. Opn webhooks include a shared-secret header.
 * We compare it against env `PAYMENT_WEBHOOK_SECRET`.
 *
 * If your Opn account uses a different verification scheme (e.g. signed HMAC),
 * update this function — the call site treats it as the single source of truth.
 */
export function verifyWebhookSecret(headerValue: string | null): boolean {
  const expected = process.env.PAYMENT_WEBHOOK_SECRET;
  if (!expected) {
    // No secret configured → refuse to accept any webhook. Fail closed.
    return false;
  }
  if (!headerValue) return false;
  // Constant-time compare to avoid timing attacks.
  if (headerValue.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ headerValue.charCodeAt(i);
  }
  return diff === 0;
}
