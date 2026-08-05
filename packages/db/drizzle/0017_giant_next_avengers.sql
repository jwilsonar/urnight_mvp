CREATE TABLE "promoter_local_policy" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"local_id" uuid NOT NULL,
	"cascade_enabled" boolean DEFAULT false NOT NULL,
	"cascade_percentage" numeric(5, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "promoter_local_policy_cascade_percentage_check" CHECK ("promoter_local_policy"."cascade_percentage" >= 0 and "promoter_local_policy"."cascade_percentage" <= 100)
);
--> statement-breakpoint
ALTER TABLE "promoter" ADD COLUMN "parent_promoter_id" uuid;--> statement-breakpoint
ALTER TABLE "sale_attribution" ADD COLUMN "head_promoter_id" uuid;--> statement-breakpoint
ALTER TABLE "sale_attribution" ADD COLUMN "head_commission_rate" numeric(5, 4);--> statement-breakpoint
ALTER TABLE "sale_attribution" ADD COLUMN "head_commission_amount" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "promoter_local_policy" ADD CONSTRAINT "promoter_local_policy_local_id_local_id_fk" FOREIGN KEY ("local_id") REFERENCES "public"."local"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_promoter_local_policy_local" ON "promoter_local_policy" USING btree ("local_id");--> statement-breakpoint
ALTER TABLE "promoter" ADD CONSTRAINT "promoter_parent_promoter_id_promoter_id_fk" FOREIGN KEY ("parent_promoter_id") REFERENCES "public"."promoter"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_attribution" ADD CONSTRAINT "sale_attribution_head_promoter_id_promoter_id_fk" FOREIGN KEY ("head_promoter_id") REFERENCES "public"."promoter"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_promoter_parent" ON "promoter" USING btree ("parent_promoter_id");--> statement-breakpoint
CREATE INDEX "idx_sale_attribution_head_promoter" ON "sale_attribution" USING btree ("head_promoter_id");--> statement-breakpoint
ALTER TABLE "sale_attribution" ADD CONSTRAINT "sale_attribution_head_commission_rate_check" CHECK ("sale_attribution"."head_commission_rate" is null or ("sale_attribution"."head_commission_rate" >= 0 and "sale_attribution"."head_commission_rate" <= 1));