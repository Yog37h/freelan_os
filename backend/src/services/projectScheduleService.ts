import {
  db,
  planBuckets,
  planDeliverables,
  planTasks,
  projectPlans,
  projects,
  whatsappMessages,
} from '@freelancer-os/db';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';

type PlanBucketRow = typeof planBuckets.$inferSelect;
type PlanDeliverableRow = typeof planDeliverables.$inferSelect;
type PlanTaskRow = typeof planTasks.$inferSelect;
type ProjectRow = typeof projects.$inferSelect;

export interface DeliverableCheckpoint {
  id: string;
  bucketId: string;
  title: string;
  orderIndex: number;
  acceptanceCriteria: string[];
  targetDate: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  taskCount: number;
  completedTaskCount: number;
}

export interface TimelineSequenceTaskItem {
  type: 'task';
  id: string;
  bucketId: string;
  deliverableId: string | null;
  title: string;
  dueDate: string | null;
  status: string;
}

export interface TimelineSequenceDeliverableItem {
  type: 'deliverable';
  id: string;
  bucketId: string;
  title: string;
  targetDate: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  taskCount: number;
  completedTaskCount: number;
}

export type TimelineSequenceItem = TimelineSequenceTaskItem | TimelineSequenceDeliverableItem;

export interface BucketExecutionState {
  id: string;
  title: string;
  type: string;
  orderIndex: number;
  startDate: string | null;
  endDate: string | null;
  isUnlocked: boolean;
  isCompleted: boolean;
  status: 'locked' | 'upcoming' | 'in_progress' | 'completed' | 'delayed';
  progressPercent: number;
  completedTaskCount: number;
  totalTaskCount: number;
  completedDeliverableCount: number;
  totalDeliverableCount: number;
  currentDeliverableTitle: string | null;
  deliverables: DeliverableCheckpoint[];
  tasks: PlanTaskRow[];
  sequence: TimelineSequenceItem[];
}

export interface ProjectScheduleState {
  planId: string | null;
  mode: 'milestone' | 'weekly' | null;
  startDate: string | null;
  deadline: string | null;
  hasTimeline: boolean;
  projectStarted: boolean;
  hasGetStartedConfirmation: boolean;
  firstMilestoneReady: boolean;
  progressPercent: number;
  onTimeCompletionRate: number | null;
  scheduleState: 'not_started' | 'ahead' | 'on_track' | 'behind' | 'completed';
  scheduleLabel: string;
  completedTaskCount: number;
  totalTaskCount: number;
  completedMilestoneCount: number;
  totalMilestoneCount: number;
  activeBucket: BucketExecutionState | null;
  nextBucket: BucketExecutionState | null;
  buckets: BucketExecutionState[];
  nextMilestoneName: string;
  nextDeadlineDate: string | 'Completed' | null;
  status: string;
}

interface TimelineGraph {
  plan: typeof projectPlans.$inferSelect | null;
  project: ProjectRow | null;
  buckets: PlanBucketRow[];
  deliverables: PlanDeliverableRow[];
  tasks: PlanTaskRow[];
  hasGetStartedConfirmation: boolean;
  hasMilestoneStartMessage: boolean;
}

