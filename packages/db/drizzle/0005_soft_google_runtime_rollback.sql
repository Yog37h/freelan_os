DELETE FROM "google_connections";

UPDATE "project_files"
SET
  "provider" = 'manual',
  "shareable" = true,
  "external_file_id" = NULL,
  "parent_external_file_id" = NULL,
  "synced_at" = NULL
WHERE "deliverable_id" IS NOT NULL;

UPDATE "client_call_schedules"
SET
  "google_calendar_id" = NULL,
  "google_event_id" = NULL,
  "meet_url" = NULL,
  "updated_at" = NOW();
