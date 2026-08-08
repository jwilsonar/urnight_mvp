CREATE TABLE "local_order" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"local_id" uuid NOT NULL,
	"user_id" uuid,
	"attendee_name" varchar(120) NOT NULL,
	"pickup_code" varchar(8) NOT NULL,
	"pickup_zone" varchar(120) NOT NULL,
	"status" varchar(16) DEFAULT 'received' NOT NULL,
	"payment_method" varchar(16) NOT NULL,
	"payment_status" varchar(12) DEFAULT 'pending' NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'PEN' NOT NULL,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "local_order_status_check" CHECK ("local_order"."status" in ('received','preparing','ready','delivered','cancelled')),
	CONSTRAINT "local_order_payment_method_check" CHECK ("local_order"."payment_method" in ('wallet','card','cash_register')),
	CONSTRAINT "local_order_payment_status_check" CHECK ("local_order"."payment_status" in ('pending','paid','refunded'))
);
--> statement-breakpoint
CREATE TABLE "local_order_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"unit_amount" numeric(10, 2) NOT NULL,
	"line_amount" numeric(10, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "local_order_item_quantity_check" CHECK ("local_order_item"."quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "local_order_split" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"share_token" varchar(64) NOT NULL,
	"expected_total" numeric(10, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "local_order_split_payment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"split_id" uuid NOT NULL,
	"payer_name" varchar(120) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"paid_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "local_order" ADD CONSTRAINT "local_order_local_id_local_id_fk" FOREIGN KEY ("local_id") REFERENCES "public"."local"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "local_order" ADD CONSTRAINT "local_order_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "local_order_item" ADD CONSTRAINT "local_order_item_order_id_local_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."local_order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "local_order_item" ADD CONSTRAINT "local_order_item_product_id_menu_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."menu_product"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "local_order_split" ADD CONSTRAINT "local_order_split_order_id_local_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."local_order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "local_order_split_payment" ADD CONSTRAINT "local_order_split_payment_split_id_local_order_split_id_fk" FOREIGN KEY ("split_id") REFERENCES "public"."local_order_split"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_local_order_local" ON "local_order" USING btree ("local_id");--> statement-breakpoint
CREATE INDEX "idx_local_order_user" ON "local_order" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_local_order_local_pickup_code_open" ON "local_order" USING btree ("local_id","pickup_code") WHERE "local_order"."status" in ('received','preparing','ready');--> statement-breakpoint
CREATE INDEX "idx_local_order_item_order" ON "local_order_item" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_local_order_item_product" ON "local_order_item" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_local_order_split_order" ON "local_order_split" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_local_order_split_share_token" ON "local_order_split" USING btree ("share_token");--> statement-breakpoint
CREATE INDEX "idx_local_order_split_payment_split" ON "local_order_split_payment" USING btree ("split_id");