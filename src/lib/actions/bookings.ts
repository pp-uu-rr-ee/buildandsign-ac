"use server";

import { redirect } from "next/navigation";
import { db } from "@/db";
import { bookings, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { bookingSchema } from "@/lib/validations/booking";
import { sendBookingConfirmation } from "@/lib/email";
import { getService } from "@/config/services";

function generateBookingNumber(): string {
  const prefix = "BK";
  const date = new Date()
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "");
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `${prefix}-${date}-${rand}`;
}

export type BookingActionResult =
  | { success: true; bookingId: string }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

export async function createBookingAction(
  _prev: BookingActionResult,
  formData: FormData
): Promise<BookingActionResult> {
  const session = await getSession();

  const raw = {
    serviceType: formData.get("serviceType"),
    technicianId: formData.get("technicianId"),
    scheduledAt: formData.get("scheduledAt"),
    durationMinutes: Number(formData.get("durationMinutes")),
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    addressLine1: formData.get("addressLine1"),
    addressLine2: formData.get("addressLine2") || undefined,
    city: formData.get("city"),
    province: formData.get("province"),
    postalCode: formData.get("postalCode"),
    acBrand: formData.get("acBrand") || undefined,
    acModel: formData.get("acModel") || undefined,
    acType: formData.get("acType") || undefined,
    acYearInstalled: formData.get("acYearInstalled") || undefined,
    customerNotes: formData.get("customerNotes") || undefined,
  };

  const parsed = bookingSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const data = parsed.data;

  const [booking] = await db
    .insert(bookings)
    .values({
      bookingNumber: generateBookingNumber(),
      userId: session?.userId ?? null,
      technicianId: data.technicianId,
      serviceType: data.serviceType,
      status: "pending",
      scheduledAt: new Date(data.scheduledAt),
      durationMinutes: data.durationMinutes,
      serviceAddress: {
        fullName: data.fullName,
        phone: data.phone,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        city: data.city,
        province: data.province,
        postalCode: data.postalCode,
      },
      acUnitDetails:
        data.acBrand || data.acModel || data.acType
          ? {
              brand: data.acBrand,
              model: data.acModel,
              type: data.acType,
              yearInstalled:
                data.acYearInstalled !== "" && data.acYearInstalled !== undefined
                  ? Number(data.acYearInstalled)
                  : undefined,
            }
          : null,
      customerNotes: data.customerNotes,
    })
    .returning({ id: bookings.id, bookingNumber: bookings.bookingNumber });

  if (session?.userId) {
    try {
      const [user] = await db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.id, session.userId))
        .limit(1);

      if (user) {
        const service = getService(data.serviceType);
        await sendBookingConfirmation({
          to: user.email,
          bookingNumber: booking.bookingNumber,
          customerName: data.fullName,
          serviceTitle: service?.title ?? data.serviceType,
          scheduledAt: new Date(data.scheduledAt),
          durationMinutes: data.durationMinutes,
          serviceAddress: {
            fullName: data.fullName,
            phone: data.phone,
            addressLine1: data.addressLine1,
            addressLine2: data.addressLine2,
            city: data.city,
            province: data.province,
            postalCode: data.postalCode,
          },
          bookingId: booking.id,
        });
      }
    } catch (err) {
      console.error("[email] Failed to send booking confirmation:", err);
    }
  }

  redirect(`/bookings/${booking.id}/confirmation`);
}
