CREATE TABLE "promoter_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"promoter_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"status" varchar(12) DEFAULT 'active' NOT NULL,
	"assigned_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "promoter_event_status_check" CHECK ("promoter_event"."status" in ('active','revoked'))
);
--> statement-breakpoint
CREATE TABLE "promoter_ticket_allocation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"promoter_event_id" uuid NOT NULL,
	"ticket_type_id" uuid NOT NULL,
	"discount_type" varchar(14) DEFAULT 'percentage' NOT NULL,
	"discount_value" numeric(5, 2) DEFAULT '100' NOT NULL,
	"allocated_stock" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "promoter_alloc_discount_type_check" CHECK ("promoter_ticket_allocation"."discount_type" in ('percentage','fixed_amount'))
);
--> statement-breakpoint
ALTER TABLE "promo_code" ADD COLUMN "promoter_event_id" uuid;--> statement-breakpoint
ALTER TABLE "promo_code" ADD COLUMN "clicks" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "promoter_event" ADD CONSTRAINT "promoter_event_promoter_id_promoter_id_fk" FOREIGN KEY ("promoter_id") REFERENCES "public"."promoter"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promoter_event" ADD CONSTRAINT "promoter_event_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promoter_event" ADD CONSTRAINT "promoter_event_assigned_by_user_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promoter_ticket_allocation" ADD CONSTRAINT "promoter_ticket_allocation_promoter_event_id_promoter_event_id_fk" FOREIGN KEY ("promoter_event_id") REFERENCES "public"."promoter_event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promoter_ticket_allocation" ADD CONSTRAINT "promoter_ticket_allocation_ticket_type_id_ticket_type_id_fk" FOREIGN KEY ("ticket_type_id") REFERENCES "public"."ticket_type"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_promoter_event_unique" ON "promoter_event" USING btree ("promoter_id","event_id");--> statement-breakpoint
CREATE INDEX "idx_promoter_event_promoter" ON "promoter_event" USING btree ("promoter_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_promoter_alloc_unique" ON "promoter_ticket_allocation" USING btree ("promoter_event_id","ticket_type_id");--> statement-breakpoint
ALTER TABLE "promo_code" ADD CONSTRAINT "promo_code_promoter_event_id_promoter_event_id_fk" FOREIGN KEY ("promoter_event_id") REFERENCES "public"."promoter_event"("id") ON DELETE set null ON UPDATE no action;