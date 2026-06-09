"use server";

import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
import { db } from "@/db";
import { bookings, users } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { bookingSchema } from "@/lib/validations/booking";
import { sendBookingConfirmation, sendBookingQuoteReady } from "@/lib/email";
import { getService } from "@/config/services";

function generateBookingNumber(): string {
  const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const ms = Date.now().toString(36).toUpperCase();
  const rand = randomUUID().slice(0, 4).toUpperCase();
  return `BK-${ymd}-${ms}-${rand}`;
}

export type BookingActionResult =
  | { success: true; bookingId: string }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

export async function createBookingAction(
  _prev: BookingActionResult,
  formData: FormData
): Promise<BookingActionResult> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Please log in to book a service." };
  }

  let unitsParsed: unknown = [];
  const unitsJson = formData.get("unitsJson");
  if (typeof unitsJson === "string" && unitsJson.length > 0) {
    try {
      unitsParsed = JSON.parse(unitsJson);
    } catch {
      return { success: false, error: "Invalid AC unit data." };
    }
  }

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
    units: unitsParsed,
    customerNotes: formData.get("customerNotes") || undefined,
  };

  const parsed = bookingSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten()
        .fieldErrors as Record<string, string[]>,
    };
  }
  const data = parsed.data;

  let booking: { id: string; bookingNumber: string };
  try {
    const [row] = await db
      .insert(bookings)
      .values({
        bookingNumber: generateBookingNumber(),
        userId: session.userId,
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
        acUnitDetails: {
          units: data.units,
          notes: data.customerNotes,
        },
        customerNotes: data.customerNotes,
      })
      .returning({ id: bookings.id, bookingNumber: bookings.bookingNumber });
    booking = row;
  } catch (err) {
    console.error("[bookings] insert failed:", err);
    return { success: false, error: "Could not create booking." };
  }

  await maybeSendConfirmation(
    booking.id,
    booking.bookingNumber,
    session.userId,
    data
  );

  redirect(`/bookings/${booking.id}/confirmation`);
}

async function maybeSendConfirmation(
  bookingId: string,
  bookingNumber: string,
  userId: string,
  data: ReturnType<typeof bookingSchema.parse>
) {
  try {
    const [user] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user) {
      const service = getService(data.serviceType);
      await sendBookingConfirmation({
        to: user.email,
        bookingNumber,
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
        bookingId,
      });
    }
  } catch (err) {
    console.error("[email] booking confirmation failed:", err);
  }
}

// ─── Technician: own-booking status + notes ─────────────────────────────────

import { technicians as techniciansTable } from "@/db/schema";

const TECH_NEXT_STATUS: Record<string, string[]> = {
  confirmed: ["in_progress", "no_show"],
  in_progress: ["completed"],
};

export type TechActionResult =
  | { success: true }
  | { success: false; error: string };

async function getTechnicianIdForSession(
  userId: string
): Promise<string | null> {
  const [row] = await db
    .select({ id: techniciansTable.id })
    .from(techniciansTable)
    .where(eq(techniciansTable.userId, userId))
    .limit(1);
  return row?.id ?? null;
}

export async function updateBookingStatusByTechAction(
  bookingId: string,
  nextStatus: string
): Promise<TechActionResult> {
  const session = await getSession();
  if (!session || session.role !== "technician") {
    return { success: false, error: "Unauthorized." };
  }

  const techId = await getTechnicianIdForSession(session.userId);
  if (!techId) {
    return { success: false, error: "Technician profile not found." };
  }

  const [booking] = await db
    .select({
      id: bookings.id,
      status: bookings.status,
      technicianId: bookings.technicianId,
    })
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (!booking || booking.technicianId !== techId) {
    return { success: false, error: "Booking not assigned to you." };
  }

  const allowed = TECH_NEXT_STATUS[booking.status] ?? [];
  if (!allowed.includes(nextStatus)) {
    return {
      success: false,
      error: `Cannot move from "${booking.status}" to "${nextStatus}".`,
    };
  }

  const updates: Record<string, unknown> = {
    status: nextStatus,
    updatedAt: new Date(),
  };
  if (nextStatus === "completed") updates.completedAt = new Date();

  await db.update(bookings).set(updates).where(eq(bookings.id, bookingId));
  return { success: true };
}

