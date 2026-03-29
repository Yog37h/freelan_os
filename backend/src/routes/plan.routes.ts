// ✅ VERIFIED: Plan confirmation, deliverable placeholder file records, and deliverable sharing now work without Drive while preserving WhatsApp review flow. Manual test: confirm a plan, add/edit/delete a deliverable, then share it and verify a manual placeholder link is used end to end.
import { Hono } from "hono";
import {
  db,
  planBuckets,
  planDeliverables,
  planTasks,
  projectFiles,
  projectPlans,
  whatsappMessages,
} from "@freelancer-os/db";
import { and, desc, eq } from "drizzle-orm";
import { requireUser } from "@/auth/requireUser";
import { fail, ok, validationError } from "@/http/response";
import { assertProjectOwned } from "@/services/guards";
import {
  confirmPlanSchema,
  createDeliverableSchema,
  createPlanTaskSchema,
  reorderBucketsSchema,
  updateBucketSchema,
  updateDeliverableSchema,
  updatePlanTaskSchema,
} from "@/validators/timeline";
import {
  buildProjectContext,
  ensureMilestoneStartTriggered,
  ensureStatusCheckTriggered,
  sendDeliverableShared,
  triggerOnboardingFlow,
} from "@/services/whatsappService";
import {
  confirmPlan,
  getDraftPlan,
  getFullTimeline,
  reorderBuckets,
} from "@/services/planService";
import {
  ensurePlaceholderDeliverableFiles,
  getOrCreateDeliverablePlaceholderFile,
} from "@/services/projectFilesViewService";
import { createClientActionRequest } from "@/services/clientActionRequestService";

const routes = new Hono();

// ────────────────────── Plan confirm ──────────────────────

routes.post("/:projectId/plan/confirm", async (c) => {
  const user = requireUser(c);
  if (!user) return fail(c, "Unauthorized", 401);
  const projectId = c.req.param("projectId");
  const isOwned = await assertProjectOwned(user.sub, projectId);
  if (!isOwned) {
    return fail(c, "Project not found", 404);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = confirmPlanSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(c, parsed.error.format());
  }

  const draft = await getDraftPlan(parsed.data.plan_id);
  if (!draft || draft.projectId !== projectId) {
    return fail(c, "Draft plan not found", 404);
  }

  await confirmPlan(
    parsed.data.plan_id,
    projectId,
    user.sub,
    parsed.data.edited_preview_json,
  );
  await ensurePlaceholderDeliverableFiles(projectId, user.sub).catch(
    () => undefined,
  );

  let whatsapp: { triggered: boolean; reason?: string } = {
    triggered: false,
    reason: "No client WhatsApp number",
  };
  const ctx = await buildProjectContext(projectId, user.sub);
  if (ctx) {
    triggerOnboardingFlow(ctx).catch(() => undefined);
    whatsapp = { triggered: true };
  }

  return ok(c, { ok: true, whatsapp });
});

// ────────────────────── Plan timeline ──────────────────────

routes.get("/:projectId/plan/timeline", async (c) => {
  const user = requireUser(c);
  if (!user) return fail(c, "Unauthorized", 401);
  const projectId = c.req.param("projectId");
  const isOwned = await assertProjectOwned(user.sub, projectId);
  if (!isOwned) {
    return fail(c, "Project not found", 404);
  }

  await ensureMilestoneStartTriggered(projectId, user.sub).catch(
    () => undefined,
  );
  await ensureStatusCheckTriggered(projectId, user.sub).catch(() => undefined);
  return ok(c, await getFullTimeline(projectId));
});

routes.patch("/:projectId/plan/timeline", async (c) => {
  const user = requireUser(c);
  if (!user) return fail(c, "Unauthorized", 401);
  const projectId = c.req.param("projectId");
  const isOwned = await assertProjectOwned(user.sub, projectId);
  if (!isOwned) {
    return fail(c, "Project not found", 404);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = reorderBucketsSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(c, parsed.error.format());
  }

  const latestPlan = await db.query.projectPlans.findFirst({
    where: and(
      eq(projectPlans.projectId, projectId),
      eq(projectPlans.status, "final"),
    ),
    orderBy: [desc(projectPlans.createdAt)],
  });
  if (!latestPlan) {
    return fail(c, "Plan not found", 404);
  }

  return ok(
    c,
    await reorderBuckets(
      latestPlan.id,
      projectId,
      parsed.data.bucket_order,
      parsed.data.auto_shift_dates,
    ),
  );
});

// ────────────────────── Bucket operations ──────────────────────

