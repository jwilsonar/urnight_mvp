ALTER TABLE "promoter" DROP CONSTRAINT "promoter_status_check";--> statement-breakpoint
ALTER TABLE "promoter" ADD COLUMN "invited_email" varchar(160);--> statement-breakpoint
ALTER TABLE "promoter" ADD CONSTRAINT "promoter_status_check" CHECK ("promoter"."status" in ('active','inactive','suspended','pending'));