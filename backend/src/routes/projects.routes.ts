// ✅ VERIFIED: Project creation no longer requires Google connection and behaves normally with the existing WhatsApp and planning flow intact. Manual test: POST /api/projects without any google_connections row and confirm the project is created.
import { Hono } from "hono";
import { db, payments } from "@freelancer-os/db";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { requireUser } from "@/auth/requireUser";
import { fail, ok, validationError } from "@/http/response";
import { assertProjectOwned } from "@/services/guards";
import * as overviewService from "@/services/projectOverviewService";
import * as timelineService from "@/services/projectTimelineService";
import * as updatesService from "@/services/projectUpdatesService";
import * as filesService from "@/services/projectFilesService";
import * as scopeService from "@/services/projectScopeService";
import * as closureService from "@/services/projectClosureService";
import {
  createProjectSchema,
  paginationSchema,
  updateProjectOverviewSchema,
} from "@/validators/projects";
import {
  createMilestoneSchema,
  createTaskSchema,
  updateTaskStatusSchema,
} from "@/validators/timeline";
import { createUpdateSchema } from "@/validators/updates";
import { createFileMetadataSchema } from "@/validators/files";
import { createScopeItemSchema } from "@/validators/scope";
import planRoutes from "./plan.routes";
import {
  ensureMilestoneStartTriggered,
  ensureStatusCheckTriggered,
} from "@/services/whatsappService";

const projectIdSchema = z.string().uuid();
const taskIdSchema = z.string().uuid();
const routes = new Hono();

// ────────────────────── Mount plan sub-router ──────────────────────
routes.route("/", planRoutes);

// ────────────────────── Project CRUD ──────────────────────

routes.get("/", async (c) => {
  const user = requireUser(c);
  if (!user) return fail(c, "Unauthorized", 401);
  const parsed = paginationSchema.safeParse({
    page: c.req.query("page") || "1",
    limit: c.req.query("limit") || "10",
    q: c.req.query("q"),
    status: c.req.query("status"),
  });

  if (!parsed.success) {
    return validationError(c, parsed.error.format());
  }

  const result = await overviewService.listProjects(user.sub, parsed.data);
  await Promise.all(
    result.data.map((project) =>
      ensureStatusCheckTriggered(project.id, user.sub).catch(() => undefined),
    ),
  );

  return ok(c, result.data, {
    page: parsed.data.page,
    limit: parsed.data.limit,
    count: result.count,
  });
});

routes.post("/", async (c) => {
  const user = requireUser(c);
  if (!user) return fail(c, "Unauthorized", 401);

  const body = await c.req.json().catch(() => null);
  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(c, parsed.error.format());
  }

  try {
    const project = await overviewService.createProjectWithClient(
      user.sub,
      parsed.data,
    );
    return ok(c, project, null, 201);
  } catch (error) {
    return fail(
      c,
      error instanceof Error ? error.message : "Failed to create project",
      400,
    );
  }
});

routes.get("/:projectId/overview", async (c) => {
  const user = requireUser(c);
  if (!user) return fail(c, "Unauthorized", 401);
  const projectId = c.req.param("projectId");
  if (!projectIdSchema.safeParse(projectId).success) {
    return fail(c, "Invalid projectId", 400);
  }

  await ensureMilestoneStartTriggered(projectId, user.sub).catch(
    () => undefined,
  );
  await ensureStatusCheckTriggered(projectId, user.sub).catch(() => undefined);
  const project = await overviewService.getProjectOverview(user.sub, projectId);
  if (!project) {
    return fail(c, "Project not found", 404);
  }

  return ok(c, project);
});

routes.patch("/:projectId/overview", async (c) => {
  const user = requireUser(c);
  if (!user) return fail(c, "Unauthorized", 401);
  const projectId = c.req.param("projectId");
  const isOwned = await assertProjectOwned(user.sub, projectId);
  if (!isOwned) {
    return fail(c, "Project not found", 404);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = updateProjectOverviewSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(c, parsed.error.format());
  }

  const project = await overviewService.patchProjectOverview(
    user.sub,
    projectId,
    parsed.data,
  );
  return ok(c, project);
});

