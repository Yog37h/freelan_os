// ✅ VERIFIED: Deliverable share confirmation flow remains intact while removing Drive-specific language. Manual test: complete the last task in a deliverable and confirm both popups appear with generic link-ready/share-now wording.
import * as React from "react";
import { Project } from "@/types";
import { TimelineBucketList } from "../timeline/TimelineBucketList";
import { BucketData, BucketTask } from "../timeline/BucketCard";
import {
  fetchPlanTimeline,
  reorderBuckets as reorderBucketsApi,
  updateBucket as updateBucketApi,
  addDeliverable as addDeliverableApi,
  updateDeliverable as updateDeliverableApi,
  deleteDeliverable as deleteDeliverableApi,
  addPlanTask as addPlanTaskApi,
  updatePlanTask as updatePlanTaskApi,
  deletePlanTask as deletePlanTaskApi,
  shareDeliverable as shareDeliverableApi,
} from "@/lib/api/planApi";
import { CheckCircle2, Loader2, LayoutGrid, Zap } from "lucide-react";
import { Button } from "../ui/Button";
import { Link } from "@/components/router/Link";
import { Dialog } from "../ui/Dialog";

interface TimelineTabProps {
  project: Project;
  projectId: string;
}

type DeliverableShareCandidate = {
  deliverableId: string;
  deliverableTitle: string;
};

