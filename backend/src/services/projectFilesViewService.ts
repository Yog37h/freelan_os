// ✅ VERIFIED: Replaced Drive-backed file provisioning with grouped manual placeholder deliverable links. Manual test: confirm a plan, open Files tab, and verify each deliverable appears under its milestone with a share-ready placeholder link and no Google dependency.
import {
  db,
  planBuckets,
  planDeliverables,
  projectFiles,
  projectPlans,
} from "@freelancer-os/db";
import { and, desc, eq, inArray } from "drizzle-orm";
import { getDeliverableSharePlaceholderUrl } from "@/lib/placeholderLinks";

type DeliverableContext = {
  deliverableId: string;
  bucketId: string;
  deliverableTitle: string;
  bucketTitle: string;
};

function getPlaceholderMetadata() {
  return {
    provider: "manual" as const,
    itemType: "deliverable_link" as const,
    type: "link",
    shareable: true,
    webViewLink: getDeliverableSharePlaceholderUrl(),
    externalFileId: null,
    parentExternalFileId: null,
    syncedAt: null,
    syncMetadata: {
      source: "placeholder",
    },
  };
}

async function getLatestFinalPlan(projectId: string) {
  return db.query.projectPlans.findFirst({
    where: and(
      eq(projectPlans.projectId, projectId),
      eq(projectPlans.status, "final"),
    ),
    orderBy: [desc(projectPlans.createdAt)],
  });
}

async function getDeliverableContexts(projectId: string) {
  const latestPlan = await getLatestFinalPlan(projectId);
  if (!latestPlan) {
    return [] as DeliverableContext[];
  }

  const [buckets, deliverables] = await Promise.all([
    db.query.planBuckets.findMany({
      where: eq(planBuckets.planId, latestPlan.id),
      orderBy: [planBuckets.orderIndex],
      columns: {
        id: true,
        title: true,
      },
    }),
    db.query.planDeliverables.findMany({
      where: eq(planDeliverables.planId, latestPlan.id),
      orderBy: [planDeliverables.orderIndex],
      columns: {
        id: true,
        bucketId: true,
        title: true,
      },
    }),
  ]);

  const bucketTitleById = new Map(
    buckets.map((bucket) => [bucket.id, bucket.title] as const),
  );

  return deliverables.map((deliverable) => ({
    deliverableId: deliverable.id,
    bucketId: deliverable.bucketId,
    deliverableTitle: deliverable.title,
    bucketTitle:
      bucketTitleById.get(deliverable.bucketId) || "Untitled Milestone",
  }));
}

function mapProjectFile(
  row: typeof projectFiles.$inferSelect,
  extras?: Partial<{
    deliverableTitle: string;
    bucketTitle: string;
  }>,
) {
  return {
    id: row.id,
    projectId: row.projectId,
    name: row.name,
    type: row.type,
    size: row.size,
    uploadedAt: row.uploadedAt?.toISOString() ?? new Date().toISOString(),
    provider: row.provider,
    itemType: row.itemType,
    bucketId: row.bucketId,
    deliverableId: row.deliverableId,
    externalFileId: row.externalFileId,
    parentExternalFileId: row.parentExternalFileId,
    webViewLink: row.webViewLink,
    shareable: row.shareable,
    syncMetadata: row.syncMetadata,
    syncedAt: row.syncedAt?.toISOString() ?? null,
    deliverableTitle: extras?.deliverableTitle,
    bucketTitle: extras?.bucketTitle,
  };
}

