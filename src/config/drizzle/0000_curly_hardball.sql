CREATE TABLE "emergency_contact" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"paternal_surname" text NOT NULL,
	"maternal_surname" text NOT NULL,
	"phone" varchar(10) NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "municipality" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"number" integer NOT NULL,
	"zone_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "passenger" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"paternal_surname" text NOT NULL,
	"maternal_surname" text NOT NULL,
	"phone" varchar(15) NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"emergency_contact_id" uuid,
	"date_of_birth" timestamp NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"paternal_surname" text NOT NULL,
	"maternal_surname" text NOT NULL,
	"phone" varchar(15) NOT NULL,
	"email" text NOT NULL,
	"password_hash" text,
	"email_verified" boolean DEFAULT false NOT NULL,
	"code_hash" text DEFAULT '' NOT NULL,
	"nonce" text DEFAULT '' NOT NULL,
	"expires_at" timestamp,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_role_id" uuid
);
--> statement-breakpoint
CREATE TABLE "user_role" (
	"id" uuid PRIMARY KEY NOT NULL,
	"role" text NOT NULL,
	"code" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "zones" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(80) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "municipality" ADD CONSTRAINT "municipality_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "passenger" ADD CONSTRAINT "passenger_emergency_contact_id_emergency_contact_id_fk" FOREIGN KEY ("emergency_contact_id") REFERENCES "public"."emergency_contact"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_user_role_id_user_role_id_fk" FOREIGN KEY ("user_role_id") REFERENCES "public"."user_role"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "emergency_contact_phone_idx" ON "emergency_contact" USING btree ("phone");--> statement-breakpoint
CREATE UNIQUE INDEX "municipality_name_uq" ON "municipality" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "municipality_number_uq" ON "municipality" USING btree ("number");--> statement-breakpoint
CREATE INDEX "municipality_zone_id_idx" ON "municipality" USING btree ("zone_id");--> statement-breakpoint
CREATE INDEX "municipality_active_idx" ON "municipality" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "passenger_email_uq" ON "passenger" USING btree ("email");--> statement-breakpoint
CREATE INDEX "passenger_phone_idx" ON "passenger" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "passenger_emergency_contact_idx" ON "passenger" USING btree ("emergency_contact_id");--> statement-breakpoint
CREATE INDEX "passenger_deleted_idx" ON "passenger" USING btree ("is_deleted");--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_uq" ON "user" USING btree ("email");--> statement-breakpoint
CREATE INDEX "user_phone_idx" ON "user" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "user_deleted_idx" ON "user" USING btree ("is_deleted");--> statement-breakpoint
CREATE UNIQUE INDEX "user_role_role_uq" ON "user_role" USING btree ("role");--> statement-breakpoint
CREATE UNIQUE INDEX "zones_name_uq" ON "zones" USING btree ("name");--> statement-breakpoint
CREATE INDEX "zones_active_idx" ON "zones" USING btree ("is_active");