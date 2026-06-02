import { z } from "zod";

export const bookingSchema = z.object({
  serviceType: z.enum(["cleaning", "repair", "installation", "inspection"]),
  technicianId: z.string().uuid("Please select a time slot"),
  scheduledAt: z
    .string()
    .datetime("Invalid date/time")
    .refine(
      (v) => new Date(v) > new Date(),
      "Booking must be in the future"
    ),
  durationMinutes: z.number().int().positive(),

  // Contact + address
  fullName: z.string().min(2, "Full name is required"),
  phone: z
    .string()
    .regex(/^[0-9+\s\-()]{7,20}$/, "Invalid phone number"),
  addressLine1: z.string().min(5, "Address is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  province: z.string().min(2, "Province is required"),
  postalCode: z.string().min(4, "Postal code is required"),

  // AC unit details (optional)
  acBrand: z.string().optional(),
  acModel: z.string().optional(),
  acType: z.string().optional(),
  acYearInstalled: z.coerce.number().int().min(1990).max(2030).optional().or(z.literal("")),

  customerNotes: z.string().max(500).optional(),
});

export type BookingInput = z.infer<typeof bookingSchema>;
