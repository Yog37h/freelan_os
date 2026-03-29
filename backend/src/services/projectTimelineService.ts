import * as timelineDb from '@/db/timelineDb';

export async function getTimeline(projectId: string) {
  const [milestones, tasks] = await Promise.all([
    timelineDb.getMilestones(projectId),
    timelineDb.getTasks(projectId),
  ]);

  return { milestones, tasks };
}

export async function addMilestone(
  projectId: string,
  ownerId: string,
  data: Record<string, unknown>,
) {
  return timelineDb.createMilestone({
    ...(data as {
      name: string;
      dueDate?: string;
      status?: string;
    }),
    projectId,
    ownerId,
  });
}

export async function addTask(
  projectId: string,
  ownerId: string,
  data: Record<string, unknown>,
) {
  return timelineDb.createTask({
    ...(data as {
      title: string;
      dueDate?: string;
      status?: string;
      milestoneId?: string;
    }),
    projectId,
    ownerId,
  });
}

export async function patchTaskStatus(userId: string, taskId: string, status: string) {
  return timelineDb.updateTask(userId, taskId, { status });
}