routes.patch("/:projectId/plan/bucket/:bucketId", async (c) => {
  const user = requireUser(c);
  if (!user) return fail(c, "Unauthorized", 401);
  const projectId = c.req.param("projectId");
  const bucketId = c.req.param("bucketId");
  const isOwned = await assertProjectOwned(user.sub, projectId);
  if (!isOwned) {
    return fail(c, "Project not found", 404);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = updateBucketSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(c, parsed.error.format());
  }

  const [bucket] = await db
    .update(planBuckets)
    .set({
      title: parsed.data.title,
      startDate: parsed.data.start_date,
      endDate: parsed.data.end_date,
    })
    .where(
      and(eq(planBuckets.id, bucketId), eq(planBuckets.projectId, projectId)),
    )
    .returning();

  return ok(c, bucket);
});

// ────────────────────── Deliverable operations ──────────────────────

routes.post("/:projectId/plan/bucket/:bucketId/deliverables", async (c) => {
  const user = requireUser(c);
  if (!user) return fail(c, "Unauthorized", 401);
  const projectId = c.req.param("projectId");
  const bucketId = c.req.param("bucketId");
  const isOwned = await assertProjectOwned(user.sub, projectId);
  if (!isOwned) {
    return fail(c, "Project not found", 404);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = createDeliverableSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(c, parsed.error.format());
  }

  const bucket = await db.query.planBuckets.findFirst({
    where: and(
      eq(planBuckets.id, bucketId),
      eq(planBuckets.projectId, projectId),
    ),
  });
  if (!bucket) {
    return fail(c, "Bucket not found", 404);
  }

  const [deliverable] = await db
    .insert(planDeliverables)
    .values({
      bucketId,
      planId: bucket.planId,
      projectId,
      ownerId: user.sub,
      orderIndex: 0,
      title: parsed.data.title,
      acceptanceCriteria: parsed.data.acceptance_criteria,
    })
    .returning();

  await getOrCreateDeliverablePlaceholderFile(
    projectId,
    user.sub,
    deliverable.id,
  ).catch(() => undefined);

  return ok(c, deliverable, null, 201);
});

routes.patch("/:projectId/plan/deliverable/:deliverableId", async (c) => {
  const user = requireUser(c);
  if (!user) return fail(c, "Unauthorized", 401);
  const projectId = c.req.param("projectId");
  const deliverableId = c.req.param("deliverableId");
  const isOwned = await assertProjectOwned(user.sub, projectId);
  if (!isOwned) {
    return fail(c, "Project not found", 404);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = updateDeliverableSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(c, parsed.error.format());
  }

  const [deliverable] = await db
    .update(planDeliverables)
    .set({
      title: parsed.data.title,
      acceptanceCriteria: parsed.data.acceptance_criteria,
    })
    .where(
      and(
        eq(planDeliverables.id, deliverableId),
        eq(planDeliverables.projectId, projectId),
      ),
    )
    .returning();

  if (deliverable) {
    await getOrCreateDeliverablePlaceholderFile(
      projectId,
      user.sub,
      deliverable.id,
    ).catch(() => undefined);
  }

  return ok(c, deliverable);
});

routes.delete("/:projectId/plan/deliverable/:deliverableId", async (c) => {
  const user = requireUser(c);
  if (!user) return fail(c, "Unauthorized", 401);
  const projectId = c.req.param("projectId");
  const deliverableId = c.req.param("deliverableId");
  const isOwned = await assertProjectOwned(user.sub, projectId);
  if (!isOwned) {
    return fail(c, "Project not found", 404);
  }

  const [deliverable] = await db
    .delete(planDeliverables)
    .where(
      and(
        eq(planDeliverables.id, deliverableId),
        eq(planDeliverables.projectId, projectId),
      ),
    )
    .returning();

  await db
    .delete(projectFiles)
    .where(
      and(
        eq(projectFiles.projectId, projectId),
        eq(projectFiles.ownerId, user.sub),
        eq(projectFiles.deliverableId, deliverableId),
      ),
    );

  return ok(c, deliverable);
});

// ────────────────────── Plan task operations ──────────────────────

routes.post("/:projectId/plan/bucket/:bucketId/tasks", async (c) => {
  const user = requireUser(c);
  if (!user) return fail(c, "Unauthorized", 401);
  const projectId = c.req.param("projectId");
  const bucketId = c.req.param("bucketId");
  const isOwned = await assertProjectOwned(user.sub, projectId);
  if (!isOwned) {
    return fail(c, "Project not found", 404);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = createPlanTaskSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(c, parsed.error.format());
  }

  const bucket = await db.query.planBuckets.findFirst({
    where: and(
      eq(planBuckets.id, bucketId),
      eq(planBuckets.projectId, projectId),
    ),
  });
  if (!bucket) {
    return fail(c, "Bucket not found", 404);
  }

  const [task] = await db
    .insert(planTasks)
    .values({
      bucketId,
      deliverableId: parsed.data.deliverable_id ?? null,
      planId: bucket.planId,
      projectId,
      ownerId: user.sub,
      orderIndex: 0,
      title: parsed.data.title,
      dueDate: parsed.data.due_date,
      status: "pending",
    })
    .returning();

  return ok(c, task, null, 201);
});

