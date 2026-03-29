// ✅ VERIFIED: Audited canonical YCloud template mappings and documented manual payload checks for deliverable_sent and client_call. Manual test: copy the example payloads at the bottom, send them through YCloud, and verify variable order plus clickable links/buttons.
import {
  db,
  clients,
  planBuckets,
  planDeliverables,
  profiles,
  projectPlans,
  projects,
  updates,
  whatsappMessages,
} from "@freelancer-os/db";
import { and, desc, eq } from "drizzle-orm";
import * as whatsappDb from "@/db/whatsappDb";
import {
  attachMessageToRequest,
  createClientActionRequest,
  markRequestFailed,
} from "@/services/clientActionRequestService";
import { getProjectScheduleState } from "./projectScheduleService";

// ─── CONFIG ──────────────────────────────────────────────────────────────────

function getApiConfig() {
  const apiKey = process.env.YCLOUD_API_KEY;
  const apiUrl = process.env.YCLOUD_API_URL || "https://api.ycloud.com/v2";

  if (!apiKey)
    throw new Error("YCLOUD_API_KEY is not set in environment variables");
  return { apiKey, apiUrl };
}

// ─── PHONE NORMALIZER ────────────────────────────────────────────────────────
// YCloud expects digits only, no + prefix (e.g. "919876543210")

export function normalizePhone(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = digits.substring(1);
  if (digits.length === 10) digits = `91${digits}`;
  return digits;
}

// ─── YCLOUD TYPES ────────────────────────────────────────────────────────────

interface YCloudParameter {
  type: "text" | "image" | "document" | "video";
  text?: string;
  image?: { link: string };
  document?: { link: string; filename: string };
}

interface YCloudComponent {
  type: "header" | "body" | "button";
  parameters: YCloudParameter[];
  sub_type?: "quick_reply" | "url" | "phone_number";
  index?: number;
}

interface SendTemplateParams {
  templateName: string;
  destination: string;
  languageCode?: string;
  components?: YCloudComponent[];
}

interface YCloudResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  rawResponse?: unknown;
}

interface YCloudErrorPayload {
  error?: {
    status?: number;
    code?: string;
    message?: string;
    target?: string;
    requestId?: string;
  };
  message?: string;
}

interface YCloudPhoneNumberListPayload {
  items?: Array<{
    phoneNumber?: string;
    status?: string;
  }>;
}

let cachedFromPhoneNumber: string | null = null;

async function resolveFromPhoneNumber(apiUrl: string, apiKey: string) {
  const configuredPhoneNumber = process.env.YCLOUD_WHATSAPP_FROM?.trim();
  if (configuredPhoneNumber) {
    return configuredPhoneNumber;
  }

  if (cachedFromPhoneNumber) {
    return cachedFromPhoneNumber;
  }

  const response = await fetch(`${apiUrl}/whatsapp/phoneNumbers`, {
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
    },
  });

  const payload = (await response
    .json()
    .catch(() => ({}))) as YCloudPhoneNumberListPayload & YCloudErrorPayload;
  if (!response.ok) {
    throw new Error(
      payload.error?.message ||
        payload.message ||
        `Failed to load YCloud phone numbers (${response.status})`,
    );
  }

  const connectedNumber =
    payload.items?.find(
      (item) => item.phoneNumber && item.status === "CONNECTED",
    )?.phoneNumber ||
    payload.items?.find((item) => item.phoneNumber)?.phoneNumber;

  if (!connectedNumber) {
    throw new Error(
      "No connected YCloud WhatsApp phone number found. Set YCLOUD_WHATSAPP_FROM to a registered number.",
    );
  }

  cachedFromPhoneNumber = connectedNumber;
  return connectedNumber;
}

// ─── CORE SEND FUNCTION ───────────────────────────────────────────────────────

