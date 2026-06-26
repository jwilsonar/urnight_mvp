CREATE TABLE "affiliation_request" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"legal_name" varchar(200) NOT NULL,
	"ruc" varchar(11) NOT NULL,
	"commercial_name" varchar(200) NOT NULL,
	"zone_id" uuid,
	"address" varchar(255),
	"socials" varchar(512),
	"contact_name" varchar(160),
	"contact_email" varchar(160),
	"contact_phone" varchar(20),
	"status" varchar(12) DEFAULT 'pending' NOT NULL,
	"rejection_reason" varchar(255),
	"submitted_by" uuid,
	"reviewed_by" uuid,
	"company_id" uuid,
	"local_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone,
	CONSTRAINT "affiliation_request_status_check" CHECK ("affiliation_request"."status" in ('pending','approved','rejected'))
);
--> statement-breakpoint
CREATE TABLE "company" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"legal_name" varchar(200) NOT NULL,
	"ruc" varchar(11) NOT NULL,
	"commercial_name" varchar(200) NOT NULL,
	"contact_email" varchar(160),
	"contact_phone" varchar(20),
	"status" varchar(12) DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "company_status_check" CHECK ("company"."status" in ('draft','active','suspended'))
);
--> statement-breakpoint
CREATE TABLE "local" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"zone_id" uuid,
	"name" varchar(160) NOT NULL,
	"slug" varchar(180) NOT NULL,
	"description" text,
	"address" varchar(255),
	"latitude" double precision,
	"longitude" double precision,
	"google_maps_url" varchar(512),
	"opening_hours" jsonb,
	"socials" varchar(512),
	"main_image_url" varchar(512),
	"status" varchar(12) DEFAULT 'draft' NOT NULL,
	"suspension_reason" varchar(255),
	"is_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "local_status_check" CHECK ("local"."status" in ('draft','active','inactive','suspended'))
);
--> statement-breakpoint
CREATE TABLE "local_genre" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"local_id" uuid NOT NULL,
	"genre_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "local_image" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"local_id" uuid NOT NULL,
	"url" varchar(512) NOT NULL,
	"is_main" boolean DEFAULT false NOT NULL,
	"sort_order" double precision DEFAULT 0 NOT NULL,
	"width" double precision,
	"height" double precision,
	"size_bytes" double precision,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "local_local_type" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"local_id" uuid NOT NULL,
	"local_type_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "local_tag" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"local_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "local_verification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"local_id" uuid NOT NULL,
	"status" varchar(12) DEFAULT 'pending' NOT NULL,
	"license_reference" varchar(120),
	"document_url" varchar(512),
	"notes" varchar(500),
	"verified_by" uuid,
	"valid_until" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "local_verification_status_check" CHECK ("local_verification"."status" in ('pending','approved','observed','expired'))
);
--> statement-breakpoint
CREATE TABLE "event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"local_id" uuid NOT NULL,
	"name" varchar(180) NOT NULL,
	"slug" varchar(200) NOT NULL,
	"description" text,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone,
	"flyer_url" varchar(512),
	"total_capacity" integer DEFAULT 0 NOT NULL,
	"tickets_sold" integer DEFAULT 0 NOT NULL,
	"checkins_count" integer DEFAULT 0 NOT NULL,
	"status" varchar(12) DEFAULT 'draft' NOT NULL,
	"min_age_note" varchar(40) DEFAULT '+18' NOT NULL,
	"dress_code" varchar(120),
	"created_by" uuid,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_status_check" CHECK ("event"."status" in ('draft','scheduled','published','cancelled','finished'))
);
--> statement-breakpoint
CREATE TABLE "event_genre" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"genre_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_image" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"url" varchar(512) NOT NULL,
	"is_flyer" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_tag" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ticket_type" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"name" varchar(80) NOT NULL,
	"tier_code" varchar(12) DEFAULT 'general' NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'PEN' NOT NULL,
	"stock" integer NOT NULL,
	"sold" integer DEFAULT 0 NOT NULL,
	"max_per_user" integer,
	"sale_starts_at" timestamp with time zone,
	"sale_ends_at" timestamp with time zone,
	"status" varchar(12) DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ticket_type_tier_check" CHECK ("ticket_type"."tier_code" in ('general','vip','premium')),
	CONSTRAINT "ticket_type_status_check" CHECK ("ticket_type"."status" in ('active','paused','sold_out')),
	CONSTRAINT "ticket_type_sold_check" CHECK ("ticket_type"."sold" <= "ticket_type"."stock")
);
--> statement-breakpoint
CREATE TABLE "attendee" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"full_name" varchar(120) NOT NULL,
	"document_type" varchar(10) NOT NULL,
	"document_number" varchar(20) NOT NULL,
	"birth_date" date NOT NULL,
	"is_buyer" boolean DEFAULT false NOT NULL,
	CONSTRAINT "attendee_document_type_check" CHECK ("attendee"."document_type" in ('dni','ce','passport'))
);
--> statement-breakpoint
CREATE TABLE "order" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_code" varchar(20) NOT NULL,
	"user_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"discount_total" numeric(10, 2) DEFAULT '0' NOT NULL,
	"commission_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'PEN' NOT NULL,
	"status" varchar(12) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"paid_at" timestamp with time zone,
	CONSTRAINT "order_status_check" CHECK ("order"."status" in ('pending','paid','failed','cancelled','refunded'))
);
--> statement-breakpoint
CREATE TABLE "order_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"ticket_type_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"line_total" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"gateway" varchar(12) DEFAULT 'mock' NOT NULL,
	"method" varchar(8) NOT NULL,
	"gateway_reference" varchar(120),
	"amount" numeric(10, 2) NOT NULL,
	"status" varchar(12) DEFAULT 'pending' NOT NULL,
	"failure_reason" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"confirmed_at" timestamp with time zone,
	CONSTRAINT "payment_gateway_check" CHECK ("payment"."gateway" in ('culqi','izipay','mock')),
	CONSTRAINT "payment_method_check" CHECK ("payment"."method" in ('card','yape','plin')),
	CONSTRAINT "payment_status_check" CHECK ("payment"."status" in ('pending','approved','rejected'))
);
--> statement-breakpoint
CREATE TABLE "qr_validation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"local_id" uuid,
	"validated_by" uuid,
	"result" varchar(16) NOT NULL,
	"method" varchar(16) DEFAULT 'scan' NOT NULL,
	"device_info" varchar(255),
	"scanned_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "qr_validation_result_check" CHECK ("qr_validation"."result" in ('valid','already_used','cancelled','invalid'))
);
--> statement-breakpoint
CREATE TABLE "ticket" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_item_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"ticket_type_id" uuid NOT NULL,
	"qr_code" varchar(64) NOT NULL,
	"status" varchar(12) DEFAULT 'valid' NOT NULL,
	"pdf_url" varchar(512),
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"used_at" timestamp with time zone,
	CONSTRAINT "ticket_status_check" CHECK ("ticket"."status" in ('valid','used','cancelled','expired'))
);
--> statement-breakpoint
CREATE TABLE "promo_code" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(40) NOT NULL,
	"discount_type" varchar(14) NOT NULL,
	"discount_value" numeric(10, 2) NOT NULL,
	"usage_quota" integer,
	"used_count" integer DEFAULT 0 NOT NULL,
	"valid_from" timestamp with time zone,
	"valid_until" timestamp with time zone,
	"scope" varchar(12) DEFAULT 'global' NOT NULL,
	"event_id" uuid,
	"local_id" uuid,
	"zone_id" uuid,
	"promoter_id" uuid,
	"ticket_type_id" uuid,
	"created_by" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "promo_code_discount_type_check" CHECK ("promo_code"."discount_type" in ('percentage','fixed_amount')),
	CONSTRAINT "promo_code_scope_check" CHECK ("promo_code"."scope" in ('global','event','local','zone','promoter','ticket_type'))
);
--> statement-breakpoint
CREATE TABLE "promo_code_redemption" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"promo_code_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"discount_applied" numeric(10, 2) NOT NULL,
	"redeemed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promoter" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"local_id" uuid,
	"user_id" uuid,
	"name" varchar(160) NOT NULL,
	"contact_email" varchar(160),
	"contact_phone" varchar(20),
	"status" varchar(12) DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "promoter_status_check" CHECK ("promoter"."status" in ('active','inactive','suspended'))
);
--> statement-breakpoint
CREATE TABLE "promoter_application" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"local_id" uuid,
	"event_id" uuid,
	"applicant_user_id" uuid,
	"name" varchar(160) NOT NULL,
	"contact_email" varchar(160),
	"contact_phone" varchar(20),
	"socials" varchar(512),
	"status" varchar(12) DEFAULT 'pending' NOT NULL,
	"reviewed_by" uuid,
	"created_promoter_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone,
	CONSTRAINT "promoter_application_status_check" CHECK ("promoter_application"."status" in ('pending','approved','rejected'))
);
--> statement-breakpoint
CREATE TABLE "referral_link" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"promoter_id" uuid NOT NULL,
	"code" varchar(12) NOT NULL,
	"url" varchar(255) NOT NULL,
	"clicks" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sale_attribution" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"promoter_id" uuid NOT NULL,
	"referral_link_id" uuid,
	"commission_rate" numeric(5, 4) NOT NULL,
	"commission_amount" numeric(10, 2) NOT NULL,
	"status" varchar(12) DEFAULT 'estimated' NOT NULL,
	"attributed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sale_attribution_status_check" CHECK ("sale_attribution"."status" in ('estimated','confirmed','void'))
);
--> statement-breakpoint
CREATE TABLE "report" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reporter_user_id" uuid,
	"target_type" varchar(8) NOT NULL,
	"local_id" uuid,
	"event_id" uuid,
	"reason" varchar(16) NOT NULL,
	"comment" text,
	"severity" varchar(8) DEFAULT 'low' NOT NULL,
	"status" varchar(10) DEFAULT 'open' NOT NULL,
	"resolution_note" text,
	"resolved_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone,
	CONSTRAINT "report_target_type_check" CHECK ("report"."target_type" in ('local','event')),
	CONSTRAINT "report_reason_check" CHECK ("report"."reason" in ('cancelled','wrong_price','wrong_location','unsafe','other')),
	CONSTRAINT "report_severity_check" CHECK ("report"."severity" in ('low','medium','high')),
	CONSTRAINT "report_status_check" CHECK ("report"."status" in ('open','reviewed','resolved')),
	CONSTRAINT "target_one_of_check" CHECK (("report"."local_id" is not null and "report"."event_id" is null) or ("report"."local_id" is null and "report"."event_id" is not null))
);
--> statement-breakpoint
CREATE TABLE "review" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"target_type" varchar(8) NOT NULL,
	"local_id" uuid,
	"event_id" uuid,
	"ticket_id" uuid,
	"rating" integer NOT NULL,
	"comment" text,
	"quick_tags" jsonb,
	"is_verified" boolean DEFAULT false NOT NULL,
	"is_reported" boolean DEFAULT false NOT NULL,
	"status" varchar(12) DEFAULT 'published' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "review_target_type_check" CHECK ("review"."target_type" in ('local','event')),
	CONSTRAINT "review_rating_check" CHECK ("review"."rating" between 1 and 5),
	CONSTRAINT "review_status_check" CHECK ("review"."status" in ('published','hidden')),
	CONSTRAINT "target_one_of_check" CHECK (("review"."local_id" is not null and "review"."event_id" is null) or ("review"."local_id" is null and "review"."event_id" is not null))
);
--> statement-breakpoint
CREATE TABLE "analytics_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"session_id" varchar(80),
	"event_name" varchar(60) NOT NULL,
	"event_id" uuid,
	"local_id" uuid,
	"zone_id" uuid,
	"properties" jsonb,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" uuid,
	"action" varchar(40) NOT NULL,
	"entity_type" varchar(60) NOT NULL,
	"entity_id" uuid,
	"before_state" jsonb,
	"after_state" jsonb,
	"ip_address" varchar(45),
	"device_info" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"channel" varchar(8) DEFAULT 'email' NOT NULL,
	"type" varchar(40) NOT NULL,
	"subject" varchar(200),
	"body" text,
	"is_transactional" boolean DEFAULT true NOT NULL,
	"status" varchar(8) DEFAULT 'queued' NOT NULL,
	"failure_reason" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sent_at" timestamp with time zone,
	CONSTRAINT "notification_channel_check" CHECK ("notification"."channel" in ('email','push')),
	CONSTRAINT "notification_status_check" CHECK ("notification"."status" in ('queued','sent','failed'))
);
--> statement-breakpoint
CREATE TABLE "pilot_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"local_id" uuid,
	"source" varchar(8) DEFAULT 'user' NOT NULL,
	"area" varchar(8) DEFAULT 'other' NOT NULL,
	"score" integer,
	"comment" text,
	"linked_issue_ref" varchar(120),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pilot_feedback_source_check" CHECK ("pilot_feedback"."source" in ('local','user')),
	CONSTRAINT "pilot_feedback_area_check" CHECK ("pilot_feedback"."area" in ('door','payment','ux','other'))
);
--> statement-breakpoint
CREATE TABLE "platform_setting" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(80) NOT NULL,
	"value" text NOT NULL,
	"value_type" varchar(8) DEFAULT 'string' NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "platform_setting_value_type_check" CHECK ("platform_setting"."value_type" in ('string','number','boolean','json'))
);
--> statement-breakpoint
CREATE TABLE "support_ticket" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_code" varchar(20) NOT NULL,
	"opened_by" uuid,
	"local_id" uuid,
	"subject" varchar(200) NOT NULL,
	"description" text,
	"category" varchar(10) DEFAULT 'request' NOT NULL,
	"status" varchar(12) DEFAULT 'open' NOT NULL,
	"priority" varchar(8) DEFAULT 'low' NOT NULL,
	"assigned_to" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "support_ticket_category_check" CHECK ("support_ticket"."category" in ('incident','request','bug')),
	CONSTRAINT "support_ticket_status_check" CHECK ("support_ticket"."status" in ('open','in_progress','resolved','closed')),
	CONSTRAINT "support_ticket_priority_check" CHECK ("support_ticket"."priority" in ('low','medium','high'))
);
--> statement-breakpoint
ALTER TABLE "affiliation_request" ADD CONSTRAINT "affiliation_request_zone_id_zone_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zone"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliation_request" ADD CONSTRAINT "affiliation_request_submitted_by_user_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliation_request" ADD CONSTRAINT "affiliation_request_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliation_request" ADD CONSTRAINT "affiliation_request_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliation_request" ADD CONSTRAINT "affiliation_request_local_id_local_id_fk" FOREIGN KEY ("local_id") REFERENCES "public"."local"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "local" ADD CONSTRAINT "local_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "local" ADD CONSTRAINT "local_zone_id_zone_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zone"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "local_genre" ADD CONSTRAINT "local_genre_local_id_local_id_fk" FOREIGN KEY ("local_id") REFERENCES "public"."local"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "local_genre" ADD CONSTRAINT "local_genre_genre_id_music_genre_id_fk" FOREIGN KEY ("genre_id") REFERENCES "public"."music_genre"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "local_image" ADD CONSTRAINT "local_image_local_id_local_id_fk" FOREIGN KEY ("local_id") REFERENCES "public"."local"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "local_local_type" ADD CONSTRAINT "local_local_type_local_id_local_id_fk" FOREIGN KEY ("local_id") REFERENCES "public"."local"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "local_local_type" ADD CONSTRAINT "local_local_type_local_type_id_local_type_id_fk" FOREIGN KEY ("local_type_id") REFERENCES "public"."local_type"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "local_tag" ADD CONSTRAINT "local_tag_local_id_local_id_fk" FOREIGN KEY ("local_id") REFERENCES "public"."local"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "local_tag" ADD CONSTRAINT "local_tag_tag_id_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tag"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "local_verification" ADD CONSTRAINT "local_verification_local_id_local_id_fk" FOREIGN KEY ("local_id") REFERENCES "public"."local"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "local_verification" ADD CONSTRAINT "local_verification_verified_by_user_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event" ADD CONSTRAINT "event_local_id_local_id_fk" FOREIGN KEY ("local_id") REFERENCES "public"."local"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event" ADD CONSTRAINT "event_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_genre" ADD CONSTRAINT "event_genre_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_genre" ADD CONSTRAINT "event_genre_genre_id_music_genre_id_fk" FOREIGN KEY ("genre_id") REFERENCES "public"."music_genre"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_image" ADD CONSTRAINT "event_image_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_tag" ADD CONSTRAINT "event_tag_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_tag" ADD CONSTRAINT "event_tag_tag_id_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tag"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_type" ADD CONSTRAINT "ticket_type_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendee" ADD CONSTRAINT "attendee_ticket_id_ticket_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."ticket"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_order_id_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_ticket_type_id_ticket_type_id_fk" FOREIGN KEY ("ticket_type_id") REFERENCES "public"."ticket_type"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_order_id_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qr_validation" ADD CONSTRAINT "qr_validation_ticket_id_ticket_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."ticket"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qr_validation" ADD CONSTRAINT "qr_validation_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qr_validation" ADD CONSTRAINT "qr_validation_local_id_local_id_fk" FOREIGN KEY ("local_id") REFERENCES "public"."local"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qr_validation" ADD CONSTRAINT "qr_validation_validated_by_user_id_fk" FOREIGN KEY ("validated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_order_item_id_order_item_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_ticket_type_id_ticket_type_id_fk" FOREIGN KEY ("ticket_type_id") REFERENCES "public"."ticket_type"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_code" ADD CONSTRAINT "promo_code_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_code" ADD CONSTRAINT "promo_code_local_id_local_id_fk" FOREIGN KEY ("local_id") REFERENCES "public"."local"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_code" ADD CONSTRAINT "promo_code_zone_id_zone_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zone"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_code" ADD CONSTRAINT "promo_code_promoter_id_promoter_id_fk" FOREIGN KEY ("promoter_id") REFERENCES "public"."promoter"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_code" ADD CONSTRAINT "promo_code_ticket_type_id_ticket_type_id_fk" FOREIGN KEY ("ticket_type_id") REFERENCES "public"."ticket_type"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_code" ADD CONSTRAINT "promo_code_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_code_redemption" ADD CONSTRAINT "promo_code_redemption_promo_code_id_promo_code_id_fk" FOREIGN KEY ("promo_code_id") REFERENCES "public"."promo_code"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_code_redemption" ADD CONSTRAINT "promo_code_redemption_order_id_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_code_redemption" ADD CONSTRAINT "promo_code_redemption_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promoter" ADD CONSTRAINT "promoter_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promoter" ADD CONSTRAINT "promoter_local_id_local_id_fk" FOREIGN KEY ("local_id") REFERENCES "public"."local"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promoter" ADD CONSTRAINT "promoter_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promoter_application" ADD CONSTRAINT "promoter_application_local_id_local_id_fk" FOREIGN KEY ("local_id") REFERENCES "public"."local"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promoter_application" ADD CONSTRAINT "promoter_application_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promoter_application" ADD CONSTRAINT "promoter_application_applicant_user_id_user_id_fk" FOREIGN KEY ("applicant_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promoter_application" ADD CONSTRAINT "promoter_application_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promoter_application" ADD CONSTRAINT "promoter_application_created_promoter_id_promoter_id_fk" FOREIGN KEY ("created_promoter_id") REFERENCES "public"."promoter"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_link" ADD CONSTRAINT "referral_link_promoter_id_promoter_id_fk" FOREIGN KEY ("promoter_id") REFERENCES "public"."promoter"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_attribution" ADD CONSTRAINT "sale_attribution_order_id_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_attribution" ADD CONSTRAINT "sale_attribution_promoter_id_promoter_id_fk" FOREIGN KEY ("promoter_id") REFERENCES "public"."promoter"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_attribution" ADD CONSTRAINT "sale_attribution_referral_link_id_referral_link_id_fk" FOREIGN KEY ("referral_link_id") REFERENCES "public"."referral_link"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report" ADD CONSTRAINT "report_reporter_user_id_user_id_fk" FOREIGN KEY ("reporter_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report" ADD CONSTRAINT "report_local_id_local_id_fk" FOREIGN KEY ("local_id") REFERENCES "public"."local"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report" ADD CONSTRAINT "report_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report" ADD CONSTRAINT "report_resolved_by_user_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "review_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "review_local_id_local_id_fk" FOREIGN KEY ("local_id") REFERENCES "public"."local"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "review_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "review_ticket_id_ticket_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."ticket"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_event" ADD CONSTRAINT "analytics_event_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_event" ADD CONSTRAINT "analytics_event_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_event" ADD CONSTRAINT "analytics_event_local_id_local_id_fk" FOREIGN KEY ("local_id") REFERENCES "public"."local"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_event" ADD CONSTRAINT "analytics_event_zone_id_zone_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zone"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_user_id_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pilot_feedback" ADD CONSTRAINT "pilot_feedback_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pilot_feedback" ADD CONSTRAINT "pilot_feedback_local_id_local_id_fk" FOREIGN KEY ("local_id") REFERENCES "public"."local"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_setting" ADD CONSTRAINT "platform_setting_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_ticket" ADD CONSTRAINT "support_ticket_opened_by_user_id_fk" FOREIGN KEY ("opened_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_ticket" ADD CONSTRAINT "support_ticket_local_id_local_id_fk" FOREIGN KEY ("local_id") REFERENCES "public"."local"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_ticket" ADD CONSTRAINT "support_ticket_assigned_to_user_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_company_ruc" ON "company" USING btree ("ruc");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_local_slug" ON "local" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_local_company" ON "local" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_local_zone" ON "local" USING btree ("zone_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_local_genre" ON "local_genre" USING btree ("local_id","genre_id");--> statement-breakpoint
CREATE INDEX "idx_local_image_local" ON "local_image" USING btree ("local_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_local_local_type" ON "local_local_type" USING btree ("local_id","local_type_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_local_tag" ON "local_tag" USING btree ("local_id","tag_id");--> statement-breakpoint
CREATE INDEX "idx_local_verification_local" ON "local_verification" USING btree ("local_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_event_slug" ON "event" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_event_local" ON "event" USING btree ("local_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_event_genre" ON "event_genre" USING btree ("event_id","genre_id");--> statement-breakpoint
CREATE INDEX "idx_event_image_event" ON "event_image" USING btree ("event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_event_tag" ON "event_tag" USING btree ("event_id","tag_id");--> statement-breakpoint
CREATE INDEX "idx_ticket_type_event" ON "ticket_type" USING btree ("event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_attendee_ticket" ON "attendee" USING btree ("ticket_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_order_code" ON "order" USING btree ("order_code");--> statement-breakpoint
CREATE INDEX "idx_order_user" ON "order" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_order_event" ON "order" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "idx_order_item_order" ON "order_item" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_payment_order" ON "payment" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_qr_validation_ticket" ON "qr_validation" USING btree ("ticket_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_ticket_qr" ON "ticket" USING btree ("qr_code");--> statement-breakpoint
CREATE INDEX "idx_ticket_event" ON "ticket" USING btree ("event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_promo_code_code" ON "promo_code" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_promo_code_redemption_code" ON "promo_code_redemption" USING btree ("promo_code_id");--> statement-breakpoint
CREATE INDEX "idx_promoter_company" ON "promoter" USING btree ("company_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_referral_link_code" ON "referral_link" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_referral_link_promoter" ON "referral_link" USING btree ("promoter_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_sale_attribution_order" ON "sale_attribution" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_sale_attribution_promoter" ON "sale_attribution" USING btree ("promoter_id");--> statement-breakpoint
CREATE INDEX "idx_report_local" ON "report" USING btree ("local_id");--> statement-breakpoint
CREATE INDEX "idx_report_event" ON "report" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "idx_review_local" ON "review" USING btree ("local_id");--> statement-breakpoint
CREATE INDEX "idx_review_event" ON "review" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "idx_analytics_event_name" ON "analytics_event" USING btree ("event_name");--> statement-breakpoint
CREATE INDEX "idx_notification_user" ON "notification" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_platform_setting_key" ON "platform_setting" USING btree ("key");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_support_ticket_code" ON "support_ticket" USING btree ("ticket_code");