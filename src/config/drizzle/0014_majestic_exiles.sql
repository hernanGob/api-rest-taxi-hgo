ALTER TABLE "trips" ADD COLUMN "final_fare" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "estimated_duration_minutes" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "base_fare_applied" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "per_minute_applied" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "per_km_applied" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "increase_percentage_applied" numeric(5, 2) DEFAULT '0' NOT NULL;