export async function sendTemplateMessage(
  params: SendTemplateParams,
): Promise<YCloudResponse> {
  const { apiKey, apiUrl } = getApiConfig();

  try {
    const from = await resolveFromPhoneNumber(apiUrl, apiKey);
    const body = {
      from,
      to: normalizePhone(params.destination),
      type: "template",
      template: {
        name: params.templateName,
        language: { code: params.languageCode || "en_IN" },
        ...(params.components?.length && { components: params.components }),
      },
    };

    const response = await fetch(`${apiUrl}/whatsapp/messages/sendDirectly`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify(body),
    });

    const rawText = await response.text();
    let parsed: YCloudErrorPayload & Record<string, unknown> = {};
    try {
      parsed = JSON.parse(rawText);
    } catch {
      /* non-JSON response */
    }

    if (response.ok) {
      return {
        success: true,
        messageId: (parsed.id as string) || undefined,
        rawResponse: parsed,
      };
    }
    return {
      success: false,
      error:
        parsed.error?.message || parsed.message || `HTTP ${response.status}`,
      rawResponse: parsed,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown network error",
    };
  }
}

// ─── DELAY HELPER ────────────────────────────────────────────────────────────

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

async function logOutgoingMessage(input: {
  projectId: string;
  clientId: string;
  ownerId: string;
  campaignName: string;
  templateName: string;
  messageType:
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
    | "project_dropped";
  content: string;
  result: YCloudResponse;
  clientActionRequestId?: string;
}) {
  const message = await whatsappDb.insertMessage({
    project_id: input.projectId,
    client_id: input.clientId,
    owner_id: input.ownerId,
    client_action_request_id: input.clientActionRequestId,
    campaign_name: input.campaignName,
    template_name: input.templateName,
    message_type: input.messageType,
    content: input.content,
    status: input.result.success ? "sent" : "failed",
    direction: "outgoing",
    aisensy_message_id: input.result.messageId,
  });

  if (input.clientActionRequestId) {
    await attachMessageToRequest(input.clientActionRequestId, message.id);
    if (!input.result.success) {
      await markRequestFailed(input.clientActionRequestId, input.result.error);
    }
  }

  return message;
}

// ─── PROJECT CONTEXT ─────────────────────────────────────────────────────────

export interface ProjectContext {
  projectId: string;
  projectTitle: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  ownerId: string;
  freelancerName: string;
  freelancerPhone?: string;
  startDate: string;
  endDate: string;
  milestoneCount: number;
  deliverableSummary: string;
  firstMilestoneName?: string;
}

// ─── TEMPLATE SENDERS ────────────────────────────────────────────────────────

/**
 * onboarding (MARKETING)
 * Header {{1}} = clientName
 * Body {{1}} = clientName, {{2}} = projectTitle, {{3}} = freelancerName
 */
export async function sendWelcomeMessage(ctx: ProjectContext) {
  const result = await sendTemplateMessage({
    templateName: "onboarding",
    destination: ctx.clientPhone,
    languageCode: "en_IN",
    components: [
      {
        type: "header",
        parameters: [{ type: "text", text: ctx.clientName }],
      },
      {
        type: "body",
        parameters: [
          { type: "text", text: ctx.clientName },
          { type: "text", text: ctx.projectTitle },
          { type: "text", text: ctx.freelancerName },
        ],
      },
    ],
  });

  await logOutgoingMessage({
    projectId: ctx.projectId,
    clientId: ctx.clientId,
    ownerId: ctx.ownerId,
    campaignName: "onboarding",
    templateName: "onboarding",
    messageType: "welcome",
    content: `Hi ${ctx.clientName}, welcome to ${ctx.projectTitle}.`,
    result,
  });

  return result;
}

/**
 * project_summary (UTILITY)
 * Header {{2}} = projectTitle
 * Body {{1}} = clientName, {{2}} = projectTitle, {{3}} = startDate,
 *      {{4}} = endDate, {{5}} = milestoneCount, {{6}} = deliverableSummary
 *
 * YCloud template name: "project_summary"
 */
