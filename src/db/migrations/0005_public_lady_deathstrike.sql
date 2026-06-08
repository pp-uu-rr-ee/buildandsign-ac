ALTER TABLE "bookings" ADD COLUMN "deposit_in_satang" integer;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "deposit_paid_at" timestamp;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "deposit_payment_reference" varchar(255);--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "deposit_payment_status" "payment_status" DEFAULT 'unpaid' NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "balance_in_satang" integer;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "balance_paid_at" timestamp;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "balance_payment_reference" varchar(255);--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "balance_payment_status" "payment_status" DEFAULT 'unpaid' NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "quote_confirmed_at" timestamp;