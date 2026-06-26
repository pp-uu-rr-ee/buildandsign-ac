import { z } from "zod";

// One saved address. Name/phone live on the account, so only location fields.
export const addressSchema = z.object({
  addressLine1: z.string().trim().min(3, "Address is required").max(200),
  addressLine2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(2, "City is required").max(100),
  province: z.string().trim().min(2, "Province is required").max(100),
  postalCode: z.string().trim().regex(/^\d{4,6}$/, "Invalid postal code"),
});

export type AddressInput = z.infer<typeof addressSchema>;
