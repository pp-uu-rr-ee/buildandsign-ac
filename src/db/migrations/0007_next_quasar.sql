DROP TABLE "saved_cards" CASCADE;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'pending'::text;--> statement-breakpoint
DROP TYPE "public"."order_status";--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled');--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."order_status";--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "status" SET DATA TYPE "public"."order_status" USING "status"::"public"."order_status";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "opn_customer_id";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "payment_status";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "payment_method";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "payment_reference";--> statement-breakpoint
ALTER TABLE "bookings" DROP COLUMN "final_price_in_satang";--> statement-breakpoint
ALTER TABLE "bookings" DROP COLUMN "deposit_in_satang";--> statement-breakpoint
ALTER TABLE "bookings" DROP COLUMN "deposit_paid_at";--> statement-breakpoint
ALTER TABLE "bookings" DROP COLUMN "deposit_payment_reference";--> statement-breakpoint
ALTER TABLE "bookings" DROP COLUMN "deposit_payment_status";--> statement-breakpoint
ALTER TABLE "bookings" DROP COLUMN "balance_in_satang";--> statement-breakpoint
ALTER TABLE "bookings" DROP COLUMN "balance_paid_at";--> statement-breakpoint
ALTER TABLE "bookings" DROP COLUMN "balance_payment_reference";--> statement-breakpoint
ALTER TABLE "bookings" DROP COLUMN "balance_payment_status";--> statement-breakpoint
DROP TYPE "public"."payment_status";