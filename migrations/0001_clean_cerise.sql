CREATE UNIQUE INDEX "hour_index_idx" ON "balloons" USING btree ("snapshot_hour","array_index");--> statement-breakpoint
CREATE INDEX "fetched_at_idx" ON "balloons" USING btree ("fetched_at");--> statement-breakpoint
CREATE INDEX "snapshot_hour_idx" ON "balloons" USING btree ("snapshot_hour");