// ────────────────────── Timeline (legacy milestones/tasks) ──────────────────────

routes.get("/:projectId/timeline", async (c) => {
  const user = requireUser(c);
  if (!user) return fail(c, "Unauthorized", 401);
  const projectId = c.req.param("projectId");
  const isOwned = await assertProjectOwned(user.sub, projectId);
  if (!isOwned) {
    return fail(c, "Project not found", 404);
  }

  const result = await timelineService.getTimeline(projectId);
  return ok(c, result);
});

routes.post("/:projectId/timeline", async (c) => {
  const user = requireUser(c);
  if (!user) return fail(c, "Unauthorized", 401);
  const projectId = c.req.param("projectId");
  const isOwned = await assertProjectOwned(user.sub, projectId);
  if (!isOwned) {
    return fail(c, "Project not found", 404);
  }

  const body = await c.req.json().catch(() => null);
  if (body?.type === "milestone") {
    const parsed = createMilestoneSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(c, parsed.error.format());
    }
    const milestone = await timelineService.addMilestone(
      projectId,
      user.sub,
      parsed.data,
    );
    return ok(c, milestone, null, 201);
  }

  if (body?.type === "task") {
    const parsed = createTaskSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(c, parsed.error.format());
    }
    const task = await timelineService.addTask(
      projectId,
      user.sub,
      parsed.data,
    );
    return ok(c, task, null, 201);
  }

  return fail(c, "Invalid timeline item type", 400);
});

routes.patch("/:projectId/timeline/:taskId", async (c) => {
  const user = requireUser(c);
  if (!user) return fail(c, "Unauthorized", 401);
  const projectId = c.req.param("projectId");
  const taskId = c.req.param("taskId");
  if (!taskIdSchema.safeParse(taskId).success) {
    return fail(c, "Invalid taskId", 400);
  }

  const isOwned = await assertProjectOwned(user.sub, projectId);
  if (!isOwned) {
    return fail(c, "Project not found", 404);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = updateTaskStatusSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(c, parsed.error.format());
  }

  const task = await timelineService.patchTaskStatus(
    user.sub,
    taskId,
    parsed.data.status,
  );
  return ok(c, task);
});

// ────────────────────── Updates ──────────────────────

routes.get("/:projectId/updates", async (c) => {
  const user = requireUser(c);
  if (!user) return fail(c, "Unauthorized", 401);
  const projectId = c.req.param("projectId");
  const isOwned = await assertProjectOwned(user.sub, projectId);
  if (!isOwned) {
    return fail(c, "Project not found", 404);
  }

  return ok(c, await updatesService.getUpdates(projectId));
});

routes.post("/:projectId/updates", async (c) => {
  const user = requireUser(c);
  if (!user) return fail(c, "Unauthorized", 401);
  const projectId = c.req.param("projectId");
  const isOwned = await assertProjectOwned(user.sub, projectId);
  if (!isOwned) {
    return fail(c, "Project not found", 404);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = createUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(c, parsed.error.format());
  }

  return ok(
    c,
    await updatesService.addUpdate(projectId, user.sub, parsed.data),
    null,
    201,
  );
});

// ────────────────────── Files ──────────────────────

routes.get("/:projectId/files", async (c) => {
  const user = requireUser(c);
  if (!user) return fail(c, "Unauthorized", 401);
  const projectId = c.req.param("projectId");
  const isOwned = await assertProjectOwned(user.sub, projectId);
  if (!isOwned) {
    return fail(c, "Project not found", 404);
  }

  return ok(c, await filesService.getFiles(projectId, user.sub));
});

