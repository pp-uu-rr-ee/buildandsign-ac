import { z } from "zod";

export const checkoutSchema = z.object({
  fullName: z.string().min(2, "Full name is required").max(120),
  email: z.string().email("Valid email required").max(254),
  phone: z
    .string()
    .regex(/^[0-9+\s\-()]{7,20}$/, "Invalid phone number")
    .max(20),
  addressLine1: z.string().min(5, "Address is required").max(200),
  addressLine2: z.string().max(200).optional(),
  city: z.string().min(2, "City is required").max(100),
  province: z.string().min(2, "Province is required").max(100),
  postalCode: z.string().min(4, "Postal code is required").max(20),
  paymentMethod: z.enum(["cod", "card"], {
    message: "Select a payment method",
  }),
  notes: z.string().max(500).optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

// ─── Cart item schema ───────────────────────────────────────────────────────
// Server NEVER trusts the client's `unitPriceInSatang` / `name` / `imageUrl`
// — those are looked up fresh from the DB. We only validate the two fields
// that *drive a DB query*: productId (must be a UUID) and quantity.
export const cartItemSchema = z.object({
  productId: z.string().uuid("Invalid product id"),
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
