import {
  clientActionRequests,
  db,
  whatsappMessages,
} from "@freelancer-os/db";
import { and, desc, eq, inArray } from "drizzle-orm";

export type ClientActionRequestInsert =
  typeof clientActionRequests.$inferInsert;
export type ClientActionRequestUpdate =
  Partial<typeof clientActionRequests.$inferInsert>;

export async function createClientActionRequest(
  values: ClientActionRequestInsert,
) {
  const [created] = await db
    .insert(clientActionRequests)
    .values(values)
    .returning();

  return created;
}

export async function updateClientActionRequest(
  requestId: string,
  values: ClientActionRequestUpdate,
) {
  const [updated] = await db
    .update(clientActionRequests)
    .set({
      ...values,
      updatedAt: new Date(),
    })
    .where(eq(clientActionRequests.id, requestId))
    .returning();

  return updated ?? null;
}

export async function getClientActionRequestById(requestId: string) {
  return db.query.clientActionRequests.findFirst({
    where: eq(clientActionRequests.id, requestId),
  });
}

export async function getRequestsByProject(projectId: string) {
  return db.query.clientActionRequests.findMany({
    where: eq(clientActionRequests.projectId, projectId),
    orderBy: [desc(clientActionRequests.requestedAt)],
  });
}

export async function getRequestsByOwner(
  ownerId: string,
  options?: {
    categories?: string[];
    statuses?: string[];
  },
) {
  return db.query.clientActionRequests.findMany({
    where: (table, { and: whereAnd }) => {
      const filters = [eq(table.ownerId, ownerId)];

      if (options?.categories?.length) {
        filters.push(inArray(table.category, options.categories));
      }

      if (options?.statuses?.length) {
        filters.push(inArray(table.status, options.statuses));
      }

      return whereAnd(...filters);
    },
    orderBy: [desc(clientActionRequests.requestedAt)],
  });
}

export async function findLatestPendingRequest(
  projectId: string,
  categories: readonly string[],
) {
  return db.query.clientActionRequests.findFirst({
    where: (table, { and: whereAnd }) =>
      whereAnd(
        eq(table.projectId, projectId),
        inArray(table.category, categories),
        eq(table.status, "pending"),
      ),
    orderBy: [desc(clientActionRequests.requestedAt)],
  });
}

export async function findRequestByProviderMessageId(providerMessageId: string) {
  const [row] = await db
    .select({
      request: clientActionRequests,
      message: whatsappMessages,
    })
    .from(whatsappMessages)
    .innerJoin(
      clientActionRequests,
      eq(whatsappMessages.clientActionRequestId, clientActionRequests.id),
    )
    .where(eq(whatsappMessages.aisensyMessageId, providerMessageId))
    .orderBy(desc(whatsappMessages.createdAt))
    .limit(1);

  return row ?? null;
}

export async function getLinkedMessages(requestId: string) {
  return db.query.whatsappMessages.findMany({
    where: eq(whatsappMessages.clientActionRequestId, requestId),
    orderBy: [desc(whatsappMessages.createdAt)],
  });
}

export async function getPendingRequestsByProjectAndCategories(
  projectId: string,
  categories: readonly string[],
) {
  return db.query.clientActionRequests.findMany({
    where: and(
      eq(clientActionRequests.projectId, projectId),
      inArray(clientActionRequests.category, categories),
      eq(clientActionRequests.status, "pending"),
    ),
    orderBy: [desc(clientActionRequests.requestedAt)],
  });
}
