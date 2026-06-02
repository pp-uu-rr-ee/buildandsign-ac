import { z } from "zod";

export const checkoutSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().regex(/^[0-9+\s\-()]{7,20}$/, "Invalid phone number"),
  addressLine1: z.string().min(5, "Address is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  province: z.string().min(2, "Province is required"),
  postalCode: z.string().min(4, "Postal code is required"),
  paymentMethod: z.enum(["cod", "gcash", "bank_transfer"], {
    message: "Select a payment method",
  }),
  notes: z.string().max(500).optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
