CREATE TABLE "local_verification_document" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"local_verification_id" uuid NOT NULL,
	"document_type" varchar(32) NOT NULL,
	"storage_key" varchar(512) NOT NULL,
	"issued_at" date NOT NULL,
	"expires_at" date NOT NULL,
	"review_status" varchar(12) DEFAULT 'pending' NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"review_notes" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "local_verification_document_type_check" CHECK ("local_verification_document"."document_type" in ('municipal_license','itse_certificate','health_certificate','other')),
	CONSTRAINT "local_verification_document_review_status_check" CHECK ("local_verification_document"."review_status" in ('pending','approved','rejected'))
);
--> statement-breakpoint
CREATE TABLE "ticket_hold" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"ticket_type_id" uuid NOT NULL,
	"order_id" uuid,
	"user_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"status" varchar(12) DEFAULT 'active' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ticket_hold_quantity_check" CHECK ("ticket_hold"."quantity" > 0),
	CONSTRAINT "ticket_hold_status_check" CHECK ("ticket_hold"."status" in ('active','converted','expired','released'))
);
--> statement-breakpoint
ALTER TABLE "local_verification_document" ADD CONSTRAINT "local_verification_document_local_verification_id_local_verification_id_fk" FOREIGN KEY ("local_verification_id") REFERENCES "public"."local_verification"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "local_verification_document" ADD CONSTRAINT "local_verification_document_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_hold" ADD CONSTRAINT "ticket_hold_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_hold" ADD CONSTRAINT "ticket_hold_ticket_type_id_ticket_type_id_fk" FOREIGN KEY ("ticket_type_id") REFERENCES "public"."ticket_type"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_hold" ADD CONSTRAINT "ticket_hold_order_id_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_hold" ADD CONSTRAINT "ticket_hold_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_local_verification_document_local_verification" ON "local_verification_document" USING btree ("local_verification_id");--> statement-breakpoint
CREATE INDEX "idx_local_verification_document_expires_at" ON "local_verification_document" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_local_verification_document_review_status" ON "local_verification_document" USING btree ("review_status");--> statement-breakpoint
CREATE INDEX "idx_ticket_hold_event" ON "ticket_hold" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "idx_ticket_hold_ticket_type" ON "ticket_hold" USING btree ("ticket_type_id");--> statement-breakpoint
CREATE INDEX "idx_ticket_hold_expires_at" ON "ticket_hold" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_ticket_hold_status" ON "ticket_hold" USING btree ("status");