export async function getProjectScheduleState(projectId: string): Promise<ProjectScheduleState> {
  const graph = await getTimelineGraph(projectId);
  const todayKey = toDateKey(new Date());

  if (!graph.project) {
    return buildEmptyState(null, null);
  }

  if (!graph.plan || graph.buckets.length === 0) {
    return buildEmptyState(graph.project.startDate, graph.project.deadline, {
      hasGetStartedConfirmation: graph.hasGetStartedConfirmation,
      projectStarted: graph.hasGetStartedConfirmation || graph.hasMilestoneStartMessage,
      explicitStatus: graph.project.status,
    });
  }

  const buckets = decorateBuckets(graph.buckets, graph.deliverables, graph.tasks, todayKey);
  const completedTaskCount = graph.tasks.filter((task) => task.status === 'completed').length;
  const totalTaskCount = graph.tasks.length;
  const totalMilestoneCount = buckets.length;
  const completedMilestoneCount = buckets.filter((bucket) => bucket.isCompleted).length;

  const totalUnits = buckets.reduce((sum, bucket) => {
    return sum + Math.max(bucket.sequence.length, bucket.tasks.length || bucket.deliverables.length || 1);
  }, 0);

  const completedUnits = buckets.reduce((sum, bucket) => {
    return (
      sum +
      bucket.sequence.filter((item) => {
        if (item.type === 'task') {
          return item.status === 'completed';
        }
        return item.status === 'completed';
      }).length
    );
  }, 0);

  const expectedUnitsByNow = buckets.reduce((sum, bucket) => {
    return (
      sum +
      bucket.sequence.filter((item) => {
        const targetDate = item.type === 'task' ? item.dueDate : item.targetDate;
        return !!targetDate && targetDate <= todayKey;
      }).length
    );
  }, 0);

  const progressPercent = totalUnits > 0 ? Math.min(100, Math.round((completedUnits / totalUnits) * 100)) : 0;
  const onTimeCompletionRate =
    expectedUnitsByNow > 0 ? Math.round((completedUnits / expectedUnitsByNow) * 100) : null;

  const activeBucket = buckets.find((bucket) => bucket.isUnlocked && !bucket.isCompleted) ?? null;
  const nextBucket = activeBucket ?? buckets.find((bucket) => !bucket.isCompleted) ?? null;
  const projectStarted =
    graph.hasGetStartedConfirmation ||
    graph.hasMilestoneStartMessage ||
    graph.tasks.some((task) => task.status !== 'pending');
  const firstMilestoneReady = !!buckets[0] && (!buckets[0].startDate || buckets[0].startDate <= todayKey);

  const scheduleState = resolveScheduleState({
    completedUnits,
    totalUnits,
    onTimeCompletionRate,
    projectStarted,
    nextBucket,
  });
  const explicitProjectStatus = graph.project.status;
  const effectiveStatus = resolveEffectiveProjectStatus(
    explicitProjectStatus,
    scheduleStateToProjectStatus(scheduleState),
  );

  return {
    planId: graph.plan.id,
    mode: graph.plan.mode as 'milestone' | 'weekly',
    startDate: graph.project.startDate,
    deadline: graph.project.deadline,
    hasTimeline: true,
    projectStarted,
    hasGetStartedConfirmation: graph.hasGetStartedConfirmation,
    firstMilestoneReady,
    progressPercent,
    onTimeCompletionRate,
    scheduleState,
    scheduleLabel: scheduleStateToLabel(scheduleState),
    completedTaskCount,
    totalTaskCount,
    completedMilestoneCount,
    totalMilestoneCount,
    activeBucket,
    nextBucket,
    buckets,
    nextMilestoneName: getNextMilestoneName(nextBucket, completedMilestoneCount, totalMilestoneCount),
    nextDeadlineDate: getNextDeadlineDate(nextBucket, completedMilestoneCount, totalMilestoneCount),
    status: effectiveStatus,
  };
}

export function inferDeliverableIndex(taskIndex: number, tasksCount: number, deliverablesCount: number) {
  if (deliverablesCount <= 0 || tasksCount <= 0) return -1;
  return Math.min(deliverablesCount - 1, Math.floor((taskIndex * deliverablesCount) / tasksCount));
}