export async function updateBookingTechNotesAction(
  bookingId: string,
  notes: string
): Promise<TechActionResult> {
  const session = await getSession();
  if (!session || session.role !== "technician") {
    return { success: false, error: "Unauthorized." };
  }

  const techId = await getTechnicianIdForSession(session.userId);
  if (!techId) {
    return { success: false, error: "Technician profile not found." };
  }

  const trimmed = notes.trim();
  if (trimmed.length > 2000) {
    return { success: false, error: "Notes too long (max 2000 chars)." };
  }

  const [booking] = await db
    .select({ technicianId: bookings.technicianId })
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (!booking || booking.technicianId !== techId) {
    return { success: false, error: "Booking not assigned to you." };
  }

  await db
    .update(bookings)
    .set({ technicianNotes: trimmed, updatedAt: new Date() })
    .where(eq(bookings.id, bookingId));

  return { success: true };
}

// ─── Customer: cancel own booking ───────────────────────────────────────────

export type CancelBookingResult =
  | { success: true }
  | { success: false; error: string };

export async function cancelBookingAction(
  bookingId: string,
  reason: string
): Promise<CancelBookingResult> {
  const session = await getSession();
  if (!session) return { success: false, error: "Please log in." };

  const trimmedReason = reason.trim();
  if (trimmedReason.length === 0) {
    return { success: false, error: "Please provide a reason." };
  }
  if (trimmedReason.length > 500) {
    return { success: false, error: "Reason too long (max 500 chars)." };
  }

  const [booking] = await db
    .select({
      id: bookings.id,
      status: bookings.status,
    })
    .from(bookings)
    .where(
      and(eq(bookings.id, bookingId), eq(bookings.userId, session.userId))
    )
    .limit(1);

  if (!booking) return { success: false, error: "Booking not found." };

  const NON_CANCELLABLE: Array<typeof booking.status> = [
    "in_progress",
    "completed",
    "cancelled",
    "no_show",
  ];
  if (NON_CANCELLABLE.includes(booking.status)) {
    return {
      success: false,
      error: "This booking can no longer be cancelled.",
    };
  }

  await db
    .update(bookings)
    .set({
      status: "cancelled",
      cancelledAt: new Date(),
      cancellationReason: trimmedReason,
      updatedAt: new Date(),
    })
    .where(eq(bookings.id, bookingId));

  return { success: true };
}

// ─── Admin: set the quote ────────────────────────────────────────────────────
// Quote is just a price estimate now — no deposit/balance split. Customer
// accepts the quote to lock the slot; settlement happens offline via Line/FB.

export type SetQuoteResult =
  | { success: true }
  | { success: false; error: string };

export async function setBookingQuoteAction(
  bookingId: string,
  quotedTotalInBaht: number
): Promise<SetQuoteResult> {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { success: false, error: "Unauthorized." };
  }

  if (
    !Number.isFinite(quotedTotalInBaht) ||
    quotedTotalInBaht <= 0 ||
    quotedTotalInBaht > 1_000_000
  ) {
    return { success: false, error: "Invalid quote amount." };
  }

  const quotedTotalInSatang = Math.round(quotedTotalInBaht * 100);

  const [booking] = await db
    .select({
      id: bookings.id,
      bookingNumber: bookings.bookingNumber,
      serviceType: bookings.serviceType,
      userId: bookings.userId,
      serviceAddress: bookings.serviceAddress,
    })
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (!booking) return { success: false, error: "Booking not found." };

  await db
    .update(bookings)
    .set({
      quotedPriceInSatang: quotedTotalInSatang,
      quoteConfirmedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(bookings.id, bookingId));

  if (booking.userId) {
    try {
      const [user] = await db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.id, booking.userId))
        .limit(1);

      if (user?.email) {
        const service = getService(booking.serviceType);
        await sendBookingQuoteReady({
          to: user.email,
          bookingNumber: booking.bookingNumber,
          customerName: booking.serviceAddress.fullName,
          serviceTitle: service?.title ?? booking.serviceType,
          quotedTotalInSatang,
          bookingId: booking.id,
        });
      }
    } catch (err) {
      console.error("[email] quote-ready notification failed:", err);
    }
  }

  return { success: true };
}

