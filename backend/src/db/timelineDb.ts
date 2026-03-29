import { db, milestones, tasks } from '@freelancer-os/db';
import { and, asc, eq } from 'drizzle-orm';

export async function getMilestones(projectId: string) {
  return db.query.milestones.findMany({
    where: eq(milestones.projectId, projectId),
    orderBy: [asc(milestones.dueDate)],
  });
}

export async function createMilestone(milestoneData: typeof milestones.$inferInsert) {
  const [created] = await db.insert(milestones).values(milestoneData).returning();
  return created;
}

export async function getTasks(projectId: string) {
  return db.query.tasks.findMany({
    where: eq(tasks.projectId, projectId),
    orderBy: [asc(tasks.dueDate)],
  });
}

export async function createTask(taskData: typeof tasks.$inferInsert) {
  const [created] = await db.insert(tasks).values(taskData).returning();
  return created;
}

export async function updateTask(
  userId: string,
  taskId: string,
  taskData: Partial<typeof tasks.$inferInsert>,
) {
  const [updated] = await db
    .update(tasks)
    .set(taskData)
    .where(and(eq(tasks.id, taskId), eq(tasks.ownerId, userId)))
    .returning();

  return updated ?? null;
}
