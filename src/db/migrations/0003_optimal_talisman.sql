CREATE TABLE "saved_cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"opn_card_id" varchar(255) NOT NULL,
	"last4" varchar(4) NOT NULL,
	"brand" varchar(50),
	"exp_month" integer NOT NULL,
	"exp_year" integer NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "saved_cards_opn_card_id_unique" UNIQUE("opn_card_id")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "opn_customer_id" varchar(255);--> statement-breakpoint
ALTER TABLE "saved_cards" ADD CONSTRAINT "saved_cards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "saved_cards_user_idx" ON "saved_cards" USING btree ("user_id");