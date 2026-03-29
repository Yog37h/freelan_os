CREATE TABLE "client_action_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"client_id" uuid,
	"owner_id" uuid NOT NULL,
	"update_id" uuid,
	"category" text NOT NULL,
	"template_name" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"request_label" text,
	"request_summary" text,
	"response_label" text,
	"response_message" text,
	"request_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"responded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whatsapp_webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" text NOT NULL,
	"event_type" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	CONSTRAINT "whatsapp_webhook_events_event_id_unique" UNIQUE("event_id")
);
--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "drop_acknowledged_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "whatsapp_messages" ADD COLUMN "client_action_request_id" uuid;--> statement-breakpoint
ALTER TABLE "client_action_requests" ADD CONSTRAINT "client_action_requests_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_action_requests" ADD CONSTRAINT "client_action_requests_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_action_requests" ADD CONSTRAINT "client_action_requests_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_action_requests" ADD CONSTRAINT "client_action_requests_update_id_updates_id_fk" FOREIGN KEY ("update_id") REFERENCES "public"."updates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_client_action_request_id_client_action_requests_id_fk" FOREIGN KEY ("client_action_request_id") REFERENCES "public"."client_action_requests"("id") ON DELETE set null ON UPDATE no action;