CREATE TYPE "public"."support_conversation_status" AS ENUM('open', 'closed');--> statement-breakpoint
CREATE TYPE "public"."support_message_sender_type" AS ENUM('passenger', 'admin');--> statement-breakpoint
CREATE TABLE "support_conversations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"passenger_id" uuid NOT NULL,
	"assigned_admin_id" uuid,
	"status" "support_conversation_status" DEFAULT 'open' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"closed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "support_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"sender_type" "support_message_sender_type" NOT NULL,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_conversation_id_support_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."support_conversations"("id") ON DELETE cascade ON UPDATE no action;