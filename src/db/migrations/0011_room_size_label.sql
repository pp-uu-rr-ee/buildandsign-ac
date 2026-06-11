-- Switch room_size_sqm from integer to varchar so admins can enter ranges
-- (e.g. "25-30") and free-form labels (e.g. "Up to 18", "12 / 18").
ALTER TABLE "product_variants"
  ALTER COLUMN "room_size_sqm" TYPE varchar(30)
  USING "room_size_sqm"::varchar;
