CREATE TABLE "google_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"google_email" text NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text,
	"scopes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"expires_at" timestamp with time zone,
	"root_folder_external_id" text,
	"root_folder_web_view_link" text,
	"last_validated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_call_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_action_request_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"owner_id" uuid NOT NULL,
	"client_id" uuid,
	"timezone" text DEFAULT 'Asia/Calcutta' NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"duration_minutes" integer DEFAULT 30 NOT NULL,
	"agenda" text,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"google_calendar_id" text,
	"google_event_id" text,
	"meet_url" text,
	"invited_client_email" text,
	"last_sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "project_files" ADD COLUMN "provider" text DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE "project_files" ADD COLUMN "item_type" text DEFAULT 'file' NOT NULL;--> statement-breakpoint
ALTER TABLE "project_files" ADD COLUMN "bucket_id" uuid;--> statement-breakpoint
ALTER TABLE "project_files" ADD COLUMN "deliverable_id" uuid;--> statement-breakpoint
ALTER TABLE "project_files" ADD COLUMN "external_file_id" text;--> statement-breakpoint
ALTER TABLE "project_files" ADD COLUMN "parent_external_file_id" text;--> statement-breakpoint
ALTER TABLE "project_files" ADD COLUMN "web_view_link" text;--> statement-breakpoint
ALTER TABLE "project_files" ADD COLUMN "shareable" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "project_files" ADD COLUMN "sync_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "project_files" ADD COLUMN "synced_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "google_connections" ADD CONSTRAINT "google_connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_call_schedules" ADD CONSTRAINT "client_call_schedules_client_action_request_id_client_action_requests_id_fk" FOREIGN KEY ("client_action_request_id") REFERENCES "public"."client_action_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_call_schedules" ADD CONSTRAINT "client_call_schedules_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_call_schedules" ADD CONSTRAINT "client_call_schedules_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_call_schedules" ADD CONSTRAINT "client_call_schedules_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_google_connections_user_id" ON "google_connections" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_client_call_schedules_request_id" ON "client_call_schedules" USING btree ("client_action_request_id");
