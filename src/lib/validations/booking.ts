import { z } from "zod";

export const acUnitSchema = z.object({
  brand: z.string().trim().min(1, "Brand is required").max(60),
  btu: z
    .number()
    .int()
    .min(5000, "BTU too small")
    .max(120000, "BTU too large"),
  type: z.enum(["split", "window", "cassette", "ceiling", "portable", "central"]),
  quantity: z.number().int().min(1, "Quantity must be at least 1").max(20),
});

export const bookingSchema = z.object({
  serviceType: z.enum(["cleaning", "repair", "installation", "inspection"]),
  technicianId: z.string().uuid("Please select a time slot"),
  scheduledAt: z
    .string()
    .min(1, "Please pick a date and time slot")
    .datetime({ local: true, message: "Invalid date/time format" })
    .refine(
      (v) => new Date(v).getTime() > Date.now() - 5 * 60 * 1000,
      "This time slot has already passed. Please pick another."
    ),
  durationMinutes: z.number().int().positive(),

  // Contact (name/phone) comes from the logged-in user's account row.
  // Address is captured per-booking.
  addressLine1: z.string().trim().min(3, "Address is required").max(200),
  addressLine2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(2, "City is required").max(100),
  province: z.string().trim().min(2, "Province is required").max(100),
  postalCode: z.string().trim().regex(/^\d{4,6}$/, "Invalid postal code"),

  // AC units — at least 1, max 10
  units: z.array(acUnitSchema).min(1, "Add at least one AC unit").max(10),

  customerNotes: z.string().trim().max(500).optional(),
});

export type BookingInput = z.infer<typeof bookingSchema>;
export type AcUnitInput = z.infer<typeof acUnitSchema>;
