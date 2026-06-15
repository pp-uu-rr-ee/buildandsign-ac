-- Move energy_rating from products (series) to product_variants, and replace
-- the variant `dimensions` column with `energy_rating`.
ALTER TABLE "products" DROP COLUMN "energy_rating";--> statement-breakpoint
ALTER TABLE "product_variants" DROP COLUMN "dimensions";--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "energy_rating" varchar(50);
