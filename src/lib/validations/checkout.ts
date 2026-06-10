import { z } from "zod";

// Customer name/email/phone are pulled from the logged-in user's account row
// (not from the form) — keeping them out of the schema means the client can't
// override what's tied to the account.
export const checkoutSchema = z.object({
  addressLine1: z.string().min(5, "Address is required").max(200),
  addressLine2: z.string().max(200).optional(),
  city: z.string().min(2, "City is required").max(100),
  province: z.string().min(2, "Province is required").max(100),
  postalCode: z.string().min(4, "Postal code is required").max(20),
  notes: z.string().max(500).optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

// ─── Cart item schema ───────────────────────────────────────────────────────
// Server NEVER trusts the client's `unitPriceInSatang` / `name` / `imageUrl`
// — those are looked up fresh from the DB. We only validate the two fields
// that *drive a DB query*: variantId (must be a UUID) and quantity.
export const cartItemSchema = z.object({
  variantId: z.string().uuid("Invalid variant id"),
  quantity: z
    .number()
    .int("Quantity must be whole")
    .positive("Quantity must be positive")
    .max(99, "Quantity too large"),
});

export const cartItemsSchema = z
  .array(cartItemSchema)
  .min(1, "Cart is empty")
  .max(50, "Too many items in cart");

export type CartItemInput = z.infer<typeof cartItemSchema>;
