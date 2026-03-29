import {
  calendarQueue,
  db,
  messageTemplates,
  planBuckets,
  planDeliverables,
  planNotes,
  planTasks,
  projectPlans,
  projects,
} from '@freelancer-os/db';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import type { AITimelineOutput } from '@/validators/timeline';
import { getProjectScheduleState, inferDeliverableIndex } from './projectScheduleService';

function getBuckets(output: AITimelineOutput) {
  return output.mode === 'milestone' ? output.milestones : output.weeks;
}

export async function createDraftPlan(
  projectId: string,
  ownerId: string,
  mode: 'weekly' | 'milestone',
  model: string,
  previewJson: AITimelineOutput,
) {
  const [plan] = await db
    .insert(projectPlans)
    .values({
      projectId,
      ownerId,
      status: 'draft',
      mode,
      model,
      previewJson,
    })
    .returning();

  return plan;
}

export async function getDraftPlan(planId: string) {
  return db.query.projectPlans.findFirst({
    where: and(eq(projectPlans.id, planId), eq(projectPlans.status, 'draft')),
  });
}

export async function getLatestFinalPlan(projectId: string) {
  return db.query.projectPlans.findFirst({
    where: and(eq(projectPlans.projectId, projectId), eq(projectPlans.status, 'final')),
    orderBy: [desc(projectPlans.createdAt)],
  });
}

export async function confirmPlan(
  planId: string,
  projectId: string,
  ownerId: string,
  editedJson: AITimelineOutput,
) {
  const buckets = getBuckets(editedJson);

  for (let i = 0; i < buckets.length; i += 1) {
    const bucket = buckets[i];

    const [createdBucket] = await db
      .insert(planBuckets)
      .values({
        planId,
        projectId,
        ownerId,
        type: editedJson.mode === 'milestone' ? 'milestone' : 'week',
        orderIndex: i,
        title: bucket.title || bucket.label || `Bucket ${i + 1}`,
        startDate: bucket.start_date,
        endDate: bucket.end_date,
      })
      .returning();

    const createdDeliverables = bucket.deliverables?.length
      ? await db.insert(planDeliverables).values(
          bucket.deliverables.map((deliverable, deliverableIndex) => ({
            bucketId: createdBucket.id,
            planId,
            projectId,
            ownerId,
            orderIndex: deliverableIndex,
            title: deliverable.title,
            acceptanceCriteria: deliverable.acceptance_criteria || [],
          })),
        ).returning()
      : [];

    if (bucket.deliverables?.length) {
      // Deliverables are inserted above so tasks can be linked to them.
    }

    if (bucket.tasks?.length) {
      const insertedTasks = await db
        .insert(planTasks)
        .values(
          bucket.tasks.map((task, taskIndex) => {
            const deliverableIndex = inferDeliverableIndex(
              taskIndex,
              bucket.tasks.length,
              createdDeliverables.length,
            );

            return {
              bucketId: createdBucket.id,
              deliverableId: createdDeliverables[deliverableIndex]?.id ?? null,
              planId,
              projectId,
              ownerId,
              orderIndex: taskIndex,
              title: task.title,
              dueDate: task.due_date,
              status: 'pending',
            };
          }),
        )
        .returning({
          id: planTasks.id,
          title: planTasks.title,
          dueDate: planTasks.dueDate,
        });

      const now = new Date();
      const thirtyDaysOut = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const queueRows = insertedTasks
        .filter((task) => task.dueDate && new Date(task.dueDate) <= thirtyDaysOut)
        .map((task) => ({
          projectId,
          ownerId,
          taskId: task.id,
          bucketId: createdBucket.id,
          title: task.title,
          scheduledFor: task.dueDate!,
          status: 'pending',
          retryCount: 0,
        }));

      if (queueRows.length) {
        await db.insert(calendarQueue).values(queueRows);
      }
    }

    const noteRows = [
      ...(bucket.assumptions || []).map((text) => ({
        bucketId: createdBucket.id,
        planId,
        projectId,
        ownerId,
        noteType: 'assumption',
        text,
      })),
      ...(bucket.risks || []).map((text) => ({
        bucketId: createdBucket.id,
        planId,
        projectId,
        ownerId,
        noteType: 'risk',
        text,
      })),
    ];

    if (noteRows.length) {
      await db.insert(planNotes).values(noteRows);
    }
  }

  if (editedJson.message_templates) {
    const templateRows = Object.entries(editedJson.message_templates)
      .filter(([, value]) => typeof value === 'string' && value.length > 0)
      .map(([type, content]) => ({
        planId,
        projectId,
        ownerId,
        type,
        content: content as string,
      }));

    if (templateRows.length) {
      await db.insert(messageTemplates).values(templateRows);
    }
  }

  await db
    .update(projectPlans)
    .set({
      status: 'final',
      previewJson: editedJson,
      updatedAt: new Date(),
    })
    .where(eq(projectPlans.id, planId));

  return { success: true };
}