// ─── Customer: accept admin's quote ─────────────────────────────────────────

export type AcceptQuoteResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Customer accepts the admin's quote — slot becomes confirmed.
 * Settlement happens offline via Line/Facebook/phone; this just locks the slot.
 */
export async function acceptBookingQuoteAction(
  bookingId: string
): Promise<AcceptQuoteResult> {
  const session = await getSession();
  if (!session) return { success: false, error: "Please log in." };

  try {
    await db.transaction(async (tx) => {
      const [booking] = await tx
        .select({
          id: bookings.id,
          userId: bookings.userId,
          status: bookings.status,
          technicianId: bookings.technicianId,
          scheduledAt: bookings.scheduledAt,
          durationMinutes: bookings.durationMinutes,
          quoteConfirmedAt: bookings.quoteConfirmedAt,
          quoteAcceptedAt: bookings.quoteAcceptedAt,
          quotedPriceInSatang: bookings.quotedPriceInSatang,
        })
        .from(bookings)
        .where(
          and(eq(bookings.id, bookingId), eq(bookings.userId, session.userId))
        )
        .for("update")
        .limit(1);

      if (!booking) throw new Error("Booking not found.");
      if (!booking.quoteConfirmedAt || booking.quotedPriceInSatang == null) {
        throw new Error("Quote not ready yet.");
      }
      if (booking.quoteAcceptedAt) {
        throw new Error("Quote already accepted.");
      }
      if (booking.status === "cancelled") {
        throw new Error("Booking is cancelled.");
      }
      if (!booking.technicianId) {
        throw new Error("No technician assigned.");
      }

      // Slot-conflict check: any OTHER booking already confirmed for this
      // technician overlapping our window?
      const slotStart = new Date(booking.scheduledAt);
      const slotEnd = new Date(
        slotStart.getTime() + booking.durationMinutes * 60 * 1000
      );

      const conflicts = await tx
        .select({ id: bookings.id })
        .from(bookings)
        .where(
          and(
            eq(bookings.technicianId, booking.technicianId),
            sql`${bookings.id} != ${bookingId}`,
            sql`${bookings.status} IN ('confirmed', 'in_progress', 'completed')`,
            sql`${bookings.scheduledAt} < ${slotEnd.toISOString()}`,
            sql`(${bookings.scheduledAt} + (${bookings.durationMinutes} || ' minutes')::interval) > ${slotStart.toISOString()}`
          )
        )
        .limit(1);

      if (conflicts.length > 0) {
        throw new Error("Slot was just booked by someone else. Please pick another time.");
      }

      await tx
        .update(bookings)
        .set({
          quoteAcceptedAt: new Date(),
          status: "confirmed",
          updatedAt: new Date(),
        })
        .where(eq(bookings.id, bookingId));
    });

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to accept quote.";
    return { success: false, error: message };
  }
}

/**
 * Cancel bookings that never moved past "pending" within the window.
 */
export async function cleanupStalePendingBookings(
  olderThanHours = 24 * 7
): Promise<number> {
  const result = await db
    .update(bookings)
    .set({ status: "cancelled" })
    .where(
      and(
        eq(bookings.status, "pending"),
        sql`${bookings.quoteConfirmedAt} IS NULL`,
        sql`${bookings.createdAt} < NOW() - INTERVAL '1 hour' * ${olderThanHours}`
      )
    )
    .returning({ id: bookings.id });

  return result.length;
}
