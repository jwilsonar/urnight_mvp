CREATE TABLE "mfa_unlock_operator" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"granted_by" uuid NOT NULL,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_mfa_factor" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" varchar(10) NOT NULL,
	"secret_encrypted" varchar(255) NOT NULL,
	"status" varchar(10) NOT NULL,
	"confirmed_at" timestamp with time zone,
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_mfa_factor_type_check" CHECK ("user_mfa_factor"."type" in ('totp')),
	CONSTRAINT "user_mfa_factor_status_check" CHECK ("user_mfa_factor"."status" in ('pending','active','revoked'))
);
--> statement-breakpoint
CREATE TABLE "user_recovery_code" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"code_hash" varchar(100) NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mfa_unlock_operator" ADD CONSTRAINT "mfa_unlock_operator_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mfa_unlock_operator" ADD CONSTRAINT "mfa_unlock_operator_granted_by_user_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_mfa_factor" ADD CONSTRAINT "user_mfa_factor_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_recovery_code" ADD CONSTRAINT "user_recovery_code_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_mfa_unlock_operator_granted_by" ON "mfa_unlock_operator" USING btree ("granted_by");--> statement-breakpoint
CREATE INDEX "idx_user_mfa_factor_user" ON "user_mfa_factor" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_user_mfa_factor_user_type_current" ON "user_mfa_factor" USING btree ("user_id","type") WHERE "user_mfa_factor"."status" <> 'revoked';--> statement-breakpoint
CREATE INDEX "idx_user_recovery_code_user" ON "user_recovery_code" USING btree ("user_id");