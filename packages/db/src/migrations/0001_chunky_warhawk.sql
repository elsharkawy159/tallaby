ALTER TABLE "products" ADD COLUMN "images" jsonb;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "hashed_password";