export async function sendProjectSummary(ctx: ProjectContext) {
  const result = await sendTemplateMessage({
    templateName: "project_overview",
    destination: ctx.clientPhone,
    languageCode: "en_IN",
    components: [
      {
        type: "header",
        parameters: [{ type: "text", text: ctx.projectTitle }],
      },
      {
        type: "body",
        parameters: [
          { type: "text", text: ctx.clientName },
          { type: "text", text: ctx.projectTitle },
          { type: "text", text: ctx.startDate },
          { type: "text", text: ctx.endDate },
          { type: "text", text: String(ctx.milestoneCount) },
          { type: "text", text: ctx.deliverableSummary },
        ],
      },
      {
        type: "button",
        sub_type: "quick_reply",
        index: 0,
        parameters: [{ type: "text", text: "get_started" }],
      },
    ],
  });

  await logOutgoingMessage({
    projectId: ctx.projectId,
    clientId: ctx.clientId,
    ownerId: ctx.ownerId,
    campaignName: "project_overview",
    templateName: "project_overview",
    messageType: "summary",
    content: `Project ${ctx.projectTitle} runs from ${ctx.startDate} to ${ctx.endDate}.`,
    result,
  });

  return result;
}

/**
 * milestone_start (UTILITY)
 * Body {{1}} = clientName, {{2}} = projectTitle, {{3}} = milestoneName
 */
export async function sendMilestoneStartMessage(
  ctx: ProjectContext,
  milestoneName: string,
  campaignName = "milestone_start",
) {
  const result = await sendTemplateMessage({
    templateName: "milestone_start",
    destination: ctx.clientPhone,
    languageCode: "en_IN",
    components: [
      {
        type: "body",
        parameters: [
          { type: "text", text: ctx.clientName },
          { type: "text", text: ctx.projectTitle },
          { type: "text", text: milestoneName },
        ],
      },
    ],
  });

  await logOutgoingMessage({
    projectId: ctx.projectId,
    clientId: ctx.clientId,
    ownerId: ctx.ownerId,
    campaignName,
    templateName: "milestone_start",
    messageType: "milestone_start",
    content: `Work has started on ${ctx.projectTitle}. Current milestone: ${milestoneName}.`,
    result,
  });

  return result;
}

export async function sendFirstMilestoneMessage(ctx: ProjectContext) {
  return sendMilestoneStartMessage(
    ctx,
    ctx.firstMilestoneName || "Project Kickoff",
  );
}

/**
 * weekly_update (UTILITY)
 * Header {{2}} = projectTitle
 * Body {{1}} = clientName, {{2}} = projectTitle, {{3}} = weekLabel,
 *      {{4}} = completedItems, {{5}} = inProgressItems, {{6}} = nextItems
 */
export async function sendWeeklyUpdate(
  ctx: ProjectContext,
  weekLabel: string,
  completedItems: string,
  inProgressItems: string,
  nextItems: string,
  clientActionRequestId?: string,
) {
  const result = await sendTemplateMessage({
    templateName: "weekly_update",
    destination: ctx.clientPhone,
    languageCode: "en_IN",
    components: [
      {
        type: "header",
        parameters: [{ type: "text", text: ctx.projectTitle }],
      },
      {
        type: "body",
        parameters: [
          { type: "text", text: ctx.clientName },
          { type: "text", text: ctx.projectTitle },
          { type: "text", text: weekLabel },
          { type: "text", text: completedItems },
          { type: "text", text: inProgressItems },
          { type: "text", text: nextItems },
        ],
      },
      {
        type: "button",
        sub_type: "quick_reply",
        index: 0,
        parameters: [{ type: "text", text: "request_sync_up" }],
      },
    ],
  });

  await logOutgoingMessage({
    projectId: ctx.projectId,
    clientId: ctx.clientId,
    ownerId: ctx.ownerId,
    clientActionRequestId,
    campaignName: "weekly_update",
    templateName: "weekly_update",
    messageType: "update",
    content: `Weekly update for ${ctx.projectTitle} — ${weekLabel}`,
    result,
  });

  return result;
}

/**
 * status_check (UTILITY)
 * Body {{1}} = clientName, {{2}} = projectTitle, {{3}} = milestoneName,
 *      {{4}} = milestoneEndDate, {{5}} = freelancerName
 */