export async function ensurePlaceholderDeliverableFiles(
  projectId: string,
  ownerId: string,
) {
  const deliverables = await getDeliverableContexts(projectId);
  if (deliverables.length === 0) {
    return [];
  }

  const deliverableIds = deliverables.map((item) => item.deliverableId);
  const existingFiles = await db.query.projectFiles.findMany({
    where: and(
      eq(projectFiles.projectId, projectId),
      eq(projectFiles.ownerId, ownerId),
      inArray(projectFiles.deliverableId, deliverableIds),
    ),
    orderBy: [desc(projectFiles.uploadedAt)],
  });

  const existingByDeliverableId = new Map<string, typeof projectFiles.$inferSelect>();
  for (const row of existingFiles) {
    if (row.deliverableId && !existingByDeliverableId.has(row.deliverableId)) {
      existingByDeliverableId.set(row.deliverableId, row);
    }
  }

  const placeholder = getPlaceholderMetadata();

  await Promise.all(
    deliverables.map(async (deliverable) => {
      const existing = existingByDeliverableId.get(deliverable.deliverableId);
      if (existing) {
        await db
          .update(projectFiles)
          .set({
            name: deliverable.deliverableTitle,
            bucketId: deliverable.bucketId,
            provider: placeholder.provider,
            itemType: placeholder.itemType,
            type: placeholder.type,
            shareable: placeholder.shareable,
            webViewLink: placeholder.webViewLink,
            externalFileId: placeholder.externalFileId,
            parentExternalFileId: placeholder.parentExternalFileId,
            syncedAt: placeholder.syncedAt,
            syncMetadata: placeholder.syncMetadata,
          })
          .where(eq(projectFiles.id, existing.id));
        return;
      }

      await db.insert(projectFiles).values({
        projectId,
        ownerId,
        bucketId: deliverable.bucketId,
        deliverableId: deliverable.deliverableId,
        name: deliverable.deliverableTitle,
        provider: placeholder.provider,
        itemType: placeholder.itemType,
        type: placeholder.type,
        shareable: placeholder.shareable,
        webViewLink: placeholder.webViewLink,
        syncMetadata: placeholder.syncMetadata,
        uploadedAt: new Date(),
      });
    }),
  );

  return getDeliverableContexts(projectId);
}

export async function getOrCreateDeliverablePlaceholderFile(
  projectId: string,
  ownerId: string,
  deliverableId: string,
) {
  await ensurePlaceholderDeliverableFiles(projectId, ownerId);

  return db.query.projectFiles.findFirst({
    where: and(
      eq(projectFiles.projectId, projectId),
      eq(projectFiles.ownerId, ownerId),
      eq(projectFiles.deliverableId, deliverableId),
    ),
    orderBy: [desc(projectFiles.uploadedAt)],
  });
}

export async function getProjectFilesView(projectId: string, ownerId: string) {
  const deliverables = await ensurePlaceholderDeliverableFiles(projectId, ownerId);
  const files = await db.query.projectFiles.findMany({
    where: and(
      eq(projectFiles.projectId, projectId),
      eq(projectFiles.ownerId, ownerId),
    ),
    orderBy: [desc(projectFiles.uploadedAt)],
  });

  const deliverableContextById = new Map(
    deliverables.map((item) => [item.deliverableId, item] as const),
  );
  const fileByDeliverableId = new Map<string, typeof projectFiles.$inferSelect>();

  for (const row of files) {
    if (row.deliverableId && !fileByDeliverableId.has(row.deliverableId)) {
      fileByDeliverableId.set(row.deliverableId, row);
    }
  }

  const groupedBuckets = new Map<
    string,
    {
      bucketId: string;
      bucketTitle: string;
      bucketStatus?: string;
      deliverables: ReturnType<typeof mapProjectFile>[];
    }
  >();

  for (const deliverable of deliverables) {
    const existingBucket = groupedBuckets.get(deliverable.bucketId) || {
      bucketId: deliverable.bucketId,
      bucketTitle: deliverable.bucketTitle,
      bucketStatus: undefined,
      deliverables: [],
    };

    const file =
      fileByDeliverableId.get(deliverable.deliverableId) ||
      ({
        id: `${deliverable.deliverableId}-placeholder`,
        projectId,
        ownerId,
        name: deliverable.deliverableTitle,
        type: "link",
        size: null,
        storagePath: null,
        provider: "manual",
        itemType: "deliverable_link",
        bucketId: deliverable.bucketId,
        deliverableId: deliverable.deliverableId,
        externalFileId: null,
        parentExternalFileId: null,
        webViewLink: getDeliverableSharePlaceholderUrl(),
        shareable: true,
        syncMetadata: { source: "placeholder" },
        syncedAt: null,
        uploadedAt: new Date(),
      } satisfies typeof projectFiles.$inferSelect);

    existingBucket.deliverables.push(
      mapProjectFile(file, {
        deliverableTitle: deliverable.deliverableTitle,
        bucketTitle: deliverable.bucketTitle,
      }),
    );
    groupedBuckets.set(deliverable.bucketId, existingBucket);
  }

  const unassignedItems = files
    .filter((row) => !row.deliverableId)
    .map((row) => mapProjectFile(row));

  return {
    projectId,
    connected: false,
    projectFolder: null,
    buckets: Array.from(groupedBuckets.values()),
    unassignedItems,
    google: {
      connected: false,
      scopes: [],
    },
  };
}
