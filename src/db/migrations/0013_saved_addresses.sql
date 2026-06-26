ALTER TABLE "users" ADD COLUMN "saved_addresses" jsonb DEFAULT '[]'::jsonb NOT NULL;