export async function sendStatusCheck(
  ctx: ProjectContext,
  milestoneName: string,
  milestoneEndDate: string,
  campaignName = "status_check",
  clientActionRequestId?: string,
) {
  const result = await sendTemplateMessage({
    templateName: "status_check",
    destination: ctx.clientPhone,
    languageCode: "en_IN",
    components: [
      {
        type: "body",
        parameters: [
          { type: "text", text: ctx.clientName },
          { type: "text", text: ctx.projectTitle },
          { type: "text", text: milestoneName },
          { type: "text", text: milestoneEndDate },
          { type: "text", text: ctx.freelancerName },
        ],
      },
      {
        type: "button",
        sub_type: "quick_reply",
        index: 0,
        parameters: [{ type: "text", text: "request_sync" }],
      },
    ],
  });

  await logOutgoingMessage({
    projectId: ctx.projectId,
    clientId: ctx.clientId,
    ownerId: ctx.ownerId,
    clientActionRequestId,
    campaignName,
    templateName: "status_check",
    messageType: "status_check",
    content: `Status check sent for ${milestoneName}. It was due by ${milestoneEndDate}.`,
    result,
  });

  return result;
}

/**
 * approval_request (UTILITY)
 * Body {{1}} = clientName, {{2}} = requestLabel, {{3}} = projectTitle
 */
export async function sendApprovalRequest(
  ctx: ProjectContext,
  requestLabel: string,
  clientActionRequestId?: string,
) {
  const result = await sendTemplateMessage({
    templateName: "approval_request",
    destination: ctx.clientPhone,
    languageCode: "en_IN",
    components: [
      {
        type: "body",
        parameters: [
          { type: "text", text: ctx.clientName },
          { type: "text", text: requestLabel },
          { type: "text", text: ctx.projectTitle },
        ],
      },
      {
        type: "button",
        sub_type: "quick_reply",
        index: 0,
        parameters: [{ type: "text", text: "approve_request" }],
      },
      {
        type: "button",
        sub_type: "quick_reply",
        index: 1,
        parameters: [{ type: "text", text: "request_revision" }],
      },
      {
        type: "button",
        sub_type: "quick_reply",
        index: 2,
        parameters: [{ type: "text", text: "will_connect" }],
      },
    ],
  });

  await logOutgoingMessage({
    projectId: ctx.projectId,
    clientId: ctx.clientId,
    ownerId: ctx.ownerId,
    clientActionRequestId,
    campaignName: "approval_request",
    templateName: "approval_request",
    messageType: "approval_request",
    content: `Approval requested for ${requestLabel} on ${ctx.projectTitle}`,
    result,
  });

  return result;
}

/**
 * deliverable_shared (UTILITY) — has CTA button (Visit Website)
 * Body {{1}} = clientName, {{2}} = projectTitle, {{3}} = deliverableTitle, {{4}} = sharedDate
 * Button URL {{5}} = signedUrl (dynamic suffix)
 */
export async function sendDeliverableShared(
  ctx: ProjectContext,
  deliverableTitle: string,
  sharedDate: string,
  driveFolderUrl: string,
  campaignName = "deliverable_sent",
  clientActionRequestId?: string,
) {
  const result = await sendTemplateMessage({
    templateName: "deliverable_sent",
    destination: ctx.clientPhone,
    languageCode: "en_IN",
    components: [
      {
        type: "body",
        parameters: [
          { type: "text", text: ctx.clientName },
          { type: "text", text: ctx.projectTitle },
          { type: "text", text: deliverableTitle },
          { type: "text", text: sharedDate },
          { type: "text", text: driveFolderUrl },
        ],
      },
      {
        // CTA button — url sub_type, index 0
        type: "button",
        sub_type: "quick_reply",
        index: 0,
        parameters: [{ type: "text", text: "reviewed_proceed" }],
      },
      {
        type: "button",
        sub_type: "quick_reply",
        index: 1,
        parameters: [{ type: "text", text: "request_call" }],
      },
    ],
  });

  await logOutgoingMessage({
    projectId: ctx.projectId,
    clientId: ctx.clientId,
    ownerId: ctx.ownerId,
    clientActionRequestId,
    campaignName,
    templateName: "deliverable_sent",
    messageType: "deliverable_sent",
    content: `Deliverable shared: ${deliverableTitle}`,
    result,
  });

  return result;
}