routes.post("/:projectId/files", async (c) => {
  const user = requireUser(c);
  if (!user) return fail(c, "Unauthorized", 401);
  const projectId = c.req.param("projectId");
  const isOwned = await assertProjectOwned(user.sub, projectId);
  if (!isOwned) {
    return fail(c, "Project not found", 404);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = createFileMetadataSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(c, parsed.error.format());
  }

  return ok(
    c,
    await filesService.addFile(projectId, user.sub, parsed.data),
    null,
    201,
  );
});

// ────────────────────── Scope ──────────────────────

routes.get("/:projectId/scope", async (c) => {
  const user = requireUser(c);
  if (!user) return fail(c, "Unauthorized", 401);
  const projectId = c.req.param("projectId");
  const isOwned = await assertProjectOwned(user.sub, projectId);
  if (!isOwned) {
    return fail(c, "Project not found", 404);
  }

  return ok(c, await scopeService.getScopeItems(projectId));
});

routes.post("/:projectId/scope", async (c) => {
  const user = requireUser(c);
  if (!user) return fail(c, "Unauthorized", 401);
  const projectId = c.req.param("projectId");
  const isOwned = await assertProjectOwned(user.sub, projectId);
  if (!isOwned) {
    return fail(c, "Project not found", 404);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = createScopeItemSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(c, parsed.error.format());
  }

  return ok(
    c,
    await scopeService.addScopeItem(projectId, user.sub, parsed.data),
    null,
    201,
  );
});

// ────────────────────── Closure ──────────────────────

routes.get("/:projectId/closure", async (c) => {
  const user = requireUser(c);
  if (!user) return fail(c, "Unauthorized", 401);
  const projectId = c.req.param("projectId");
  const isOwned = await assertProjectOwned(user.sub, projectId);
  if (!isOwned) {
    return fail(c, "Project not found", 404);
  }

  return ok(c, await closureService.getClosure(projectId));
});

routes.post("/:projectId/closure", async (c) => {
  const user = requireUser(c);
  if (!user) return fail(c, "Unauthorized", 401);
  const projectId = c.req.param("projectId");
  const isOwned = await assertProjectOwned(user.sub, projectId);
  if (!isOwned) {
    return fail(c, "Project not found", 404);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = z
    .object({ checklist_state: z.record(z.boolean()) })
    .safeParse(body);
  if (!parsed.success) {
    return validationError(c, parsed.error.format());
  }

  return ok(
    c,
    await closureService.upsertClosureState(
      user.sub,
      projectId,
      parsed.data.checklist_state,
    ),
  );
});

routes.post("/:projectId/closure/close", async (c) => {
  const user = requireUser(c);
  if (!user) return fail(c, "Unauthorized", 401);
  const projectId = c.req.param("projectId");
  const isOwned = await assertProjectOwned(user.sub, projectId);
  if (!isOwned) {
    return fail(c, "Project not found", 404);
  }

  return ok(c, await closureService.closeProject(user.sub, projectId));
});

routes.post("/:projectId/closure/drop", async (c) => {
  const user = requireUser(c);
  if (!user) return fail(c, "Unauthorized", 401);
  const projectId = c.req.param("projectId");
  const isOwned = await assertProjectOwned(user.sub, projectId);
  if (!isOwned) {
    return fail(c, "Project not found", 404);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = z.object({ reason: z.string().min(3) }).safeParse(body);
  if (!parsed.success) {
    return validationError(c, parsed.error.format());
  }

  return ok(
    c,
    await closureService.dropProject(user.sub, projectId, parsed.data.reason),
  );
});

// ────────────────────── Payments ──────────────────────

routes.get("/:projectId/payments", async (c) => {
  const user = requireUser(c);
  if (!user) return fail(c, "Unauthorized", 401);
  const projectId = c.req.param("projectId");
  const isOwned = await assertProjectOwned(user.sub, projectId);
  if (!isOwned) {
    return fail(c, "Project not found", 404);
  }

  const result = await db.query.payments.findMany({
    where: and(
      eq(payments.projectId, projectId),
      eq(payments.ownerId, user.sub),
    ),
    orderBy: [asc(payments.dueDate)],
  });
  return ok(c, result);
});

export default routes;
