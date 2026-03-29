// ✅ VERIFIED: Manual WhatsApp sends keep the canonical templates but now use the static placeholder deliverable link instead of Drive URLs. Manual test: trigger the manual deliverable send endpoint and confirm the placeholder link is sent.
import { Hono } from "hono";
import { requireUser } from "@/auth/requireUser";
import { fail, ok, unauthorized, validationError } from "@/http/response";
import { sendWhatsAppSchema } from "@/validators/whatsapp";
import { assertProjectOwned } from "@/services/guards";
import { createClientActionRequest } from "@/services/clientActionRequestService";
import {
  buildProjectContext,
  sendApprovalRequest,
  sendDeliverableShared,
  sendFirstMilestoneMessage,
  sendProjectClosure,
  sendProjectDropped,
  sendProjectSummary,
  sendStatusCheck,
  sendWelcomeMessage,
} from "@/services/whatsappService";
import * as whatsappDb from "@/db/whatsappDb";
import { getDeliverableSharePlaceholderUrl } from "@/lib/placeholderLinks";

const whatsappRoutes = new Hono();

whatsappRoutes.post("/send", async (c) => {
  const user = requireUser(c);
  if (!user) return unauthorized(c);
  const body = await c.req.json().catch(() => null);
  const parsed = sendWhatsAppSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(c, parsed.error.format());
  }

  const isOwned = await assertProjectOwned(user.sub, parsed.data.projectId);
  if (!isOwned) {
    return fail(c, "Project not found", 404);
  }

  const ctx = await buildProjectContext(parsed.data.projectId, user.sub);
  if (!ctx) {
    return fail(
      c,
      "Could not load project context. Ensure client has a WhatsApp number.",
      400,
    );
  }

  let result;
  switch (parsed.data.messageType) {
    case "welcome":
      result = await sendWelcomeMessage(ctx);
      break;
    case "summary":
      result = await sendProjectSummary(ctx);
      break;
    case "milestone_start":
    case "update":
    case "reminder":
      result = await sendFirstMilestoneMessage(ctx);
      break;
    case "status_check":
      {
        const actionRequest = await createClientActionRequest({
          projectId: ctx.projectId,
          clientId: ctx.clientId,
          ownerId: user.sub,
          category: "status_check",
          templateName: "status_check",
          requestLabel: `Status Check - ${ctx.firstMilestoneName || "Current milestone"}`,
          requestSummary: "Manual status check sent from the app",
        });
      result = await sendStatusCheck(
        ctx,
        ctx.firstMilestoneName || "Current milestone",
        ctx.endDate,
        "status_check",
        actionRequest.id,
      );
      }
      break;
    case "approval_request":
      {
        const actionRequest = await createClientActionRequest({
          projectId: ctx.projectId,
          clientId: ctx.clientId,
          ownerId: user.sub,
          category: "approval",
          templateName: "approval_request",
          requestLabel: ctx.firstMilestoneName || "Current phase approval",
          requestSummary: "Manual approval request sent from the app",
        });
        result = await sendApprovalRequest(
          ctx,
          ctx.firstMilestoneName || "Current phase approval",
          actionRequest.id,
        );
      }
      break;
    case "deliverable":
      result = await sendDeliverableShared(
        ctx,
        `${ctx.firstMilestoneName || "Current phase"} Deliverable`,
        new Date().toISOString().slice(0, 10),
        getDeliverableSharePlaceholderUrl(),
      );
      break;
    case "closure":
      {
        const actionRequest = await createClientActionRequest({
          projectId: ctx.projectId,
          clientId: ctx.clientId,
          ownerId: user.sub,
          category: "closure",
          templateName: "project_closure",
          requestLabel: "Project Closure Confirmation",
          requestSummary: "Project closure confirmation sent from the app",
        });
        result = await sendProjectClosure(
          ctx,
          new Date().toISOString().slice(0, 10),
          actionRequest.id,
        );
      }
      break;
    case "project_dropped":
      {
        const actionRequest = await createClientActionRequest({
          projectId: ctx.projectId,
          clientId: ctx.clientId,
          ownerId: user.sub,
          category: "project_drop",
          templateName: "project_dropped",
          requestLabel: "Project Drop Acknowledgement",
          requestSummary: "Freelancer ended the project before completion.",
        });
        result = await sendProjectDropped(
          ctx,
          "Freelancer ended the project before completion.",
          new Date().toISOString().slice(0, 10),
          actionRequest.id,
        );
      }
      break;
    default:
      return fail(c, "Unsupported message type", 400);
  }

  return ok(c, {
    sent: result.success,
    messageId: result.messageId,
    error: result.error,
  });
});

whatsappRoutes.get("/send", async (c) => {
  const user = requireUser(c);
  if (!user) return unauthorized(c);
  const projectId = c.req.query("projectId");

  if (projectId) {
    const isOwned = await assertProjectOwned(user.sub, projectId);
    if (!isOwned) {
      return fail(c, "Project not found", 404);
    }

    const messages = await whatsappDb.getMessagesByProject(projectId);
    return ok(c, messages);
  }

  const messages = await whatsappDb.getMessagesByOwner(user.sub);
  return ok(c, messages);
});

export default whatsappRoutes;
