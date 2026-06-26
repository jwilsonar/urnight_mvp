CREATE TABLE "legal_acceptance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"legal_document_id" uuid NOT NULL,
	"version_accepted" varchar(20) NOT NULL,
	"ip_address" varchar(45),
	"accepted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "legal_document" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"doc_type" varchar(20) NOT NULL,
	"version" varchar(20) NOT NULL,
	"content_url" text NOT NULL,
	"is_current" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "legal_document_doc_type_check" CHECK ("legal_document"."doc_type" in ('terms','privacy','refund_policy'))
);
--> statement-breakpoint
CREATE TABLE "role" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(80) NOT NULL,
	"description" varchar(255),
	"permissions" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "role_code_check" CHECK ("role"."code" in ('user','admin_local','promoter','validator','super_admin'))
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" varchar(120) NOT NULL,
	"email" varchar(160) NOT NULL,
	"password_hash" varchar(100),
	"auth_provider" varchar(10) DEFAULT 'email' NOT NULL,
	"google_sub" varchar(255),
	"document_type" varchar(10),
	"document_number" varchar(20),
	"birth_date" date,
	"phone" varchar(20),
	"avatar_url" varchar(512),
	"email_verified" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_auth_provider_check" CHECK ("user"."auth_provider" in ('email','google')),
	CONSTRAINT "user_document_type_check" CHECK ("user"."document_type" is null or "user"."document_type" in ('dni','ce','passport'))
);
--> statement-breakpoint
CREATE TABLE "user_preference" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"onboarding_completed" boolean DEFAULT false NOT NULL,
	"accepts_marketing" boolean DEFAULT false NOT NULL,
	"accepts_reminders" boolean DEFAULT true NOT NULL,
	"preferred_locale" varchar(10) DEFAULT 'es-PE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_role" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"company_id" uuid,
	"local_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"granted_by" uuid
);
--> statement-breakpoint
ALTER TABLE "legal_acceptance" ADD CONSTRAINT "legal_acceptance_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legal_acceptance" ADD CONSTRAINT "legal_acceptance_legal_document_id_legal_document_id_fk" FOREIGN KEY ("legal_document_id") REFERENCES "public"."legal_document"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preference" ADD CONSTRAINT "user_preference_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_role_id_role_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."role"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_granted_by_user_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_legal_acceptance_user_doc" ON "legal_acceptance" USING btree ("user_id","legal_document_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_legal_document_type_version" ON "legal_document" USING btree ("doc_type","version");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_legal_document_current" ON "legal_document" USING btree ("doc_type") WHERE "legal_document"."is_current";--> statement-breakpoint
CREATE UNIQUE INDEX "idx_role_code" ON "role" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_user_email" ON "user" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_user_google_sub" ON "user" USING btree ("google_sub");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_user_document_number" ON "user" USING btree ("document_number");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_user_preference_user" ON "user_preference" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_role_user" ON "user_role" USING btree ("user_id");