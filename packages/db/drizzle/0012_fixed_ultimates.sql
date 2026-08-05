CREATE INDEX "idx_ticket_order_item" ON "ticket" USING btree ("order_item_id");--> statement-breakpoint
CREATE INDEX "idx_ticket_event_status_used_at" ON "ticket" USING btree ("event_id","status","used_at");--> statement-breakpoint
CREATE INDEX "idx_promo_code_promoter_event" ON "promo_code" USING btree ("promoter_id","event_id");--> statement-breakpoint
CREATE INDEX "idx_promoter_event_event" ON "promoter_event" USING btree ("event_id");