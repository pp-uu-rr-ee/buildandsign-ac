import { NextResponse } from "next/server";
import { db } from "@/db";
import { bookings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { retrieveCharge } from "@/lib/payment/opn";
import { markDepositPaid, markBalancePaid } from "@/lib/actions/bookings";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/**
 * 3DS return handler for booking payments (deposit AND balance).
 * The charge metadata carries `kind: "deposit" | "balance"` and `bookingId`.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const chargeId = url.searchParams.get("charge_id");

  if (!chargeId || !/^chrg_[a-zA-Z0-9]+$/.test(chargeId)) {
    return NextResponse.redirect(new URL("/bookings?error=invalid", APP_URL));
  }

  let charge;
  try {
    charge = await retrieveCharge(chargeId);
  } catch (err) {
    console.error("[booking-return] retrieveCharge failed:", err);
    return NextResponse.redirect(
      new URL("/bookings?error=payment_error", APP_URL)
    );
  }

  const bookingId = charge.metadata?.bookingId;
  const kind = charge.metadata?.kind;
  if (!bookingId || (kind !== "deposit" && kind !== "balance")) {
    console.error("[booking-return] charge missing metadata:", chargeId);
    return NextResponse.redirect(
      new URL("/bookings?error=order_not_found", APP_URL)
    );
  }

  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (!booking) {
    return NextResponse.redirect(
      new URL("/bookings?error=order_not_found", APP_URL)
    );
  }

  // ── Cross-check charge ↔ booking reference ───────────────────────────────
  const expectedRef =
    kind === "deposit"
      ? booking.depositPaymentReference
      : booking.balancePaymentReference;
  if (expectedRef && expectedRef !== charge.id) {
    console.error("[booking-return] paymentReference mismatch:", {
      bookingId,
      kind,
      onBooking: expectedRef,
      fromReturn: charge.id,
    });
    return NextResponse.redirect(
      new URL("/bookings?error=payment_mismatch", APP_URL)
    );
  }

  // ── Amount + currency ────────────────────────────────────────────────────
  const expectedAmount =
    kind === "deposit" ? booking.depositInSatang : booking.balanceInSatang;
  if (
    expectedAmount == null ||
    charge.amount !== expectedAmount ||
    charge.currency.toUpperCase() !== "THB"
  ) {
    console.error("[booking-return] amount/currency mismatch:", {
      bookingId,
      kind,
      expected: expectedAmount,
      got: charge.amount,
      currency: charge.currency,
    });
    return NextResponse.redirect(
      new URL("/bookings?error=payment_mismatch", APP_URL)
    );
  }

  // ── Handle status ────────────────────────────────────────────────────────
  if (charge.status === "failed" || charge.status === "expired") {
    if (kind === "deposit") {
      await db
        .update(bookings)
        .set({ status: "cancelled", depositPaymentStatus: "failed" })
        .where(eq(bookings.id, bookingId));
    } else {
      await db
        .update(bookings)
        .set({ balancePaymentStatus: "failed" })
        .where(eq(bookings.id, bookingId));
    }
    return NextResponse.redirect(
      new URL(`/bookings/${bookingId}?error=payment_failed`, APP_URL)
    );
  }

  if (charge.status === "successful") {
    if (kind === "deposit" && booking.depositPaymentStatus !== "paid") {
      try {
        await markDepositPaid(bookingId);
      } catch (err) {
        console.error("[CRITICAL] markDepositPaid failed in return:", err);
      }
      return NextResponse.redirect(
        new URL(`/bookings/${bookingId}/confirmation`, APP_URL)
      );
    }
    if (kind === "balance" && booking.balancePaymentStatus !== "paid") {
      try {
        await markBalancePaid(bookingId);
      } catch (err) {
        console.error("[CRITICAL] markBalancePaid failed in return:", err);
      }
    }
    return NextResponse.redirect(
      new URL(`/bookings/${bookingId}`, APP_URL)
    );
  }

  return NextResponse.redirect(
    new URL(`/bookings/${bookingId}`, APP_URL)
  );
}
