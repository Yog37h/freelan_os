import { z } from "zod";

export const sendWhatsAppSchema = z.object({
  projectId: z.string().uuid(),
  messageType: z.enum([
    "welcome",
    "summary",
    "milestone_start",
    "update",
    "reminder",
    "status_check",
    "approval_request",
    "deliverable",
    "buffer_request",
    "closure",
    "project_dropped",
  ]),
});

export type SendWhatsAppInput = z.infer<typeof sendWhatsAppSchema>;

/**
 * Webhook payload schema for YCloud events.
 * Intentionally loose (passthrough) because YCloud may add extra fields.
 */
export const ycloudWebhookSchema = z
  .object({
    type: z.string(),
    object: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export type YCloudWebhookPayload = z.infer<typeof ycloudWebhookSchema>;
