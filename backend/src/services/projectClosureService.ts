import * as closureDb from "@/db/closureDb";
import * as projectsDb from "@/db/projectsDb";
import { createClientActionRequest } from "@/services/clientActionRequestService";
import {
  buildProjectContext,
  sendProjectDropped,
} from "@/services/whatsappService";

export async function getClosure(projectId: string) {
  return closureDb.getClosure(projectId);
}

export async function closeProject(userId: string, projectId: string) {
  const project = await projectsDb.updateProject(userId, projectId, {
    status: "Completed",
    droppedAt: null,
    dropAcknowledgedAt: null,
    dropReason: null,
  });

  if (!project) {
    throw new Error("Project not found");
  }

  return closureDb.upsertClosure({
    projectId,
    ownerId: userId,
    closedAt: new Date(),
  });
}

export async function dropProject(
  userId: string,
  projectId: string,
  reason: string,
) {
  const droppedAt = new Date();
  const project = await projectsDb.updateProject(userId, projectId, {
    status: "Drop Pending Ack",
    dropReason: reason,
    droppedAt,
    dropAcknowledgedAt: null,
  });

  if (!project) {
    throw new Error("Project not found");
  }

  const ctx = await buildProjectContext(projectId, userId);
  if (ctx) {
    const actionRequest = await createClientActionRequest({
      projectId,
      clientId: ctx.clientId,
      ownerId: userId,
      category: "project_drop",
      templateName: "project_dropped",
      requestLabel: "Project Drop Acknowledgement",
      requestSummary: reason,
      requestMetadata: {
        dropReason: reason,
        droppedAt: droppedAt.toISOString(),
      },
    });

    await sendProjectDropped(
      ctx,
      reason,
      droppedAt.toISOString().slice(0, 10),
      actionRequest.id,
    ).catch(() => undefined);
  }

  return project;
}

export async function upsertClosureState(
  userId: string,
  projectId: string,
  checklistState: Record<string, boolean>,
) {
  return closureDb.upsertClosure({
    projectId,
    ownerId: userId,
    checklistState,
  });
}
