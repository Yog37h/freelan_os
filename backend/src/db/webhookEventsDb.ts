import { db, whatsappWebhookEvents } from "@freelancer-os/db";
import { eq } from "drizzle-orm";

export async function reserveWebhookEvent(
  eventId: string,
  eventType: string,
  payload: Record<string, unknown>,
) {
  const [created] = await db
    .insert(whatsappWebhookEvents)
    .values({
      eventId,
      eventType,
      payload,
    })
    .onConflictDoNothing({
      target: whatsappWebhookEvents.eventId,
    })
    .returning();

  return created ?? null;
}

export async function markWebhookEventProcessed(eventId: string) {
  const [updated] = await db
    .update(whatsappWebhookEvents)
    .set({
      processedAt: new Date(),
    })
    .where(eq(whatsappWebhookEvents.eventId, eventId))
    .returning();

  return updated ?? null;
}

export async function getWebhookEvent(eventId: string) {
  return db.query.whatsappWebhookEvents.findFirst({
    where: eq(whatsappWebhookEvents.eventId, eventId),
  });
}
