import { Hono } from "hono";
import { z } from "zod";
import { and, asc, eq, isNotNull } from "drizzle-orm";
import { db, planBuckets, planTasks, projects } from "@freelancer-os/db";
import { requireUser } from "@/auth/requireUser";
import { createDraftPlan, checkRateLimit } from "@/services/planService";
import { generateTimeline } from "@/ai";
import { fail, ok, unauthorized, validationError } from "@/http/response";
import { assertProjectOwned } from "@/services/guards";
import { ensureStatusCheckTriggered } from "@/services/whatsappService";

const timelineRoutes = new Hono();

const timelineGenerateSchema = z.object({
  projectId: z.string().uuid(),
  projectTitle: z.string().min(1),
  projectDescription: z.string().default(""),
  prdContent: z.string().default(""),
  freelancerContext: z.string().default(""),
  startDate: z.string().min(1),
  deadline: z.string().min(1),
  bufferDays: z.number().int().nonnegative().default(0),
  revisions: z.number().int().nonnegative().default(0),
  cost: z.number().nonnegative().default(0),
  currency: z.string().default("INR"),
  updateMode: z.enum(["weekly", "milestone"]),
});

timelineRoutes.get("/tasks", async (c) => {
  const user = requireUser(c);
  if (!user) return unauthorized(c);

  const rows = await db
    .select({
      taskId: planTasks.id,
      projectId: planTasks.projectId,
      projectTitle: projects.title,
      milestoneName: planBuckets.title,
      taskTitle: planTasks.title,
      dueDate: planTasks.dueDate,
      status: planTasks.status,
    })
    .from(planTasks)
    .innerJoin(projects, eq(planTasks.projectId, projects.id))
    .innerJoin(planBuckets, eq(planTasks.bucketId, planBuckets.id))
    .where(and(eq(planTasks.ownerId, user.sub), isNotNull(planTasks.dueDate)))
    .orderBy(asc(planTasks.dueDate), asc(planTasks.orderIndex));

  await Promise.all(
    [...new Set(rows.map((row) => row.projectId))].map((projectId) =>
      ensureStatusCheckTriggered(projectId, user.sub).catch(() => undefined),
    ),
  );

  return ok(c, rows);
});

timelineRoutes.post("/generate", async (c) => {
  const user = requireUser(c);
  if (!user) return unauthorized(c);
  const body = await c.req.json().catch(() => null);
  const parsed = timelineGenerateSchema.safeParse(body);

  if (!parsed.success) {
    return validationError(c, parsed.error.format());
  }

  const isOwned = await assertProjectOwned(user.sub, parsed.data.projectId);
  if (!isOwned) {
    return fail(c, "Project not found", 404);
  }

  if (!checkRateLimit(user.sub)) {
    return fail(
      c,
      "Rate limit exceeded. Max 5 timeline generations per day.",
      429,
    );
  }

  const aiResult = await generateTimeline(parsed.data);
  if (!aiResult.success) {
    return fail(c, aiResult.error, 422);
  }

  const plan = await createDraftPlan(
    parsed.data.projectId,
    user.sub,
    parsed.data.updateMode,
    aiResult.model,
    aiResult.data,
  );

  return ok(c, { plan_id: plan.id, preview: aiResult.data });
});

export default timelineRoutes;
