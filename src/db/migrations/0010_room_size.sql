-- Replace power_consumption_w with room_size_sqm on product_variants.
-- They're different specs (W vs m²) so we drop + add rather than rename.
ALTER TABLE "product_variants" DROP COLUMN "power_consumption_w";--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "room_size_sqm" integer;
