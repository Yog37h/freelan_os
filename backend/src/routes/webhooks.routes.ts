import crypto from "node:crypto";
import { Hono } from "hono";
import { db, clients, projects } from "@freelancer-os/db";
import { desc, eq } from "drizzle-orm";
import * as webhookEventsDb from "@/db/webhookEventsDb";
import * as projectsDb from "@/db/projectsDb";
import * as whatsappDb from "@/db/whatsappDb";
import {
  attachMessageToRequest,
  createClientActionRequest,
  getRequestFromProviderMessageId,
  resolveClientActionRequest,
  resolveRequestFromProviderMessageContext,
  syncRequestDeliveryStatus,
  type ClientActionCategory,
} from "@/services/clientActionRequestService";
import {
  ensureMilestoneStartTriggered,
  logCallSyncUpdate,
  normalizePhone,
} from "@/services/whatsappService";
import {
  applyRequestResolution,
  resolveLatestPendingRequest,
} from "@/services/projectUpdatesService";

const webhooksRoutes = new Hono();

type LinkedRequest = {
  id: string;
  category: string;
  requestMetadata: Record<string, unknown> | null;
} | null;

webhooksRoutes.post("/ycloud", async (c) => {
  const rawBody = await c.req.text();
  const signature = c.req.header("YCloud-Signature");
  const webhookSecret = process.env.YCLOUD_WEBHOOK_SECRET;

  if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
    return c.json({ received: false, error: "Invalid signature" }, 401);
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return c.json({ received: false, error: "Invalid payload" }, 400);
  }

  const eventId =
    typeof body.id === "string" && body.id.trim().length > 0 ? body.id : null;
  const eventType = typeof body.type === "string" ? body.type : "";

  if (!eventId || !eventType) {
    return c.json({ received: true }, 200);
  }

  const reserved = await webhookEventsDb.reserveWebhookEvent(
    eventId,
    eventType,
    body,
  );
  if (!reserved) {
    return c.json({ received: true, duplicate: true }, 200);
  }

  try {
    switch (eventType) {
      case "whatsapp.message.updated":
        await handleMessageUpdated(
          (body.whatsappMessage as Record<string, unknown> | undefined) ?? {},
        );
        break;
      case "whatsapp.inbound.message":
        await handleInboundMessage(
          (body.whatsappInboundMessage as Record<string, unknown> | undefined) ??
            {},
        );
        break;
      default:
        break;
    }

    await webhookEventsDb.markWebhookEventProcessed(eventId);
    return c.json({ received: true }, 200);
  } catch (error) {
    return c.json(
      {
        received: false,
        error:
          error instanceof Error ? error.message : "Webhook processing failed",
      },
      500,
    );
  }
});

webhooksRoutes.post("/aisensy", (c) => c.json({ received: true }, 200));
webhooksRoutes.get("/aisensy", (c) =>
  c.json({ status: "Legacy - use /ycloud" }, 200),
);

async function handleMessageUpdated(message: Record<string, unknown>) {
  const providerMessageId = getFirstString(message.id, message.messageId);
  const rawStatus = getFirstString(message.status);
  const status = mapYCloudStatus(rawStatus);

  if (!providerMessageId || !status) {
    return;
  }

  await whatsappDb.updateMessageStatus(providerMessageId, status);
  await syncRequestDeliveryStatus(providerMessageId, status);
}

