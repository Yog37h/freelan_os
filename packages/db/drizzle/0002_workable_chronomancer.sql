ALTER TABLE "projects" ADD COLUMN "drop_reason" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "dropped_at" timestamp with time zone;