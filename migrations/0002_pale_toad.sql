CREATE TABLE "dhl_shipments" (
	"tracking_number" varchar(100) PRIMARY KEY NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "dhl_updated_at_idx" ON "dhl_shipments" USING btree ("updated_at");