export async function getFullTimeline(projectId: string) {
  const plan = await getLatestFinalPlan(projectId);
  if (!plan) {
    return { plan: null, buckets: [] };
  }

  const schedule = await getProjectScheduleState(projectId);
  const bucketIds = schedule.buckets.map((bucket) => bucket.id);
  const notes = bucketIds.length
    ? await db.query.planNotes.findMany({
        where: inArray(planNotes.bucketId, bucketIds),
      })
    : [];
  const notesByBucket = groupBy(notes, 'bucketId');

  return {
    plan,
    summary: {
      progressPercent: schedule.progressPercent,
      onTimeCompletionRate: schedule.onTimeCompletionRate,
      scheduleState: schedule.scheduleState,
      scheduleLabel: schedule.scheduleLabel,
      nextMilestoneName: schedule.nextMilestoneName,
      nextDeadlineDate: schedule.nextDeadlineDate,
      projectStarted: schedule.projectStarted,
    },
    buckets: schedule.buckets.map((bucket) => ({
      ...bucket,
      notes: notesByBucket[bucket.id] || [],
    })),
  };
}

function groupBy<T extends Record<string, unknown>>(rows: T[], key: keyof T) {
  return rows.reduce<Record<string, T[]>>((acc, row) => {
    const bucketKey = String(row[key]);
    if (!acc[bucketKey]) {
      acc[bucketKey] = [];
    }
    acc[bucketKey].push(row);
    return acc;
  }, {});
}

export async function reorderBuckets(
  planId: string,
  projectId: string,
  bucketOrder: string[],
  autoShiftDates: boolean,
) {
  const currentBuckets = await db.query.planBuckets.findMany({
    where: eq(planBuckets.planId, planId),
    orderBy: [asc(planBuckets.orderIndex)],
  });

  if (!currentBuckets.length) {
    return { success: false, error: 'No buckets found' };
  }

  const bucketMap = new Map(currentBuckets.map((bucket) => [bucket.id, bucket]));

  let runningDate: Date | null = null;
  if (autoShiftDates) {
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, projectId),
      columns: { startDate: true },
    });
    runningDate = project?.startDate ? new Date(project.startDate) : null;
  }

  for (let i = 0; i < bucketOrder.length; i += 1) {
    const bucketId = bucketOrder[i];
    const bucket = bucketMap.get(bucketId);

    if (!bucket) {
      continue;
    }

    const updateData: Partial<typeof planBuckets.$inferInsert> & { orderIndex: number } = {
      orderIndex: i,
    };

    if (autoShiftDates && runningDate && bucket.startDate && bucket.endDate) {
      const bucketStart = new Date(bucket.startDate);
      const bucketEnd = new Date(bucket.endDate);
      const duration =
        Math.ceil((bucketEnd.getTime() - bucketStart.getTime()) / (1000 * 60 * 60 * 24)) || 0;

      const newStart = new Date(runningDate);
      const newEnd = new Date(runningDate);
      newEnd.setDate(newEnd.getDate() + duration);

      updateData.startDate = newStart.toISOString().slice(0, 10);
      updateData.endDate = newEnd.toISOString().slice(0, 10);

      runningDate = new Date(newEnd);
      runningDate.setDate(runningDate.getDate() + 1);
    }

    await db.update(planBuckets).set(updateData).where(eq(planBuckets.id, bucketId));
  }

  return { success: true };
}

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(userId: string, maxPerDay = 5) {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 24 * 60 * 60 * 1000 });
    return true;
  }

  if (entry.count >= maxPerDay) {
    return false;
  }

  entry.count += 1;
  return true;
}
