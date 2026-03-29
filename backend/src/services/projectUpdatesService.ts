import * as updatesDb from "@/db/updatesDb";
import * as projectsDb from "@/db/projectsDb";
import * as scopeDb from "@/db/scopeDb";
import {
  createClientActionRequest,
  getRequestsByOwner,
  resolveClientActionRequest,
} from "@/services/clientActionRequestService";
import {
  buildProjectContext,
  sendApprovalRequest,
  sendBufferRequest,
} from "@/services/whatsappService";

type RequestStatus =
  | "pending"
  | "approved"
  | "revision"
  | "will_connect"
  | "failed";

interface RequestMetadata extends Record<string, unknown> {
  requestType?: "buffer" | "scope";
  status?: RequestStatus;
  bufferDays?: number;
  reason?: string;
  scopeType?: "inclusion" | "exclusion" | "change";
  scopeDetail?: string;
  scopeTitle?: string;
  currentEndDate?: string;
  proposedEndDate?: string;
  respondedAt?: string;
  responseLabel?: string;
  requestApplied?: boolean;
}

function toIsoDate(dateValue: Date) {
  return dateValue.toISOString().slice(0, 10);
}

function parseRequestMetadata(value: unknown): RequestMetadata {
  if (!value || typeof value !== "object") {
    return {};
  }

  return value as RequestMetadata;
}

export async function getUpdates(projectId: string) {
  return updatesDb.getUpdates(projectId);
}

export async function addUpdate(
  projectId: string,
  ownerId: string,
  data: Record<string, unknown>,
) {
  const { metadata, ...updateData } = data;
  const requestMetadata = (metadata as RequestMetadata | undefined) ?? {};
  const created = await updatesDb.createUpdate({
    ...updateData,
    projectId,
    ownerId,
    sentAt: new Date(),
  });

  const ctx = await buildProjectContext(projectId, ownerId);
  if (!ctx || updateData.channel !== "WhatsApp") {
    return created;
  }

  const requestType = requestMetadata.requestType;
  if (requestType === "buffer") {
    const bufferDays = Number(requestMetadata.bufferDays) || 0;
    const reason =
      typeof requestMetadata.reason === "string" &&
      requestMetadata.reason.trim().length > 0
        ? requestMetadata.reason
        : typeof updateData.summary === "string"
          ? updateData.summary
          : "Additional working time requested";
    const revisedEndDate =
      typeof requestMetadata.proposedEndDate === "string" &&
      requestMetadata.proposedEndDate
        ? requestMetadata.proposedEndDate
        : ctx.endDate;

    const actionRequest = await createClientActionRequest({
      projectId,
      clientId: ctx.clientId,
      ownerId,
      updateId: created.id,
      category: "buffer",
      templateName: "buffer_request",
      requestLabel: `Buffer Request${bufferDays ? ` · ${bufferDays} day(s)` : ""}`,
      requestSummary: reason,
      requestMetadata: {
        ...requestMetadata,
        requestType: "buffer",
        bufferDays,
        reason,
        proposedEndDate: revisedEndDate,
      },
    });

    await sendBufferRequest(
      ctx,
      bufferDays,
      reason,
      revisedEndDate,
      actionRequest.id,
    );

    return (
      (await updatesDb.updateUpdate(created.id, {
        whatsappStatus: JSON.stringify({
          clientActionRequestId: actionRequest.id,
          category: "buffer",
          status: "pending",
        }),
      })) ?? created
    );
  }

  if (requestType === "scope" || updateData.type === "approval") {
    const requestLabel =
      typeof requestMetadata.scopeTitle === "string" &&
      requestMetadata.scopeTitle.trim().length > 0
        ? requestMetadata.scopeTitle
        : typeof requestMetadata.scopeType === "string"
          ? `Scope ${requestMetadata.scopeType}`
          : "Scope change request";
    const requestSummary =
      typeof requestMetadata.scopeDetail === "string" &&
      requestMetadata.scopeDetail.trim().length > 0
        ? requestMetadata.scopeDetail
        : typeof updateData.summary === "string"
          ? updateData.summary
          : requestLabel;

    const actionRequest = await createClientActionRequest({
      projectId,
      clientId: ctx.clientId,
      ownerId,
      updateId: created.id,
      category: "approval",
      templateName: "approval_request",
      requestLabel,
      requestSummary,
      requestMetadata: {
        ...requestMetadata,
        requestType: "scope",
      },
    });

    await sendApprovalRequest(ctx, requestLabel, actionRequest.id);

    return (
      (await updatesDb.updateUpdate(created.id, {
        whatsappStatus: JSON.stringify({
          clientActionRequestId: actionRequest.id,
          category: "approval",
          status: "pending",
        }),
      })) ?? created
    );
  }

  return created;
}

