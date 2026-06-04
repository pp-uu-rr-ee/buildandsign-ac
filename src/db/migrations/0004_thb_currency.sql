ALTER TABLE "products" RENAME COLUMN "price_in_cents" TO "price_in_satang";
--> statement-breakpoint
ALTER TABLE "products" RENAME COLUMN "compare_price_in_cents" TO "compare_price_in_satang";
--> statement-breakpoint
ALTER TABLE "orders" RENAME COLUMN "subtotal_in_cents" TO "subtotal_in_satang";
--> statement-breakpoint
ALTER TABLE "orders" RENAME COLUMN "shipping_in_cents" TO "shipping_in_satang";
--> statement-breakpoint
ALTER TABLE "orders" RENAME COLUMN "tax_in_cents" TO "tax_in_satang";
--> statement-breakpoint
ALTER TABLE "orders" RENAME COLUMN "discount_in_cents" TO "discount_in_satang";
--> statement-breakpoint
ALTER TABLE "orders" RENAME COLUMN "total_in_cents" TO "total_in_satang";
--> statement-breakpoint
ALTER TABLE "order_items" RENAME COLUMN "unit_price_in_cents" TO "unit_price_in_satang";
--> statement-breakpoint
ALTER TABLE "order_items" RENAME COLUMN "total_in_cents" TO "total_in_satang";
--> statement-breakpoint
ALTER TABLE "bookings" RENAME COLUMN "quoted_price_in_cents" TO "quoted_price_in_satang";
--> statement-breakpoint
ALTER TABLE "bookings" RENAME COLUMN "final_price_in_cents" TO "final_price_in_satang";