async function handleInboundMessage(message: Record<string, unknown>) {
  const fromPhone = getFirstString(
    message.from,
    message.senderPhone,
    (message.customer as Record<string, unknown> | undefined)?.phone,
  );
  if (!fromPhone) {
    return;
  }

  const client = await findClientByPhone(fromPhone);
  if (!client) {
    return;
  }

  const contextProviderMessageId = extractContextMessageId(message);
  const linkedRequest = await getRequestFromProviderMessageId(
    contextProviderMessageId,
  );

  const project =
    (linkedRequest &&
      (await db.query.projects.findFirst({
        where: eq(projects.id, linkedRequest.projectId),
      }))) ||
    (await db.query.projects.findFirst({
      where: eq(projects.clientId, client.id),
      orderBy: [desc(projects.createdAt)],
    }));

  if (!project) {
    return;
  }

  const messageType = getFirstString(message.type) || "text";
  const buttonPayload = extractButtonPayload(message);
  const textBody = extractTextBody(message);
  const inboundContent =
    buttonPayload ||
    textBody ||
    `Inbound ${messageType} message from ${client.name || "client"}`;

  const incomingMessage = await whatsappDb.insertIncomingMessage({
    project_id: project.id,
    client_id: client.id,
    owner_id: project.ownerId,
    client_action_request_id: linkedRequest?.id,
    campaign_name: "client_inbound",
    template_name: messageType,
    message_type:
      buttonPayload || messageType === "button" || messageType === "interactive"
        ? "button_response"
        : "text_reply",
    content: inboundContent,
    aisensy_message_id: getFirstString(message.id),
  });

  if (buttonPayload) {
    await handleButtonPayload({
      payload: buttonPayload,
      project,
      client,
      linkedRequest,
      contextProviderMessageId,
      incomingMessageId: incomingMessage.id,
    });
  }
}

async function handleButtonPayload(input: {
  payload: string;
  project: {
    id: string;
    ownerId: string;
    clientId: string | null;
    status: string | null;
  };
  client: { id: string; name: string | null };
  linkedRequest: LinkedRequest;
  contextProviderMessageId?: string;
  incomingMessageId: string;
}) {
  const normalizedPayload = normalizePayload(input.payload);
  let request =
    input.linkedRequest ??
    (await resolveRequestFromProviderMessageContext(
      input.contextProviderMessageId,
      {
        projectId: input.project.id,
        categories: categoriesForPayload(normalizedPayload),
      },
    ));

  if (!request) {
    request = await createFallbackRequestForPayload({
      payload: normalizedPayload,
      projectId: input.project.id,
      ownerId: input.project.ownerId,
      clientId: input.client.id,
      clientName: input.client.name || "Client",
    });
  }

  if (request) {
    await attachMessageToRequest(request.id, input.incomingMessageId);
  }

  switch (normalizedPayload) {
    case "get_started":
      await ensureMilestoneStartTriggered(
        input.project.id,
        input.project.ownerId,
      ).catch(() => undefined);
      break;

    case "approve_buffer":
      if (request?.category === "buffer") {
        await applyRequestResolution(
          request.id,
          input.project.ownerId,
          "buffer",
          request.requestMetadata || {},
          {
            status: "approved",
            responseLabel: "Approved",
            responseMessage: "Client approved the buffer request",
          },
        );
      } else {
        await resolveLatestPendingRequest(
          input.project.id,
          input.project.ownerId,
          "buffer",
          {
            status: "approved",
            responseLabel: "Approved",
            responseMessage: "Client approved the buffer request",
          },
        ).catch(() => undefined);
      }
      break;

    case "request_call":
    case "request_sync":
    case "request_sync_up":
    case "will_connect":
      await logCallSyncUpdate(
        input.project.id,
        input.project.ownerId,
        input.client.name || "Client",
      );

      if (request?.category === "buffer") {
        await applyRequestResolution(
          request.id,
          input.project.ownerId,
          "buffer",
          request.requestMetadata || {},
          {
            status: "will_connect",
            responseLabel: "Will connect",
            responseMessage: "Client requested a call regarding the request",
          },
        );
      } else if (request?.category === "approval") {
        await applyRequestResolution(
          request.id,
          input.project.ownerId,
          "scope",
          request.requestMetadata || {},
          {
            status: "will_connect",
            responseLabel: "Will connect",
            responseMessage: "Client requested a call regarding the request",
          },
        );
      } else if (request) {
        await resolveClientActionRequest(request.id, {
          status: "will_connect",
          responseLabel: "Schedule requested",
          responseMessage: "Client requested a call or sync",
        });
      } else {
        await resolveLatestPendingRequest(
          input.project.id,
          input.project.ownerId,
          "scope",
          {
            status: "will_connect",
            responseLabel: "Will connect",
            responseMessage: "Client requested a call regarding the request",
          },
        ).catch(() => undefined);
      }
      break;

    case "approve_request":
    case "approved":
      if (request?.category === "approval") {
        await applyRequestResolution(
          request.id,
          input.project.ownerId,
          "scope",
          request.requestMetadata || {},
          {
            status: "approved",
            responseLabel: "Approved",
            responseMessage: "Client approved the scope request",
          },
        );
      } else {
        await resolveLatestPendingRequest(
          input.project.id,
          input.project.ownerId,
          "scope",
          {
            status: "approved",
            responseLabel: "Approved",
            responseMessage: "Client approved the scope request",
          },
        ).catch(() => undefined);
      }
      break;

    case "request_revision":
    case "revision":
      if (request?.category === "approval") {
        await applyRequestResolution(
          request.id,
          input.project.ownerId,
          "scope",
          request.requestMetadata || {},
          {
            status: "revision",
            responseLabel: "Revision requested",
            responseMessage: "Client requested changes to the scope request",
          },
        );
      } else if (request) {
        await resolveClientActionRequest(request.id, {
          status: "revision",
          responseLabel: "Revision requested",
          responseMessage: "Client requested a revision",
        });
      } else {
        await resolveLatestPendingRequest(
          input.project.id,
          input.project.ownerId,
          "scope",
          {
            status: "revision",
            responseLabel: "Revision requested",
            responseMessage: "Client requested changes to the scope request",
          },
        ).catch(() => undefined);
      }
      break;

    case "reviewed_proceed":
      if (request?.category === "deliverable_review") {
        await resolveClientActionRequest(request.id, {
          status: "completed",
          responseLabel: "Reviewed and approved",
          responseMessage:
            "Client reviewed the deliverable and approved proceeding",
        });
      }
      break;

    case "confirm_complete":
      if (request?.category === "closure") {
        await resolveClientActionRequest(request.id, {
          status: "completed",
          responseLabel: "Confirmed complete",
          responseMessage: "Client confirmed project completion",
        });
      }
      await projectsDb.updateProject(input.project.ownerId, input.project.id, {
        status: "Completed",
      });
      break;

    case "acknowledged":
      if (request?.category === "project_drop") {
        await resolveClientActionRequest(request.id, {
          status: "acknowledged",
          responseLabel: "Acknowledged",
          responseMessage: "Client acknowledged the project drop notice",
        });
      }
      await projectsDb.updateProject(input.project.ownerId, input.project.id, {
        status: "Dropped",
        dropAcknowledgedAt: new Date(),
      });
      break;

    default:
      break;
  }
}

