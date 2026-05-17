CREATE TABLE "pricing_config" (
	"id" uuid PRIMARY KEY NOT NULL,
	"scope" text NOT NULL,
	"zone_id" uuid,
	"municipality_id" uuid,
	"base_fare" numeric(10, 2) NOT NULL,
	"per_minute" numeric(10, 2) NOT NULL,
	"per_km" numeric(10, 2) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_type" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"increase_percentage" numeric(5, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trip_status" (
	"id" serial PRIMARY KEY NOT NULL,
	"status" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trips" (
	"id" uuid PRIMARY KEY NOT NULL,
	"passenger_id" uuid NOT NULL,
	"idoperador" integer,
	"origin" jsonb NOT NULL,
	"destination" jsonb NOT NULL,
	"destination_address" text NOT NULL,
	"distance_km" numeric(10, 2) NOT NULL,
	"fare" numeric(10, 2) NOT NULL,
	"trip_status_id" integer DEFAULT 1 NOT NULL,
	"service_type_id" integer NOT NULL,
	"requested_at" timestamp DEFAULT now(),
	"started_at" timestamp,
	"completed_at" timestamp,
	"duration_minutes" integer DEFAULT 0 NOT NULL,
	"pricing_config_id" uuid,
	"passenger_rating" integer,
	"driver_rating" integer,
	"passenger_comment" text,
	"driver_comment" text
);
--> statement-breakpoint
ALTER TABLE "pricing_config" ADD CONSTRAINT "pricing_config_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_config" ADD CONSTRAINT "pricing_config_municipality_id_municipality_id_fk" FOREIGN KEY ("municipality_id") REFERENCES "public"."municipality"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_passenger_id_passenger_id_fk" FOREIGN KEY ("passenger_id") REFERENCES "public"."passenger"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_trip_status_id_trip_status_id_fk" FOREIGN KEY ("trip_status_id") REFERENCES "public"."trip_status"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_service_type_id_service_type_id_fk" FOREIGN KEY ("service_type_id") REFERENCES "public"."service_type"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_pricing_config_id_pricing_config_id_fk" FOREIGN KEY ("pricing_config_id") REFERENCES "public"."pricing_config"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pricing_scope_idx" ON "pricing_config" USING btree ("scope");--> statement-breakpoint
CREATE INDEX "pricing_zone_id_idx" ON "pricing_config" USING btree ("zone_id");--> statement-breakpoint
CREATE INDEX "pricing_municipality_id_idx" ON "pricing_config" USING btree ("municipality_id");--> statement-breakpoint
CREATE INDEX "pricing_active_idx" ON "pricing_config" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "service_type_name_uq" ON "service_type" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "trip_status_status_uq" ON "trip_status" USING btree ("status");--> statement-breakpoint
CREATE INDEX "trips_passenger_id_idx" ON "trips" USING btree ("passenger_id");--> statement-breakpoint
CREATE INDEX "trips_status_id_idx" ON "trips" USING btree ("trip_status_id");--> statement-breakpoint
CREATE INDEX "trips_service_type_id_idx" ON "trips" USING btree ("service_type_id");--> statement-breakpoint
CREATE INDEX "trips_pricing_config_id_idx" ON "trips" USING btree ("pricing_config_id");