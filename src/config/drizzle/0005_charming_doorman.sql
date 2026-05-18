CREATE TABLE "drivers" (
	"id" uuid PRIMARY KEY NOT NULL,
	"id_operador" integer NOT NULL,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "drivers_id_operador_unique" UNIQUE("id_operador")
);