async function getTimelineGraph(projectId: string): Promise<TimelineGraph> {
  const [project, plan, messages] = await Promise.all([
    db.query.projects.findFirst({
      where: eq(projects.id, projectId),
    }),
    db.query.projectPlans.findFirst({
      where: and(eq(projectPlans.projectId, projectId), eq(projectPlans.status, 'final')),
      orderBy: [desc(projectPlans.createdAt)],
    }),
    db.query.whatsappMessages.findMany({
      where: eq(whatsappMessages.projectId, projectId),
      orderBy: [desc(whatsappMessages.createdAt)],
      columns: {
        campaignName: true,
        templateName: true,
        content: true,
        direction: true,
        messageType: true,
      },
    }),
  ]);

  if (!plan) {
    return {
      project: project ?? null,
      plan: null,
      buckets: [],
      deliverables: [],
      tasks: [],
      hasGetStartedConfirmation: hasGetStartedReply(messages),
      hasMilestoneStartMessage: hasMilestoneStart(messages),
    };
  }

  const buckets = await db.query.planBuckets.findMany({
    where: eq(planBuckets.planId, plan.id),
    orderBy: [asc(planBuckets.orderIndex)],
  });

  if (!buckets.length) {
    return {
      project: project ?? null,
      plan,
      buckets: [],
      deliverables: [],
      tasks: [],
      hasGetStartedConfirmation: hasGetStartedReply(messages),
      hasMilestoneStartMessage: hasMilestoneStart(messages),
    };
  }

  const bucketIds = buckets.map((bucket) => bucket.id);
  const [deliverables, tasks] = await Promise.all([
    db.query.planDeliverables.findMany({
      where: inArray(planDeliverables.bucketId, bucketIds),
      orderBy: [asc(planDeliverables.orderIndex)],
    }),
    db.query.planTasks.findMany({
      where: inArray(planTasks.bucketId, bucketIds),
      orderBy: [asc(planTasks.orderIndex)],
    }),
  ]);

  return {
    project: project ?? null,
    plan,
    buckets,
    deliverables,
    tasks,
    hasGetStartedConfirmation: hasGetStartedReply(messages),
    hasMilestoneStartMessage: hasMilestoneStart(messages),
  };
}

function decorateBuckets(
  buckets: PlanBucketRow[],
  deliverables: PlanDeliverableRow[],
  tasks: PlanTaskRow[],
  todayKey: string,
) {
  const deliverablesByBucket = groupBy(deliverables, 'bucketId');
  const tasksByBucket = groupBy(tasks, 'bucketId');
  let previousComplete = true;

  return buckets.map((bucket) => {
    const bucketDeliverables = sortByOrder(deliverablesByBucket[bucket.id] || []);
    const bucketTasks = sortTasks(tasksByBucket[bucket.id] || []);
    const sequence: TimelineSequenceItem[] = [];
    const deliverableStates: DeliverableCheckpoint[] = [];
    const deliverableAssignments = assignTasksToDeliverables(bucketDeliverables, bucketTasks);

    bucketDeliverables.forEach((deliverable) => {
      const assignedTasks = deliverableAssignments.get(deliverable.id) || [];
      assignedTasks.forEach((task) => {
        sequence.push({
          type: 'task',
          id: task.id,
          bucketId: bucket.id,
          deliverableId: deliverable.id,
          title: task.title,
          dueDate: task.dueDate,
          status: task.status,
        });
      });

      const completedTaskCount = assignedTasks.filter((task) => task.status === 'completed').length;
      const status =
        assignedTasks.length > 0
          ? completedTaskCount === assignedTasks.length
            ? 'completed'
            : completedTaskCount > 0
              ? 'in_progress'
              : 'pending'
          : bucketTasks.every((task) => task.status === 'completed') && bucketTasks.length > 0
            ? 'completed'
            : 'pending';

      const checkpoint: DeliverableCheckpoint = {
        id: deliverable.id,
        bucketId: bucket.id,
        title: deliverable.title,
        orderIndex: deliverable.orderIndex,
        acceptanceCriteria: deliverable.acceptanceCriteria ?? [],
        targetDate: assignedTasks.at(-1)?.dueDate ?? bucket.endDate ?? null,
        status,
        taskCount: assignedTasks.length,
        completedTaskCount,
      };

      deliverableStates.push(checkpoint);
      sequence.push({
        type: 'deliverable',
        id: deliverable.id,
        bucketId: bucket.id,
        title: deliverable.title,
        targetDate: checkpoint.targetDate,
        status,
        taskCount: checkpoint.taskCount,
        completedTaskCount: checkpoint.completedTaskCount,
      });
    });

    if (bucketDeliverables.length === 0) {
      bucketTasks.forEach((task) => {
        sequence.push({
          type: 'task',
          id: task.id,
          bucketId: bucket.id,
          deliverableId: task.deliverableId ?? null,
          title: task.title,
          dueDate: task.dueDate,
          status: task.status,
        });
      });
    }

    const completedTaskCount = bucketTasks.filter((task) => task.status === 'completed').length;
    const totalTaskCount = bucketTasks.length;
    const completedDeliverableCount = deliverableStates.filter(
      (deliverable) => deliverable.status === 'completed',
    ).length;
    const totalDeliverableCount = deliverableStates.length;

    const totalUnits = Math.max(sequence.length, totalTaskCount || totalDeliverableCount || 1);
    const completedUnits = sequence.filter((item) => item.status === 'completed').length;
    const isCompleted =
      totalUnits > 0 &&
      ((totalTaskCount > 0 && completedTaskCount === totalTaskCount) ||
        (totalDeliverableCount > 0 && completedDeliverableCount === totalDeliverableCount));

    const status = !previousComplete
      ? 'locked'
      : isCompleted
        ? 'completed'
        : bucket.endDate && bucket.endDate < todayKey
          ? 'delayed'
          : completedUnits > 0
            ? 'in_progress'
            : 'upcoming';

    const currentDeliverableTitle =
      deliverableStates.find((deliverable) => deliverable.status !== 'completed')?.title ?? null;

    const executionState: BucketExecutionState = {
      id: bucket.id,
      title: bucket.title,
      type: bucket.type,
      orderIndex: bucket.orderIndex,
      startDate: bucket.startDate,
      endDate: bucket.endDate,
      isUnlocked: previousComplete,
      isCompleted,
      status,
      progressPercent:
        totalUnits > 0 ? Math.min(100, Math.round((completedUnits / totalUnits) * 100)) : 0,
      completedTaskCount,
      totalTaskCount,
      completedDeliverableCount,
      totalDeliverableCount,
      currentDeliverableTitle,
      deliverables: deliverableStates,
      tasks: bucketTasks,
      sequence,
    };

    previousComplete = isCompleted;
    return executionState;
  });
}