function categoriesForPayload(payload: string): readonly ClientActionCategory[] {
  switch (payload) {
    case "approve_buffer":
      return ["buffer"];
    case "request_call":
      return [
        "buffer",
        "approval",
        "status_check",
        "project_drop",
        "sync",
        "revision",
        "deliverable_review",
        "closure",
      ];
    case "approve_request":
    case "approved":
      return ["approval"];
    case "request_revision":
    case "revision":
      return ["approval", "closure", "revision", "deliverable_review"];
    case "request_sync":
    case "request_sync_up":
    case "will_connect":
      return [
        "approval",
        "status_check",
        "project_drop",
        "sync",
        "deliverable_review",
        "closure",
        "revision",
      ];
    case "confirm_complete":
      return ["closure"];
    case "acknowledged":
      return ["project_drop"];
    case "reviewed_proceed":
      return ["deliverable_review"];
    default:
      return [];
  }
}

async function createFallbackRequestForPayload(input: {
  payload: string;
  projectId: string;
  ownerId: string;
  clientId: string;
  clientName: string;
}) {
  switch (input.payload) {
    case "request_call":
    case "request_sync":
    case "request_sync_up":
    case "will_connect":
      return createClientActionRequest({
        projectId: input.projectId,
        clientId: input.clientId,
        ownerId: input.ownerId,
        category: "sync",
        templateName: "client_call",
        requestLabel: "Client requested a sync",
        requestSummary: `${input.clientName} requested a call or sync through WhatsApp.`,
      });
    case "request_revision":
    case "revision":
      return createClientActionRequest({
        projectId: input.projectId,
        clientId: input.clientId,
        ownerId: input.ownerId,
        category: "revision",
        templateName: "project_closure",
        requestLabel: "Client requested a revision",
        requestSummary: `${input.clientName} requested a revision through WhatsApp.`,
      });
    case "reviewed_proceed":
      return createClientActionRequest({
        projectId: input.projectId,
        clientId: input.clientId,
        ownerId: input.ownerId,
        category: "deliverable_review",
        templateName: "deliverable_sent",
        requestLabel: "Deliverable review",
        requestSummary: `${input.clientName} responded to a deliverable review request.`,
      });
    case "acknowledged":
      return createClientActionRequest({
        projectId: input.projectId,
        clientId: input.clientId,
        ownerId: input.ownerId,
        category: "project_drop",
        templateName: "project_dropped",
        requestLabel: "Project drop acknowledgement",
        requestSummary: `${input.clientName} acknowledged a project drop notice.`,
      });
    case "confirm_complete":
      return createClientActionRequest({
        projectId: input.projectId,
        clientId: input.clientId,
        ownerId: input.ownerId,
        category: "closure",
        templateName: "project_closure",
        requestLabel: "Project closure confirmation",
        requestSummary: `${input.clientName} responded to project closure confirmation.`,
      });
    default:
      return null;
  }
}