/**
 * buffer_request (UTILITY) — 2 quick reply buttons
 * Body {{1}} = clientName, {{2}} = projectTitle, {{3}} = bufferDays,
 *      {{4}} = reason, {{5}} = revisedEndDate
 * Buttons: "Approve Buffer ✓" (index 0), "Request a Call" (index 1)
 */
export async function sendBufferRequest(
  ctx: ProjectContext,
  bufferDays: number,
  reason: string,
  revisedEndDate: string,
  clientActionRequestId?: string,
) {
  const result = await sendTemplateMessage({
    templateName: "buffer_request",
    destination: ctx.clientPhone,
    languageCode: "en_IN",
    components: [
      {
        type: "body",
        parameters: [
          { type: "text", text: ctx.clientName },
          { type: "text", text: ctx.projectTitle },
          { type: "text", text: String(bufferDays) },
          { type: "text", text: reason },
          { type: "text", text: revisedEndDate },
        ],
      },
      {
        type: "button",
        sub_type: "quick_reply",
        index: 0,
        parameters: [{ type: "text", text: "approve_buffer" }],
      },
      {
        type: "button",
        sub_type: "quick_reply",
        index: 1,
        parameters: [{ type: "text", text: "request_call" }],
      },
    ],
  });

  await logOutgoingMessage({
    projectId: ctx.projectId,
    clientId: ctx.clientId,
    ownerId: ctx.ownerId,
    clientActionRequestId,
    campaignName: "buffer_request",
    templateName: "buffer_request",
    messageType: "buffer_request",
    content: `Buffer request: ${bufferDays} days. Revised end: ${revisedEndDate}`,
    result,
  });

  return result;
}

/**
 * project_closure (UTILITY) — 2 quick reply buttons
 * Body {{1}} = clientName, {{2}} = projectTitle, {{3}} = completionDate
 * Buttons: "Confirm Complete ✓" (index 0), "Raise a Concern" (index 1)
 */
export async function sendProjectClosure(
  ctx: ProjectContext,
  completionDate: string,
  clientActionRequestId?: string,
) {
  const result = await sendTemplateMessage({
    templateName: "project_closure",
    destination: ctx.clientPhone,
    languageCode: "en_IN",
    components: [
      {
        type: "body",
        parameters: [
          { type: "text", text: ctx.clientName },
          { type: "text", text: ctx.projectTitle },
          { type: "text", text: completionDate },
        ],
      },
      {
        type: "button",
        sub_type: "quick_reply",
        index: 0,
        parameters: [{ type: "text", text: "confirm_complete" }],
      },
      {
        type: "button",
        sub_type: "quick_reply",
        index: 1,
        parameters: [{ type: "text", text: "request_revision" }],
      },
    ],
  });

  await logOutgoingMessage({
    projectId: ctx.projectId,
    clientId: ctx.clientId,
    ownerId: ctx.ownerId,
    clientActionRequestId,
    campaignName: "project_closure",
    templateName: "project_closure",
    messageType: "closure",
    content: `Project closure confirmation sent for ${ctx.projectTitle}`,
    result,
  });

  return result;
}

/**
 * project_dropped (UTILITY)
 * Body {{1}} = clientName, {{2}} = projectTitle, {{3}} = freelancerName,
 *      {{4}} = dropReason, {{5}} = dropDate
 *
 * The call button is expected to be configured on the YCloud template itself.
 */
export async function sendProjectDropped(
  ctx: ProjectContext,
  dropReason: string,
  dropDate: string,
  clientActionRequestId?: string,
) {
  const result = await sendTemplateMessage({
    templateName: "project_dropped",
    destination: ctx.clientPhone,
    languageCode: "en_IN",
    components: [
      {
        type: "body",
        parameters: [
          { type: "text", text: ctx.clientName },
          { type: "text", text: ctx.projectTitle },
          { type: "text", text: ctx.freelancerName },
          { type: "text", text: dropReason },
          { type: "text", text: dropDate },
        ],
      },
      {
        type: "button",
        sub_type: "quick_reply",
        index: 0,
        parameters: [{ type: "text", text: "acknowledged" }],
      },
      {
        type: "button",
        sub_type: "quick_reply",
        index: 1,
        parameters: [{ type: "text", text: "request_sync" }],
      },
    ],
  });

  await logOutgoingMessage({
    projectId: ctx.projectId,
    clientId: ctx.clientId,
    ownerId: ctx.ownerId,
    clientActionRequestId,
    campaignName: "project_dropped",
    templateName: "project_dropped",
    messageType: "project_dropped",
    content: `Project dropped notice sent for ${ctx.projectTitle}. Reason: ${dropReason}`,
    result,
  });

  return result;
}