export async function resolveLatestPendingRequest(
  projectId: string,
  ownerId: string,
  requestType: "buffer" | "scope",
  response: {
    status: Exclude<RequestStatus, "pending">;
    responseLabel: string;
    responseMessage: string;
  },
) {
  const requests = await getRequestsByOwner(ownerId, {
    categories: [requestType === "buffer" ? "buffer" : "approval"],
    statuses: ["pending"],
  });

  const target = requests.find((request) => request.projectId === projectId);
  if (!target) {
    return null;
  }

  const metadata = parseRequestMetadata(target.requestMetadata);
  return applyRequestResolution(target.id, ownerId, requestType, metadata, response);
}

export async function applyRequestResolution(
  requestId: string,
  ownerId: string,
  requestType: "buffer" | "scope",
  existingMetadata: RequestMetadata,
  response: {
    status: Exclude<RequestStatus, "pending">;
    responseLabel: string;
    responseMessage: string;
  },
) {
  const target = await getRequestsByOwner(ownerId, {
    categories: [requestType === "buffer" ? "buffer" : "approval"],
  }).then((requests) => requests.find((request) => request.id === requestId));

  if (!target) {
    return null;
  }

  const metadata = existingMetadata;
  const nextMetadata: RequestMetadata = {
    ...metadata,
    status: response.status,
    responseLabel: response.responseLabel,
    respondedAt: new Date().toISOString(),
  };

  if (response.status === "approved" && !nextMetadata.requestApplied) {
    const proposedEndDate =
      typeof nextMetadata.proposedEndDate === "string" &&
      nextMetadata.proposedEndDate
        ? nextMetadata.proposedEndDate
        : null;

    if (requestType === "buffer") {
      await projectsDb.updateProject(ownerId, target.projectId, {
        deadline: proposedEndDate ?? undefined,
        bufferDays:
          typeof nextMetadata.bufferDays === "number"
            ? nextMetadata.bufferDays
            : undefined,
      });
      nextMetadata.requestApplied = true;
      nextMetadata.appliedChange = "deadline_extended";
    }

    if (requestType === "scope") {
      const scopeType =
        nextMetadata.scopeType === "inclusion" ||
        nextMetadata.scopeType === "exclusion" ||
        nextMetadata.scopeType === "change"
          ? nextMetadata.scopeType
          : "change";
      const scopeDetail =
        typeof nextMetadata.scopeDetail === "string" &&
        nextMetadata.scopeDetail.trim().length > 0
          ? nextMetadata.scopeDetail.trim()
          : target.requestSummary || "Approved scope change";
      const scopeTitle =
        typeof nextMetadata.scopeTitle === "string" &&
        nextMetadata.scopeTitle.trim().length > 0
          ? nextMetadata.scopeTitle.trim()
          : scopeDetail.split("\n")[0]?.slice(0, 120) ||
            "Approved scope change";

      await scopeDb.createScopeItem({
        projectId: target.projectId,
        ownerId,
        type: scopeType,
        label: scopeTitle,
        note: scopeDetail,
      });

      await projectsDb.updateProject(ownerId, target.projectId, {
        deadline: proposedEndDate ?? undefined,
      });

      nextMetadata.requestApplied = true;
      nextMetadata.appliedChange = "scope_updated";
    }
  }

  const resolved = await resolveClientActionRequest(target.id, {
    status: response.status,
    responseLabel: response.responseLabel,
    responseMessage: response.responseMessage,
    metadataPatch: nextMetadata,
  });

  return resolved
    ? {
        requestId: resolved.id,
        metadata: nextMetadata,
      }
    : null;
}

export async function seedUpdateCenterItems(ownerId: string) {
  const projects = await projectsDb.getProjects(ownerId, {
    page: 1,
    limit: 200,
  });
  const requestDates = new Map<string, string>();

  await Promise.all(
    projects.data.map(async (project) => {
      const updates = await updatesDb.getUpdates(project.id);
      const latest = updates[0];
      if (latest?.sentAt) {
        requestDates.set(project.id, toIsoDate(new Date(latest.sentAt)));
      }
    }),
  );

  return projects.data.map((project) => ({
    updateId: project.id,
    projectId: project.id,
    clientName: project.client?.name || "Client",
    projectTitle: project.title,
    type: "weekly" as const,
    contentPreview: project.description || "Project communication history",
    sentAt: requestDates.get(project.id) || toIsoDate(new Date()),
    autoMode: true,
  }));
}
