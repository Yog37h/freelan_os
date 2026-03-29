import * as clientActionRequestsDb from "@/db/clientActionRequestsDb";
import * as updatesDb from "@/db/updatesDb";
import * as whatsappDb from "@/db/whatsappDb";

export type ClientActionCategory =
  | "approval"
  | "buffer"
  | "status_check"
  | "project_drop"
  | "closure"
  | "sync"
  | "revision"
  | "deliverable_review";

export type ClientActionStatus =
  | "pending"
  | "approved"
  | "revision"
  | "will_connect"
  | "acknowledged"
  | "concern_raised"
  | "completed"
  | "failed";

export interface ClientActionRequestInput {
  projectId: string;
  clientId: string | null;
  ownerId: string;
  updateId?: string | null;
  category: ClientActionCategory;
  templateName?: string | null;
  requestLabel?: string | null;
  requestSummary?: string | null;
  requestMetadata?: Record<string, unknown>;
  status?: ClientActionStatus;
}

export interface RequestResolutionInput {
  status: ClientActionStatus;
  responseLabel?: string | null;
  responseMessage?: string | null;
  metadataPatch?: Record<string, unknown>;
}

function mergeMetadata(
  base: Record<string, unknown> | null | undefined,
  patch: Record<string, unknown> | null | undefined,
) {
  return {
    ...(base || {}),
    ...(patch || {}),
  };
}

function buildUpdateSnapshot(request: {
  id: string;
  category: string;
  status: string;
  responseLabel?: string | null;
  respondedAt?: Date | null;
  requestMetadata?: Record<string, unknown> | null;
}) {
  return JSON.stringify({
    clientActionRequestId: request.id,
    category: request.category,
    status: request.status,
    responseLabel: request.responseLabel || null,
    respondedAt: request.respondedAt?.toISOString() || null,
    ...(request.requestMetadata || {}),
  });
}

export async function createClientActionRequest(
  input: ClientActionRequestInput,
) {
  const created = await clientActionRequestsDb.createClientActionRequest({
    projectId: input.projectId,
    clientId: input.clientId,
    ownerId: input.ownerId,
    updateId: input.updateId ?? null,
    category: input.category,
    templateName: input.templateName ?? null,
    status: input.status ?? "pending",
    requestLabel: input.requestLabel ?? null,
    requestSummary: input.requestSummary ?? null,
    requestMetadata: input.requestMetadata ?? {},
  });

  if (created.updateId) {
    await updatesDb.updateUpdate(created.updateId, {
      whatsappStatus: buildUpdateSnapshot(created),
    });
  }

  return created;
}

export async function attachMessageToRequest(
  requestId: string,
  messageId: string,
) {
  return whatsappDb.updateMessageById(messageId, {
    client_action_request_id: requestId,
  });
}

export async function resolveClientActionRequest(
  requestId: string,
  input: RequestResolutionInput,
) {
  const existing =
    await clientActionRequestsDb.getClientActionRequestById(requestId);

  if (!existing) {
    return null;
  }

  const updated = await clientActionRequestsDb.updateClientActionRequest(
    requestId,
    {
      status: input.status,
      responseLabel: input.responseLabel ?? existing.responseLabel,
      responseMessage: input.responseMessage ?? existing.responseMessage,
      respondedAt: new Date(),
      requestMetadata: mergeMetadata(
        existing.requestMetadata as Record<string, unknown>,
        input.metadataPatch,
      ),
    },
  );

  if (updated?.updateId) {
    await updatesDb.updateUpdate(updated.updateId, {
      summary: input.responseMessage ?? updated.requestSummary ?? null,
      whatsappStatus: buildUpdateSnapshot(updated),
    });
  }

  return updated;
}

export async function resolveRequestFromProviderMessageContext(
  providerMessageId: string | null | undefined,
  fallback: {
    projectId: string;
    categories: readonly ClientActionCategory[];
  },
) {
  if (providerMessageId) {
    const directMatch =
      await clientActionRequestsDb.findRequestByProviderMessageId(
        providerMessageId,
      );
    if (directMatch?.request) {
      return directMatch.request;
    }
  }

  const pendingRequests =
    await clientActionRequestsDb.getPendingRequestsByProjectAndCategories(
      fallback.projectId,
      fallback.categories,
    );

  if (pendingRequests.length === 1) {
    return pendingRequests[0];
  }

  return null;
}

export async function getRequestFromProviderMessageId(
  providerMessageId: string | null | undefined,
) {
  if (!providerMessageId) {
    return null;
  }

  const directMatch =
    await clientActionRequestsDb.findRequestByProviderMessageId(
      providerMessageId,
    );

  return directMatch?.request ?? null;
}

export async function getRequestMessages(requestId: string) {
  return clientActionRequestsDb.getLinkedMessages(requestId);
}

export async function getRequestsByOwner(
  ownerId: string,
  options?: {
    categories?: string[];
    statuses?: string[];
  },
) {
  return clientActionRequestsDb.getRequestsByOwner(ownerId, options);
}

export async function getRequestById(requestId: string) {
  return clientActionRequestsDb.getClientActionRequestById(requestId);
}

export async function markRequestFailed(
  requestId: string,
  errorMessage: string | null | undefined,
) {
  return resolveClientActionRequest(requestId, {
    status: "failed",
    responseLabel: "Failed",
    responseMessage: errorMessage || "WhatsApp send failed",
    metadataPatch: {
      deliveryError: errorMessage || null,
    },
  });
}

export async function syncRequestDeliveryStatus(
  providerMessageId: string,
  status: string,
) {
  const requestMatch =
    await clientActionRequestsDb.findRequestByProviderMessageId(providerMessageId);

  if (!requestMatch?.request) {
    return null;
  }

  const metadata = mergeMetadata(
    requestMatch.request.requestMetadata as Record<string, unknown>,
    {
      deliveryStatus: status,
    },
  );

  return clientActionRequestsDb.updateClientActionRequest(
    requestMatch.request.id,
    {
      requestMetadata: metadata,
    },
  );
}
