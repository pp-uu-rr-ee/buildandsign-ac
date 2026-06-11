ALTER TABLE "product_variants" ADD COLUMN "cooling_capacity_btu" integer;--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "noise_level_db" numeric(4, 1);--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "dimensions" varchar(120);--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "power_consumption_w" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "brand" varchar(100);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "eer" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "voltage" varchar(60);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "refrigerant" varchar(20);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "warranty_text" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "energy_rating" varchar(50);