routes.patch("/:projectId/plan/task/:taskId", async (c) => {
  const user = requireUser(c);
  if (!user) return fail(c, "Unauthorized", 401);
  const projectId = c.req.param("projectId");
  const taskId = c.req.param("taskId");
  const isOwned = await assertProjectOwned(user.sub, projectId);
  if (!isOwned) {
    return fail(c, "Project not found", 404);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = updatePlanTaskSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(c, parsed.error.format());
  }

  const [task] = await db
    .update(planTasks)
    .set({
      title: parsed.data.title,
      dueDate: parsed.data.due_date,
      deliverableId: parsed.data.deliverable_id,
      status: parsed.data.status,
    })
    .where(and(eq(planTasks.id, taskId), eq(planTasks.projectId, projectId)))
    .returning();

  await ensureMilestoneStartTriggered(projectId, user.sub).catch(
    () => undefined,
  );
  await ensureStatusCheckTriggered(projectId, user.sub).catch(() => undefined);
  return ok(c, task);
});

routes.delete("/:projectId/plan/task/:taskId", async (c) => {
  const user = requireUser(c);
  if (!user) return fail(c, "Unauthorized", 401);
  const projectId = c.req.param("projectId");
  const taskId = c.req.param("taskId");
  const isOwned = await assertProjectOwned(user.sub, projectId);
  if (!isOwned) {
    return fail(c, "Project not found", 404);
  }

  const [task] = await db
    .delete(planTasks)
    .where(and(eq(planTasks.id, taskId), eq(planTasks.projectId, projectId)))
    .returning();

  return ok(c, task);
});

routes.post("/:projectId/plan/deliverable/:deliverableId/share", async (c) => {
  const user = requireUser(c);
  if (!user) return fail(c, "Unauthorized", 401);
  const projectId = c.req.param("projectId");
  const deliverableId = c.req.param("deliverableId");
  const isOwned = await assertProjectOwned(user.sub, projectId);
  if (!isOwned) {
    return fail(c, "Project not found", 404);
  }

  const deliverable = await db.query.planDeliverables.findFirst({
    where: and(
      eq(planDeliverables.id, deliverableId),
      eq(planDeliverables.projectId, projectId),
    ),
  });
  if (!deliverable) {
    return fail(c, "Deliverable not found", 404);
  }

  const existingMessage = await db.query.whatsappMessages.findFirst({
    where: and(
      eq(whatsappMessages.projectId, projectId),
      eq(whatsappMessages.direction, "outgoing"),
      eq(whatsappMessages.campaignName, `deliverable_sent:${deliverableId}`),
    ),
  });

  if (existingMessage) {
    return ok(c, {
      shared: true,
      alreadySent: true,
      deliverableId,
      messageId: existingMessage.id,
    });
  }

  const placeholderFile = await getOrCreateDeliverablePlaceholderFile(
    projectId,
    user.sub,
    deliverableId,
  );
  if (!placeholderFile?.webViewLink) {
    return fail(c, "Deliverable share link is not ready for sharing", 400);
  }

  const ctx = await buildProjectContext(projectId, user.sub);
  if (!ctx) {
    return fail(
      c,
      "Cannot share deliverable because client WhatsApp is missing",
      400,
    );
  }

  const actionRequest = await createClientActionRequest({
    projectId,
    clientId: ctx.clientId,
    ownerId: user.sub,
    category: "deliverable_review",
    templateName: "deliverable_sent",
    requestLabel: `${deliverable.title} Review`,
    requestSummary: `Deliverable ready for client review: ${deliverable.title}`,
    requestMetadata: {
      deliverableId,
      deliverableTitle: deliverable.title,
      folderUrl: placeholderFile.webViewLink,
    },
  });

  const result = await sendDeliverableShared(
    ctx,
    deliverable.title,
    new Date().toISOString().slice(0, 10),
    placeholderFile.webViewLink,
    `deliverable_sent:${deliverableId}`,
    actionRequest.id,
  );

  if (!result.success) {
    return fail(c, result.error || "Deliverable share failed", 400);
  }

  return ok(c, {
    shared: true,
    deliverableId,
    folderUrl: placeholderFile.webViewLink,
  });
});

export default routes;