function assignTasksToDeliverables(deliverables: PlanDeliverableRow[], tasks: PlanTaskRow[]) {
  const assignments = new Map<string, PlanTaskRow[]>();

  if (deliverables.length === 0) {
    return assignments;
  }

  const deliverableIdSet = new Set(deliverables.map((deliverable) => deliverable.id));
  const indexedDeliverables = sortByOrder(deliverables);
  const tasksCount = tasks.length;

  tasks.forEach((task, taskIndex) => {
    const directDeliverableId =
      task.deliverableId && deliverableIdSet.has(task.deliverableId) ? task.deliverableId : null;
    const fallbackDeliverable =
      directDeliverableId
        ? null
        : indexedDeliverables[inferDeliverableIndex(taskIndex, tasksCount, indexedDeliverables.length)];
    const deliverableId = directDeliverableId ?? fallbackDeliverable?.id ?? null;

    if (!deliverableId) return;

    if (!assignments.has(deliverableId)) {
      assignments.set(deliverableId, []);
    }

    assignments.get(deliverableId)!.push(task);
  });

  return assignments;
}

function buildEmptyState(
  startDate: string | null,
  deadline: string | null,
  overrides?: Partial<ProjectScheduleState> & { explicitStatus?: string | null },
): ProjectScheduleState {
  const projectStarted = overrides?.projectStarted ?? false;
  const explicitStatus = overrides?.explicitStatus ?? null;
  const defaultStatus = projectStarted ? 'On Track' : 'Not Yet Started';
  return {
    planId: null,
    mode: null,
    startDate,
    deadline,
    hasTimeline: false,
    projectStarted,
    hasGetStartedConfirmation: overrides?.hasGetStartedConfirmation ?? false,
    firstMilestoneReady: false,
    progressPercent: 0,
    onTimeCompletionRate: null,
    scheduleState: projectStarted ? 'on_track' : 'not_started',
    scheduleLabel: projectStarted ? 'On track' : 'Not yet started',
    completedTaskCount: 0,
    totalTaskCount: 0,
    completedMilestoneCount: 0,
    totalMilestoneCount: 0,
    activeBucket: null,
    nextBucket: null,
    buckets: [],
    nextMilestoneName: 'Timeline not confirmed',
    nextDeadlineDate: deadline,
    status: resolveEffectiveProjectStatus(explicitStatus, defaultStatus),
  };
}

