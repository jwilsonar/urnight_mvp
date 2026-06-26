CREATE TABLE "user_favorite" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"target_type" varchar(8) NOT NULL,
	"local_id" uuid,
	"event_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_favorite_target_type_check" CHECK ("user_favorite"."target_type" in ('local','event')),
	CONSTRAINT "user_favorite_target_one_of_check" CHECK (("user_favorite"."local_id" is not null and "user_favorite"."event_id" is null) or ("user_favorite"."local_id" is null and "user_favorite"."event_id" is not null))
);
--> statement-breakpoint
ALTER TABLE "user_favorite" ADD CONSTRAINT "user_favorite_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_user_favorite_user" ON "user_favorite" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_user_favorite_user_local" ON "user_favorite" USING btree ("user_id","local_id") WHERE "user_favorite"."local_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_user_favorite_user_event" ON "user_favorite" USING btree ("user_id","event_id") WHERE "user_favorite"."event_id" is not null;