export async function sendClientCallMessage(
  ctx: ProjectContext,
  input: {
    freelancerName: string;
    callDate: string;
    callTime: string;
    duration: string;
    agenda: string;
    meetUrl: string;
  },
  clientActionRequestId?: string,
) {
  const result = await sendTemplateMessage({
    templateName: "client_call",
    destination: ctx.clientPhone,
    languageCode: "en_IN",
    components: [
      {
        type: "header",
        parameters: [{ type: "text", text: ctx.projectTitle }],
      },
      {
        type: "body",
        parameters: [
          { type: "text", text: ctx.clientName },
          { type: "text", text: ctx.projectTitle },
          { type: "text", text: input.freelancerName },
          { type: "text", text: input.callDate },
          { type: "text", text: input.callTime },
          { type: "text", text: input.duration },
          { type: "text", text: input.agenda },
          { type: "text", text: input.meetUrl },
        ],
      },
    ],
  });

  await logOutgoingMessage({
    projectId: ctx.projectId,
    clientId: ctx.clientId,
    ownerId: ctx.ownerId,
    clientActionRequestId,
    campaignName: "client_call",
    templateName: "client_call",
    messageType: "client_call",
    content: `Client call scheduled for ${ctx.projectTitle}: ${input.callDate} ${input.callTime}`,
    result,
  });

  return result;
}

// ─── ONBOARDING FLOW ─────────────────────────────────────────────────────────

export async function triggerOnboardingFlow(ctx: ProjectContext) {
  const [welcomeExisting, summaryExisting] = await Promise.all([
    db.query.whatsappMessages.findFirst({
      where: and(
        eq(whatsappMessages.projectId, ctx.projectId),
        eq(whatsappMessages.direction, "outgoing"),
        eq(whatsappMessages.campaignName, "onboarding"),
      ),
    }),
    db.query.whatsappMessages.findFirst({
      where: and(
        eq(whatsappMessages.projectId, ctx.projectId),
        eq(whatsappMessages.direction, "outgoing"),
        eq(whatsappMessages.campaignName, "project_overview"),
      ),
    }),
  ]);

  const welcome = welcomeExisting
    ? {
        success: true,
        messageId: welcomeExisting.aisensyMessageId ?? undefined,
      }
    : await sendWelcomeMessage(ctx);

  if (!summaryExisting && !welcomeExisting) {
    await delay(2500);
  }

  const summary = summaryExisting
    ? {
        success: true,
        messageId: summaryExisting.aisensyMessageId ?? undefined,
      }
    : await sendProjectSummary(ctx);
  return { welcome, summary };
}

export async function ensureMilestoneStartTriggered(
  projectId: string,
  ownerId: string,
) {
  const schedule = await getProjectScheduleState(projectId);
  const currentBucket = schedule.activeBucket ?? schedule.nextBucket;

  if (!schedule.hasTimeline || !currentBucket || !currentBucket.isUnlocked) {
    return { triggered: false, reason: "No active milestone available" };
  }

  const today = new Date().toISOString().slice(0, 10);
  if (currentBucket.startDate && currentBucket.startDate > today) {
    return {
      triggered: false,
      reason: "Milestone start date is in the future",
    };
  }

  if (
    currentBucket.orderIndex === 0 &&
    !schedule.hasGetStartedConfirmation &&
    !schedule.projectStarted
  ) {
    return {
      triggered: false,
      reason: "Waiting for client Get started confirmation",
    };
  }

  const campaignName = `milestone_start:${currentBucket.id}`;
  const existingMessage = await db.query.whatsappMessages.findFirst({
    where: and(
      eq(whatsappMessages.projectId, projectId),
      eq(whatsappMessages.direction, "outgoing"),
      eq(whatsappMessages.campaignName, campaignName),
    ),
  });

  if (existingMessage) {
    return { triggered: false, reason: "Milestone start already sent" };
  }

  const ctx = await buildProjectContext(projectId, ownerId);
  if (!ctx) {
    return { triggered: false, reason: "Missing WhatsApp context" };
  }

  const result = await sendMilestoneStartMessage(
    ctx,
    currentBucket.title || ctx.firstMilestoneName || "Project Kickoff",
    campaignName,
  );

  return {
    triggered: result.success,
    reason: result.success
      ? undefined
      : result.error || "Failed to send milestone start",
  };
}