function resolveScheduleState(params: {
  completedUnits: number;
  totalUnits: number;
  onTimeCompletionRate: number | null;
  projectStarted: boolean;
  nextBucket: BucketExecutionState | null;
}) {
  const { completedUnits, totalUnits, onTimeCompletionRate, projectStarted, nextBucket } = params;

  if (totalUnits > 0 && completedUnits >= totalUnits) {
    return 'completed';
  }

  if (!projectStarted) {
    return 'not_started';
  }

  if (nextBucket?.status === 'delayed') {
    return 'behind';
  }

  if (onTimeCompletionRate === null) {
    return 'on_track';
  }

  if (onTimeCompletionRate >= 110) {
    return 'ahead';
  }

  if (onTimeCompletionRate < 90) {
    return 'behind';
  }

  return 'on_track';
}

function scheduleStateToLabel(state: ProjectScheduleState['scheduleState']) {
  switch (state) {
    case 'not_started':
      return 'Not yet started';
    case 'ahead':
      return 'Ahead of schedule';
    case 'behind':
      return 'Behind schedule';
    case 'completed':
      return 'Completed';
    default:
      return 'On track';
  }
}

function scheduleStateToProjectStatus(state: ProjectScheduleState['scheduleState']) {
  switch (state) {
    case 'not_started':
      return 'Not Yet Started';
    case 'ahead':
      return 'Ahead of Schedule';
    case 'behind':
      return 'Delayed';
    case 'completed':
      return 'Completed';
    default:
      return 'On Track';
  }
}

function resolveEffectiveProjectStatus(
  storedStatus: string | null,
  derivedStatus: string,
) {
  if (
    storedStatus === 'Completed' ||
    storedStatus === 'Drop Pending Ack' ||
    storedStatus === 'Dropped'
  ) {
    return storedStatus;
  }

  return derivedStatus;
}

function getNextMilestoneName(
  nextBucket: BucketExecutionState | null,
  completedMilestoneCount: number,
  totalMilestoneCount: number,
) {
  if (nextBucket) {
    return nextBucket.title || 'Current milestone';
  }

  if (totalMilestoneCount > 0 && completedMilestoneCount === totalMilestoneCount) {
    return 'All milestones completed';
  }

  return 'Project Timeline';
}

function getNextDeadlineDate(
  nextBucket: BucketExecutionState | null,
  completedMilestoneCount: number,
  totalMilestoneCount: number,
) {
  if (nextBucket?.endDate) {
    return nextBucket.endDate;
  }

  if (totalMilestoneCount > 0 && completedMilestoneCount === totalMilestoneCount) {
    return 'Completed';
  }

  return null;
}

function hasGetStartedReply(
  messages: Array<{
    campaignName: string | null;
    templateName: string | null;
    content: string | null;
    direction: string | null;
  }>,
) {
  return messages.some((message) => {
    if (message.direction !== 'incoming') return false;
    const combined = `${message.campaignName ?? ''} ${message.templateName ?? ''} ${message.content ?? ''}`.toLowerCase();
    return combined.includes('project_started_inbound') || combined.includes('get started');
  });
}

function hasMilestoneStart(
  messages: Array<{
    campaignName: string | null;
    templateName: string | null;
    content: string | null;
    messageType?: string | null;
  }>,
) {
  return messages.some((message) => {
    const combined = `${message.campaignName ?? ''} ${message.templateName ?? ''} ${message.content ?? ''}`.toLowerCase();
    return combined.includes('milestone_start');
  });
}

function groupBy<T extends Record<string, unknown>>(rows: T[], key: keyof T) {
  return rows.reduce<Record<string, T[]>>((acc, row) => {
    const value = String(row[key]);
    if (!acc[value]) {
      acc[value] = [];
    }
    acc[value].push(row);
    return acc;
  }, {});
}

function sortByOrder<T extends { orderIndex: number }>(rows: T[]) {
  return [...rows].sort((a, b) => a.orderIndex - b.orderIndex);
}

function sortTasks(rows: PlanTaskRow[]) {
  return [...rows].sort((a, b) => {
    const dateA = a.dueDate ?? '9999-12-31';
    const dateB = b.dueDate ?? '9999-12-31';

    if (dateA !== dateB) {
      return dateA.localeCompare(dateB);
    }

    return a.orderIndex - b.orderIndex;
  });
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
