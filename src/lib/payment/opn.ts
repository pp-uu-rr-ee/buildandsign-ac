const SECRET_KEY = process.env.PAYMENT_SECRET_KEY ?? "";
const OPN_API = "https://api.omise.co";

function authHeader() {
  return "Basic " + Buffer.from(SECRET_KEY + ":").toString("base64");
}

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
}

export interface OpnError {
  object: "error";
  code: string;
  message: string;
}

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

  const res = await fetch(`${OPN_API}/charges`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const data = await res.json();

  if (!res.ok || data.object === "error") {
    const err = data as OpnError;
    throw new Error(err.message ?? "Opn Payments API error");
  }

  return data as OpnCharge;
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

async function opnPost<T>(path: string, body: URLSearchParams): Promise<T> {
  const res = await fetch(`${OPN_API}${path}`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });
  const data = await res.json();
  if (!res.ok || data.object === "error") {
    throw new Error((data as OpnError).message ?? "Opn API error");
  }
  return data as T;
}

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
  const customer = await opnPost<OpnCustomer>("/customers", body);
  const card = customer.cards?.data[0];
  if (!card) throw new Error("Card not attached to new customer");
  return { customer, card };
}

export async function addCardToCustomer(
  customerId: string,
  tokenId: string
): Promise<OpnCard> {
  const body = new URLSearchParams({ card: tokenId });
  return opnPost<OpnCard>(`/customers/${customerId}/cards`, body);
}

export async function deleteCustomerCard(
  customerId: string,
  cardId: string
): Promise<void> {
  await fetch(`${OPN_API}/customers/${customerId}/cards/${cardId}`, {
    method: "DELETE",
    headers: { Authorization: authHeader() },
  });
}

export async function retrieveCharge(chargeId: string): Promise<OpnCharge> {
  const res = await fetch(`${OPN_API}/charges/${chargeId}`, {
    headers: { Authorization: authHeader() },
    cache: "no-store",
  });

  const data = await res.json();

  if (!res.ok || data.object === "error") {
    const err = data as OpnError;
    throw new Error(err.message ?? "Opn Payments API error");
  }

  return data as OpnCharge;
}