async function findClientByPhone(phone: string) {
  const normalized = normalizePhone(phone);
  const candidates = [
    normalized,
    `+${normalized}`,
    phone.replace(/\D/g, ""),
    phone,
  ];

  for (const candidate of candidates) {
    const client = await db.query.clients.findFirst({
      where: eq(clients.whatsapp, candidate),
    });

    if (client) {
      return client;
    }
  }

  return null;
}

function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | undefined,
  secret: string | undefined,
) {
  if (!secret || !signatureHeader) {
    return false;
  }

  const parts = signatureHeader.split(",");
  const timestampPart = parts.find((part) => part.startsWith("t="));
  const signaturePart = parts.find((part) => part.startsWith("s="));

  if (!timestampPart || !signaturePart) {
    return false;
  }

  const timestamp = timestampPart.slice(2);
  const signature = signaturePart.slice(2);
  const signedPayload = `${timestamp}.${rawBody}`;
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(signedPayload)
    .digest("hex");

  if (signature.length !== expectedSignature.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature),
  );
}

function extractContextMessageId(message: Record<string, unknown>) {
  const context = (message.context as Record<string, unknown> | undefined) ?? {};
  return getFirstString(
    context.id,
    context.messageId,
    message.replyToMessageId,
    message.contextMessageId,
  );
}

function extractButtonPayload(message: Record<string, unknown>) {
  const button = (message.button as Record<string, unknown> | undefined) ?? {};
  const interactive =
    (message.interactive as Record<string, unknown> | undefined) ?? {};
  const buttonReply =
    (interactive.button_reply as Record<string, unknown> | undefined) ?? {};

  return (
    getFirstString(
      button.payload,
      button.text,
      buttonReply.id,
      buttonReply.title,
      message.buttonPayload,
      message.buttonText,
    ) || ""
  );
}

function extractTextBody(message: Record<string, unknown>) {
  const text = (message.text as Record<string, unknown> | undefined) ?? {};
  return getFirstString(text.body, message.text, message.body);
}

function getFirstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return "";
}

function normalizePayload(payload: string) {
  return payload.trim().toLowerCase().replace(/\s+/g, "_");
}

function mapYCloudStatus(raw: string): string | null {
  const map: Record<string, string> = {
    sent: "sent",
    delivered: "delivered",
    read: "read",
    failed: "failed",
    undelivered: "failed",
    queued: "pending",
    pending: "pending",
  };
  return map[String(raw).toLowerCase()] || null;
}

export default webhooksRoutes;
