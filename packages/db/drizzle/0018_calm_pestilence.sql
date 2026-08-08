CREATE TABLE "local_order_window" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"local_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"starts_at" time NOT NULL,
	"ends_at" time NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "local_order_window_day_of_week_check" CHECK ("local_order_window"."day_of_week" between 0 and 6)
);
--> statement-breakpoint
CREATE TABLE "local_policy" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"local_id" uuid NOT NULL,
	"reservation_deposit_percent" integer NOT NULL,
	"birthday_window_days" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "local_policy_reservation_deposit_percent_check" CHECK ("local_policy"."reservation_deposit_percent" between 0 and 100 and "local_policy"."reservation_deposit_percent" % 5 = 0)
);
--> statement-breakpoint
CREATE TABLE "menu_category" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"local_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"display_order" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menu_product" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"name" varchar(160) NOT NULL,
	"description" text,
	"image_key" varchar(512),
	"is_available" boolean DEFAULT true NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menu_product_price" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'PEN' NOT NULL,
	"valid_from" timestamp with time zone NOT NULL,
	"valid_to" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "role" DROP CONSTRAINT "role_code_check";--> statement-breakpoint
ALTER TABLE "local_order_window" ADD CONSTRAINT "local_order_window_local_id_local_id_fk" FOREIGN KEY ("local_id") REFERENCES "public"."local"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "local_policy" ADD CONSTRAINT "local_policy_local_id_local_id_fk" FOREIGN KEY ("local_id") REFERENCES "public"."local"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_category" ADD CONSTRAINT "menu_category_local_id_local_id_fk" FOREIGN KEY ("local_id") REFERENCES "public"."local"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_product" ADD CONSTRAINT "menu_product_category_id_menu_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."menu_category"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_product_price" ADD CONSTRAINT "menu_product_price_product_id_menu_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."menu_product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_local_order_window_local" ON "local_order_window" USING btree ("local_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_local_policy_local" ON "local_policy" USING btree ("local_id");--> statement-breakpoint
CREATE INDEX "idx_menu_category_local" ON "menu_category" USING btree ("local_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_menu_category_local_name" ON "menu_category" USING btree ("local_id","name");--> statement-breakpoint
CREATE INDEX "idx_menu_product_category" ON "menu_product" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_menu_product_price_product" ON "menu_product_price" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_menu_product_price_product_current" ON "menu_product_price" USING btree ("product_id") WHERE "menu_product_price"."valid_to" is null;--> statement-breakpoint
ALTER TABLE "role" ADD CONSTRAINT "role_code_check" CHECK ("role"."code" in ('user','admin_local','promoter','validator','staff','super_admin'));