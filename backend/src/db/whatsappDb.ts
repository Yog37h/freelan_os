import { db, updates, whatsappMessages } from "@freelancer-os/db";
import { and, desc, eq } from "drizzle-orm";

export interface WhatsAppMessageRow {
  id?: string;
  project_id: string;
  client_id: string;
  owner_id: string;
  client_action_request_id?: string;
  campaign_name: string;
  template_name: string;
  message_type:
    | "welcome"
    | "summary"
    | "milestone_start"
    | "update"
    | "reminder"
    | "status_check"
    | "approval_request"
    | "deliverable"
    | "deliverable_sent"
    | "buffer_request"
    | "closure"
    | "client_call"
    | "project_dropped"
    | "text_reply"
    | "button_response";
  content: string;
  status: "pending" | "sent" | "delivered" | "read" | "failed";
  direction: "outgoing" | "incoming";
  aisensy_message_id?: string;
  created_at?: string;
  updated_at?: string;
}

function toInsert(
  row: Partial<WhatsAppMessageRow>,
): typeof whatsappMessages.$inferInsert {
  return {
    projectId: row.project_id ?? null,
    clientId: row.client_id ?? null,
    ownerId: row.owner_id!,
    clientActionRequestId: row.client_action_request_id ?? null,
    campaignName: row.campaign_name ?? null,
    templateName: row.template_name ?? null,
    messageType: row.message_type ?? null,
    content: row.content ?? null,
    status: row.status ?? null,
    direction: row.direction ?? null,
    aisensyMessageId: row.aisensy_message_id ?? null,
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
  };
}

export async function insertMessage(row: WhatsAppMessageRow) {
  const [created] = await db
    .insert(whatsappMessages)
    .values(toInsert(row))
    .returning();
  return created;
}

export async function getMessagesByProject(projectId: string) {
  return db.query.whatsappMessages.findMany({
    where: eq(whatsappMessages.projectId, projectId),
    orderBy: [desc(whatsappMessages.createdAt)],
  });
}

export async function getMessagesByOwner(ownerId: string) {
  return db.query.whatsappMessages.findMany({
    where: eq(whatsappMessages.ownerId, ownerId),
    orderBy: [desc(whatsappMessages.createdAt)],
  });
}

export async function updateMessageStatus(
  aisensyMessageId: string,
  status: string,
) {
  const [updated] = await db
    .update(whatsappMessages)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(eq(whatsappMessages.aisensyMessageId, aisensyMessageId))
    .returning();

  return updated ?? null;
}

export async function updateMessageById(
  messageId: string,
  messageUpdates: Partial<WhatsAppMessageRow>,
) {
  const updatePayload: Partial<typeof whatsappMessages.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (messageUpdates.project_id !== undefined) {
    updatePayload.projectId = messageUpdates.project_id;
  }
  if (messageUpdates.client_id !== undefined) {
    updatePayload.clientId = messageUpdates.client_id;
  }
  if (messageUpdates.owner_id !== undefined) {
    updatePayload.ownerId = messageUpdates.owner_id;
  }
  if (messageUpdates.client_action_request_id !== undefined) {
    updatePayload.clientActionRequestId =
      messageUpdates.client_action_request_id;
  }
  if (messageUpdates.campaign_name !== undefined) {
    updatePayload.campaignName = messageUpdates.campaign_name;
  }
  if (messageUpdates.template_name !== undefined) {
    updatePayload.templateName = messageUpdates.template_name;
  }
  if (messageUpdates.message_type !== undefined) {
    updatePayload.messageType = messageUpdates.message_type;
  }
  if (messageUpdates.content !== undefined) {
    updatePayload.content = messageUpdates.content;
  }
  if (messageUpdates.status !== undefined) {
    updatePayload.status = messageUpdates.status;
  }
  if (messageUpdates.direction !== undefined) {
    updatePayload.direction = messageUpdates.direction;
  }
  if (messageUpdates.aisensy_message_id !== undefined) {
    updatePayload.aisensyMessageId = messageUpdates.aisensy_message_id;
  }

  const [updated] = await db
    .update(whatsappMessages)
    .set(updatePayload)
    .where(eq(whatsappMessages.id, messageId))
    .returning();

  return updated ?? null;
}

export async function insertIncomingMessage(row: Partial<WhatsAppMessageRow>) {
  const [created] = await db
    .insert(whatsappMessages)
    .values(
      toInsert({
        ...row,
        direction: "incoming",
        status: "delivered",
      }),
    )
    .returning();

  return created;
}

export async function updateWhatsAppStatusOnUpdate(
  updateId: string,
  whatsappStatus: string,
) {
  const [updated] = await db
    .update(updates)
    .set({ whatsappStatus })
    .where(eq(updates.id, updateId))
    .returning();

  return updated ?? null;
}

export async function findProjectByIncomingPhone(phone: string) {
  const rows = await db
    .select({
      message: whatsappMessages,
    })
    .from(whatsappMessages)
    .where(
      and(
        eq(whatsappMessages.direction, "outgoing"),
        eq(whatsappMessages.status, "sent"),
      ),
    )
    .orderBy(desc(whatsappMessages.createdAt))
    .limit(50);

  return (
    rows.find((row) => row.message.content?.includes(phone))?.message ?? null
  );
}

export async function getMessageByProviderMessageId(providerMessageId: string) {
  return db.query.whatsappMessages.findFirst({
    where: eq(whatsappMessages.aisensyMessageId, providerMessageId),
    orderBy: [desc(whatsappMessages.createdAt)],
  });
}