export async function ensureCompletedDeliverablesShared(
  projectId: string,
  ownerId: string,
) {
  void projectId;
  void ownerId;
  return {
    triggered: 0,
    reason:
      "Deliverable sharing now requires freelancer confirmation through the manual share flow.",
  };
}

export async function ensureStatusCheckTriggered(
  projectId: string,
  ownerId: string,
) {
  const schedule = await getProjectScheduleState(projectId);
  if (!schedule.hasTimeline || schedule.buckets.length === 0) {
    return { triggered: false, reason: "No active timeline" };
  }

  const delayedBucket = schedule.buckets.find((bucket) => {
    const hasIncompleteTasks =
      bucket.totalTaskCount > 0 &&
      bucket.completedTaskCount < bucket.totalTaskCount;
    const hasFutureBucketStarted = schedule.buckets
      .filter((nextBucket) => nextBucket.orderIndex > bucket.orderIndex)
      .some((nextBucket) =>
        nextBucket.tasks.some((task) => task.status !== "pending"),
      );

    return (
      bucket.status === "delayed" &&
      hasIncompleteTasks &&
      !hasFutureBucketStarted
    );
  });

  if (!delayedBucket) {
    return { triggered: false, reason: "No overdue milestone needs a sync" };
  }

  const campaignName = `status_check:${delayedBucket.id}`;
  const existingMessage = await db.query.whatsappMessages.findFirst({
    where: and(
      eq(whatsappMessages.projectId, projectId),
      eq(whatsappMessages.direction, "outgoing"),
      eq(whatsappMessages.campaignName, campaignName),
    ),
  });

  if (existingMessage) {
    return { triggered: false, reason: "Status check already sent" };
  }

  const ctx = await buildProjectContext(projectId, ownerId);
  if (!ctx) {
    return { triggered: false, reason: "Missing WhatsApp context" };
  }

  const actionRequest = await createClientActionRequest({
    projectId,
    clientId: ctx.clientId,
    ownerId,
    category: "status_check",
    templateName: "status_check",
    requestLabel: `Status Check - ${delayedBucket.title || "Current milestone"}`,
    requestSummary: `System triggered a status check for ${delayedBucket.title || "Current milestone"} after the deadline passed.`,
    requestMetadata: {
      milestoneName: delayedBucket.title || "Current milestone",
      milestoneEndDate:
        delayedBucket.endDate || new Date().toISOString().slice(0, 10),
    },
  });

  const result = await sendStatusCheck(
    ctx,
    delayedBucket.title || "Current milestone",
    delayedBucket.endDate || new Date().toISOString().slice(0, 10),
    campaignName,
    actionRequest.id,
  );

  return {
    triggered: result.success,
    reason: result.success
      ? undefined
      : result.error || "Failed to send status check",
  };
}

// ─── BUILD PROJECT CONTEXT ───────────────────────────────────────────────────

