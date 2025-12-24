CREATE TABLE "balloons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"latitiude" numeric NOT NULL,
	"longitude" numeric NOT NULL,
	"altitude" numeric NOT NULL,
	"snapshot_hour" integer NOT NULL,
	"array_index" integer NOT NULL,
	"fetched_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "balloons_id_unique" UNIQUE("id")
);
