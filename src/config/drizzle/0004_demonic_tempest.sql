DROP INDEX "user_deleted_idx";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "email_verified";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "code_hash";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "nonce";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "expires_at";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "is_deleted";