export function TimelineTab({ project, projectId }: TimelineTabProps) {
  const [buckets, setBuckets] = React.useState<BucketData[]>([]);
  const [mode, setMode] = React.useState<"milestone" | "weekly">("milestone");
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasPlan, setHasPlan] = React.useState(false);
  const [completingTaskId, setCompletingTaskId] = React.useState<string | null>(
    null,
  );
  const [confirmTaskId, setConfirmTaskId] = React.useState<string | null>(null);
  const [deliverableReadyCheck, setDeliverableReadyCheck] =
    React.useState<DeliverableShareCandidate | null>(null);
  const [deliverableShareConfirm, setDeliverableShareConfirm] =
    React.useState<DeliverableShareCandidate | null>(null);
  const [isSharingDeliverable, setIsSharingDeliverable] = React.useState(false);
  const [shareError, setShareError] = React.useState<string | null>(null);

  const refreshTimeline = React.useCallback(async () => {
    const data = await fetchPlanTimeline(projectId);

    if (data.plan && data.buckets?.length > 0) {
      setHasPlan(true);
      setMode(data.plan.mode || "milestone");
      setBuckets(data.buckets.map(mapBucket));
      return;
    }

    setHasPlan(false);
    setBuckets([]);
  }, [projectId]);

  React.useEffect(() => {
    setIsLoading(true);
    refreshTimeline()
      .catch((error) => {
        console.error("Failed to load plan timeline:", error);
        setHasPlan(false);
      })
      .finally(() => setIsLoading(false));
  }, [refreshTimeline]);

  const handleReorderConfirm = async (order: string[], autoShift: boolean) => {
    await reorderBucketsApi(projectId, {
      bucket_order: order,
      auto_shift_dates: autoShift,
    });
    await refreshTimeline();
  };

  const handleBucketUpdate = async (
    bucketId: string,
    updates: Partial<BucketData>,
  ) => {
    await updateBucketApi(projectId, bucketId, {
      title: updates.title,
      start_date: updates.start_date,
      end_date: updates.end_date,
    });
    await refreshTimeline();
  };

  const handleAddDeliverable = async (bucketId: string, title: string) => {
    await addDeliverableApi(projectId, bucketId, {
      title,
      acceptance_criteria: [],
    });
    await refreshTimeline();
  };

  const handleRemoveDeliverable = async (
    bucketId: string,
    deliverableIndex: number,
  ) => {
    const bucket = buckets.find((candidate) => candidate.id === bucketId);
    if (!bucket) return;

    const deliverable = bucket.deliverables[deliverableIndex];
    if (deliverable?.id) {
      await deleteDeliverableApi(projectId, deliverable.id);
      await refreshTimeline();
    }
  };

  const handleUpdateDeliverable = async (
    bucketId: string,
    deliverableIndex: number,
    title: string,
  ) => {
    const bucket = buckets.find((candidate) => candidate.id === bucketId);
    if (!bucket) return;

    const deliverable = bucket.deliverables[deliverableIndex];
    if (deliverable?.id) {
      await updateDeliverableApi(projectId, deliverable.id, { title });
      await refreshTimeline();
    }
  };

  const handleAddTask = async (
    bucketId: string,
    title: string,
    dueDate: string,
    deliverableId?: string | null,
  ) => {
    await addPlanTaskApi(projectId, bucketId, {
      title,
      due_date: dueDate,
      deliverable_id: deliverableId ?? undefined,
    });
    await refreshTimeline();
  };

  const handleRemoveTask = async (bucketId: string, taskIndex: number) => {
    const bucket = buckets.find((candidate) => candidate.id === bucketId);
    if (!bucket) return;

    const task = bucket.tasks[taskIndex];
    if (task?.id) {
      await deletePlanTaskApi(projectId, task.id);
      await refreshTimeline();
    }
  };

  const handleUpdateTask = async (
    bucketId: string,
    taskIndex: number,
    updates: Partial<BucketTask>,
  ) => {
    const bucket = buckets.find((candidate) => candidate.id === bucketId);
    if (!bucket) return;

    const task = bucket.tasks[taskIndex];
    if (task?.id) {
      await updatePlanTaskApi(projectId, task.id, {
        title: updates.title,
        due_date: updates.due_date,
        status: updates.status as
          | "pending"
          | "in_progress"
          | "completed"
          | undefined,
      });
      await refreshTimeline();
    }
  };

  const immediateTask = React.useMemo(() => {
    const today = toDateKey(new Date());
    const tomorrow = toDateKey(addDays(new Date(), 1));

    const flattened = buckets.flatMap((bucket) =>
      bucket.tasks
        .filter((task) => task.status !== "completed")
        .map((task) => ({
          bucketTitle: bucket.title || bucket.label || "Current Bucket",
          task,
        })),
    );

    return (
      flattened.find(({ task }) => task.due_date === today) ||
      flattened.find(({ task }) => task.due_date === tomorrow) ||
      null
    );
  }, [buckets]);

  const findDeliverableCompletionCandidate = React.useCallback(
    (taskId: string) => {
      for (const bucket of buckets) {
        const currentTask = bucket.tasks.find((task) => task.id === taskId);
        if (!currentTask?.deliverable_id) {
          continue;
        }

        const relatedTasks = bucket.tasks.filter(
          (task) => task.deliverable_id === currentTask.deliverable_id,
        );

        if (
          relatedTasks.length > 0 &&
          relatedTasks.every(
            (task) => task.id === taskId || task.status === "completed",
          )
        ) {
          const deliverable = bucket.deliverables.find(
            (candidate) => candidate.id === currentTask.deliverable_id,
          );

          if (deliverable?.id) {
            return {
              deliverableId: deliverable.id,
              deliverableTitle: deliverable.title,
            };
          }
        }
      }

      return null;
    },
    [buckets],
  );

  const handleCompleteImmediateTask = async () => {
    if (!immediateTask?.task.id) return;
    setConfirmTaskId(immediateTask.task.id);
  };

  const confirmImmediateTask = async () => {
    if (!immediateTask?.task.id || confirmTaskId !== immediateTask.task.id) {
      return;
    }

    const shareCandidate = findDeliverableCompletionCandidate(
      immediateTask.task.id,
    );

    setCompletingTaskId(immediateTask.task.id);
    try {
      await updatePlanTaskApi(projectId, immediateTask.task.id, {
        status: "completed",
      });
      await refreshTimeline();

      if (shareCandidate) {
        setDeliverableReadyCheck(shareCandidate);
      }
    } finally {
      setCompletingTaskId(null);
      setConfirmTaskId(null);
    }
  };

  const confirmDeliverableReady = () => {
    if (!deliverableReadyCheck) return;
    setShareError(null);
    setDeliverableShareConfirm(deliverableReadyCheck);
    setDeliverableReadyCheck(null);
  };

  const handleShareDeliverable = async () => {
    if (!deliverableShareConfirm) return;

    setIsSharingDeliverable(true);
    setShareError(null);
    try {
      await shareDeliverableApi(
        projectId,
        deliverableShareConfirm.deliverableId,
      );
      setDeliverableShareConfirm(null);
    } catch (error: any) {
      setShareError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to share the deliverable right now.",
      );
    } finally {
      setIsSharingDeliverable(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="mr-3 animate-spin" size={20} />
        <span className="text-sm font-bold uppercase tracking-widest">
          Loading Timeline...
        </span>
      </div>
    );
  }

  if (!hasPlan) {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 py-24 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/5 text-muted-foreground/30">
          <LayoutGrid size={40} />
        </div>
        <div className="max-w-sm space-y-2">
          <h4 className="text-lg font-black uppercase tracking-tighter">
            No AI Timeline Yet
          </h4>
          <p className="text-sm font-medium text-muted-foreground">
            Generate an AI-powered timeline from your project PRD to get
            started.
          </p>
        </div>
        <Link to={`/projects/new?step=3&projectId=${projectId}`}>
          <Button
            variant="gradient"
            className="glow-blue rounded-xl px-8 font-black uppercase shadow-xl"
          >
            <Zap size={16} className="mr-2" /> Generate Timeline
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {immediateTask && (
        <div className="flex flex-col gap-4 rounded-[2rem] border border-primary/10 bg-primary/5 p-5 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-primary">
              {immediateTask.task.due_date === toDateKey(new Date())
                ? "Today's Task"
                : "Tomorrow Task"}
            </p>
            <h3 className="text-lg font-black tracking-tight">
              {immediateTask.task.title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {project.projectTitle} · {immediateTask.bucketTitle}
            </p>
          </div>
          <Button
            variant="secondary"
            className="rounded-xl border border-primary/12 bg-primary/8 font-black uppercase text-primary hover:bg-primary/12"
            onClick={handleCompleteImmediateTask}
            disabled={completingTaskId === immediateTask.task.id}
          >
            <CheckCircle2 size={16} className="mr-2" />
            {completingTaskId === immediateTask.task.id
              ? "Saving..."
              : "Mark as done"}
          </Button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-xl font-black uppercase tracking-tighter">
          Project Roadmap
        </h3>
      </div>

      <Dialog
        isOpen={!!confirmTaskId}
        onClose={() => {
          if (!completingTaskId) {
            setConfirmTaskId(null);
          }
        }}
        title="Mark Task as Done"
      >
        <p className="text-sm leading-relaxed text-muted-foreground">
          Confirm this task as completed to refresh milestone progress and move
          the deliverable checkpoint forward.
        </p>
        <div className="flex items-center justify-end gap-3">
          <Button
            variant="ghost"
            className="rounded-xl"
            onClick={() => setConfirmTaskId(null)}
            disabled={!!completingTaskId}
          >
            Cancel
          </Button>
          <Button
            variant="secondary"
            className="rounded-xl border border-primary/12 bg-primary/8 text-primary hover:bg-primary/12"
            onClick={confirmImmediateTask}
            disabled={!!completingTaskId}
          >
            {completingTaskId ? "Saving..." : "Mark as done"}
          </Button>
        </div>
      </Dialog>

      <Dialog
        isOpen={!!deliverableReadyCheck}
        onClose={() => setDeliverableReadyCheck(null)}
        title="Deliverable Ready Check"
      >
        <p className="text-sm leading-relaxed text-muted-foreground">
          Before we share{" "}
          <span className="font-bold text-foreground">
            {deliverableReadyCheck?.deliverableTitle}
          </span>
          , confirm that the deliverable link is ready and everything is
          client-ready.
        </p>
        <div className="flex items-center justify-end gap-3">
          <Button
            variant="ghost"
            className="rounded-xl"
            onClick={() => setDeliverableReadyCheck(null)}
          >
            Not yet
          </Button>
          <Button
            variant="gradient"
            className="rounded-xl font-black uppercase"
            onClick={confirmDeliverableReady}
          >
            Yes, ready
          </Button>
        </div>
      </Dialog>

      <Dialog
        isOpen={!!deliverableShareConfirm}
        onClose={() => {
          if (!isSharingDeliverable) {
            setDeliverableShareConfirm(null);
            setShareError(null);
          }
        }}
        title="Share Deliverable"
      >
        <p className="text-sm leading-relaxed text-muted-foreground">
          Can we share{" "}
          <span className="font-bold text-foreground">
            {deliverableShareConfirm?.deliverableTitle}
          </span>{" "}
          with the client now? This will send the WhatsApp deliverable template
          using the current deliverable link.
        </p>
        {shareError && <p className="text-xs text-rose-400">{shareError}</p>}
        <div className="flex items-center justify-end gap-3">
          <Button
            variant="ghost"
            className="rounded-xl"
            onClick={() => {
              setDeliverableShareConfirm(null);
              setShareError(null);
            }}
            disabled={isSharingDeliverable}
          >
            Cancel
          </Button>
          <Button
            variant="gradient"
            className="rounded-xl font-black uppercase"
            onClick={handleShareDeliverable}
            disabled={isSharingDeliverable}
          >
            {isSharingDeliverable ? "Sharing..." : "Share deliverable"}
          </Button>
        </div>
      </Dialog>

      <TimelineBucketList
        buckets={buckets}
        mode={mode}
        editable
        onReorderConfirm={handleReorderConfirm}
        onBucketUpdate={handleBucketUpdate}
        onAddDeliverable={handleAddDeliverable}
        onRemoveDeliverable={handleRemoveDeliverable}
        onUpdateDeliverable={handleUpdateDeliverable}
        onAddTask={handleAddTask}
        onRemoveTask={handleRemoveTask}
        onUpdateTask={handleUpdateTask}
      />
    </div>
  );
}

function mapBucket(bucket: any): BucketData {
  return {
    id: bucket.id,
    title: bucket.title,
    start_date: bucket.startDate || bucket.start_date,
    end_date: bucket.endDate || bucket.end_date,
    status: bucket.status,
    progressPercent: bucket.progressPercent ?? bucket.progress_percent ?? 0,
    currentDeliverableTitle:
      bucket.currentDeliverableTitle || bucket.current_deliverable_title || null,
    deliverables: (bucket.deliverables || []).map((deliverable: any) => ({
      id: deliverable.id,
      title: deliverable.title,
      acceptance_criteria:
        deliverable.acceptanceCriteria || deliverable.acceptance_criteria || [],
      status: deliverable.status,
      target_date: deliverable.targetDate || deliverable.target_date,
      task_count: deliverable.taskCount ?? deliverable.task_count,
      completed_task_count:
        deliverable.completedTaskCount ?? deliverable.completed_task_count,
    })),
    tasks: (bucket.tasks || []).map((task: any) => ({
      id: task.id,
      title: task.title,
      due_date: task.dueDate || task.due_date,
      status: task.status,
      deliverable_id: task.deliverableId || task.deliverable_id || null,
    })),
    sequence: (bucket.sequence || []).map((item: any) => ({
      type: item.type,
      id: item.id,
      title: item.title,
      due_date: item.dueDate || item.due_date || null,
      target_date: item.targetDate || item.target_date || null,
      status: item.status,
      deliverable_id: item.deliverableId || item.deliverable_id || null,
      task_count: item.taskCount ?? item.task_count,
      completed_task_count:
        item.completedTaskCount ?? item.completed_task_count,
    })),
  };
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}