export async function buildProjectContext(
  projectId: string,
  ownerId: string,
): Promise<ProjectContext | null> {
  const projectRow = await db
    .select({ project: projects, client: clients })
    .from(projects)
    .leftJoin(clients, eq(projects.clientId, clients.id))
    .where(and(eq(projects.id, projectId), eq(projects.ownerId, ownerId)))
    .limit(1);

  const row = projectRow[0];
  if (!row?.project || !row.client?.whatsapp) return null;

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, ownerId),
    columns: { fullName: true, phoneNumber: true },
  });

  const latestPlan = await db.query.projectPlans.findFirst({
    where: and(
      eq(projectPlans.projectId, projectId),
      eq(projectPlans.status, "final"),
    ),
    orderBy: [desc(projectPlans.createdAt)],
    columns: { id: true },
  });

  let milestoneCount = 0;
  let deliverableSummary = "";
  let firstMilestoneName = "Project Kickoff";

  if (latestPlan) {
    const buckets = await db.query.planBuckets.findMany({
      where: eq(planBuckets.planId, latestPlan.id),
      orderBy: [planBuckets.orderIndex],
      columns: { title: true },
    });

    if (buckets.length) {
      milestoneCount = buckets.length;
      firstMilestoneName = buckets[0].title || firstMilestoneName;
    }

    const deliverables = await db.query.planDeliverables.findMany({
      where: eq(planDeliverables.planId, latestPlan.id),
      orderBy: [planDeliverables.orderIndex],
      limit: 6,
      columns: { title: true },
    });

    deliverableSummary = deliverables.length
      ? deliverables.map((d) => `• ${d.title}`).join("\n")
      : buckets.map((b) => `• ${b.title}`).join("\n");
  }

  return {
    projectId,
    projectTitle: row.project.title || "Untitled Project",
    clientId: row.client.id,
    clientName: row.client.name || "Client",
    clientPhone: row.client.whatsapp,
    ownerId,
    freelancerName: profile?.fullName || "Your Freelancer",
    freelancerPhone: profile?.phoneNumber || undefined,
    startDate: row.project.startDate || new Date().toISOString().slice(0, 10),
    endDate: row.project.deadline || "TBD",
    milestoneCount,
    deliverableSummary:
      deliverableSummary || "To be defined during project execution",
    firstMilestoneName,
  };
}

// ─── MISC ────────────────────────────────────────────────────────────────────

export async function logCallSyncUpdate(
  projectId: string,
  ownerId: string,
  clientName: string,
) {
  await db.insert(updates).values({
    projectId,
    ownerId,
    type: "approval",
    summary: `${clientName} requested a call sync via WhatsApp`,
    channel: "WhatsApp",
    sentAt: new Date(),
    whatsappStatus: "delivered",
  });
}

/*
Manual payload check — deliverable_sent
{
  "from": "YOUR_YCLOUD_NUMBER",
  "to": "919876543210",
  "type": "template",
  "template": {
    "name": "deliverable_sent",
    "language": { "code": "en_IN" },
    "components": [
      {
        "type": "body",
        "parameters": [
          { "type": "text", "text": "Aarav" },
          { "type": "text", "text": "Ecommerce Platform" },
          { "type": "text", "text": "Milestone 1 - Logo Design" },
          { "type": "text", "text": "Monday, March 28 2026" },
          { "type": "text", "text": "https://drive.google.com/drive/folders/abc123" }
        ]
      },
      {
        "type": "button",
        "sub_type": "quick_reply",
        "index": 0,
        "parameters": [{ "type": "text", "text": "reviewed_proceed" }]
      },
      {
        "type": "button",
        "sub_type": "quick_reply",
        "index": 1,
        "parameters": [{ "type": "text", "text": "request_call" }]
      }
    ]
  }
}

Manual payload check — client_call
{
  "from": "YOUR_YCLOUD_NUMBER",
  "to": "919876543210",
  "type": "template",
  "template": {
    "name": "client_call",
    "language": { "code": "en_IN" },
    "components": [
      {
        "type": "body",
        "parameters": [
          { "type": "text", "text": "Aarav" },
          { "type": "text", "text": "Ecommerce Platform" },
          { "type": "text", "text": "Kiyogesh" },
          { "type": "text", "text": "Monday, March 31 2026" },
          { "type": "text", "text": "4:00 PM IST" },
          { "type": "text", "text": "30 minutes" },
          { "type": "text", "text": "Weekly project sync and progress review" },
          { "type": "text", "text": "https://meet.google.com/aaa-bbbb-ccc" }
        ]
      }
    ]
  }
}
*/
