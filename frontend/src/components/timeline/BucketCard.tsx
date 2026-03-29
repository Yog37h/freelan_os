"use client";

import * as React from "react";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { InlineEditableText } from "./InlineEditableText";
import { DateRangeEditor } from "./DateRangeEditor";
import { Dialog } from "../ui/Dialog";
import {
  ChevronDown,
  ChevronRight,
  Trash2,
  Plus,
  GripVertical,
  Pencil,
  CheckCircle2,
} from "lucide-react";

export interface BucketDeliverable {
  temp_id?: string;
  id?: string;
  title: string;
  acceptance_criteria: string[];
  status?: "pending" | "in_progress" | "completed";
  target_date?: string | null;
  task_count?: number;
  completed_task_count?: number;
}

export interface BucketTask {
  temp_id?: string;
  id?: string;
  title: string;
  due_date: string;
  status?: string;
  deliverable_id?: string | null;
}

export interface BucketSequenceItem {
  type: "task" | "deliverable";
  id?: string;
  deliverable_id?: string | null;
  title: string;
  due_date?: string | null;
  target_date?: string | null;
  status?: string;
  task_count?: number;
  completed_task_count?: number;
}

export interface BucketData {
  temp_id?: string;
  id?: string;
  title?: string;
  label?: string;
  start_date: string;
  end_date: string;
  deliverables: BucketDeliverable[];
  tasks: BucketTask[];
  assumptions?: string[];
  risks?: string[];
  status?: "locked" | "upcoming" | "in_progress" | "completed" | "delayed";
  progressPercent?: number;
  currentDeliverableTitle?: string | null;
  sequence?: BucketSequenceItem[];
}

interface BucketCardProps {
  bucket: BucketData;
  index: number;
  mode: "milestone" | "weekly";
  editable?: boolean;
  onUpdate?: (updates: Partial<BucketData>) => void;
  onAddDeliverable?: (title: string) => void;
  onRemoveDeliverable?: (index: number) => void;
  onUpdateDeliverable?: (index: number, title: string) => void;
  onAddTask?: (
    title: string,
    dueDate: string,
    deliverableId?: string | null,
  ) => void;
  onRemoveTask?: (index: number) => void;
  onUpdateTask?: (index: number, updates: Partial<BucketTask>) => void;
  dragHandleProps?: Record<string, unknown>;
}

export function BucketCard({
  bucket,
  index,
  mode,
  editable = true,
  onUpdate,
  onAddTask,
  onRemoveTask,
  onUpdateTask,
  dragHandleProps,
}: BucketCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isEditMode, setIsEditMode] = React.useState(false);
  const [showAddTaskDialog, setShowAddTaskDialog] = React.useState(false);
  const [newTaskTitle, setNewTaskTitle] = React.useState("");
  const [newTaskDate, setNewTaskDate] = React.useState(bucket.start_date);
  const [newTaskDeliverableId, setNewTaskDeliverableId] = React.useState<
    string | ""
  >(bucket.deliverables[0]?.id || "");
  const [taskFormError, setTaskFormError] = React.useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<{
    index: number;
    title: string;
  } | null>(null);

  const sequenceItems = React.useMemo(
    () => buildSequenceItems(bucket),
    [bucket],
  );
  const executionGroups = React.useMemo(
    () => buildExecutionGroups(sequenceItems),
    [sequenceItems],
  );

  const displayTitle =
    bucket.title ||
    bucket.label ||
    `${mode === "milestone" ? "Milestone" : "Week"} ${index + 1}`;

  React.useEffect(() => {
    setNewTaskDate(bucket.start_date);
    setNewTaskDeliverableId(bucket.deliverables[0]?.id || "");
  }, [bucket.start_date, bucket.deliverables]);

  const openTaskDialog = (event: React.MouseEvent) => {
    event.stopPropagation();
    setTaskFormError(null);
    setShowAddTaskDialog(true);
  };

  const handleAddTask = () => {
    const trimmedTitle = newTaskTitle.trim();
    if (!trimmedTitle || !onAddTask) {
      return;
    }

    if (bucket.deliverables.length > 0 && !newTaskDeliverableId) {
      setTaskFormError("Choose the deliverable this task belongs to.");
      return;
    }

    onAddTask(trimmedTitle, newTaskDate, newTaskDeliverableId || null);
    setNewTaskTitle("");
    setNewTaskDate(bucket.start_date);
    setNewTaskDeliverableId(bucket.deliverables[0]?.id || "");
    setTaskFormError(null);
    setShowAddTaskDialog(false);
  };

  const handleCancelTask = () => {
    setNewTaskTitle("");
    setNewTaskDate(bucket.start_date);
    setNewTaskDeliverableId(bucket.deliverables[0]?.id || "");
    setTaskFormError(null);
    setShowAddTaskDialog(false);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    onRemoveTask?.(deleteTarget.index);
    setDeleteTarget(null);
  };

  return (
    <>
      <Card className="group/card overflow-hidden border-white/5 p-0 transition-all duration-300 hover:border-white/10">
        <div
          className="flex cursor-pointer select-none items-center gap-3 p-4"
          onClick={() => setIsExpanded((value) => !value)}
        >
          {dragHandleProps && (
            <div
              {...dragHandleProps}
              onClick={(event) => event.stopPropagation()}
              className="cursor-grab text-muted-foreground/30 transition-colors hover:text-muted-foreground active:cursor-grabbing"
            >
              <GripVertical size={16} />
            </div>
          )}

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xs font-bold text-primary">
            {index + 1}
          </div>

          <div className="min-w-0 flex-1">
            {editable && isEditMode ? (
              <InlineEditableText
                value={displayTitle}
                onSave={(value) => onUpdate?.({ title: value })}
                className="text-sm font-bold"
                as="h4"
              />
            ) : (
              <h4 className="truncate text-sm font-bold">{displayTitle}</h4>
            )}

            <div className="mt-1 flex flex-wrap items-center gap-3">
              {editable && isEditMode ? (
                <DateRangeEditor
                  startDate={bucket.start_date}
                  endDate={bucket.end_date}
                  onSave={(startDate, endDate) =>
                    onUpdate?.({ start_date: startDate, end_date: endDate })
                  }
                />
              ) : (
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  {formatShort(bucket.start_date)} {"->"} {formatShort(bucket.end_date)}
                </span>
              )}

              <Badge
                variant="secondary"
                className="h-4 px-1.5 py-0 text-[7px] font-black uppercase tracking-tighter"
              >
                {bucket.deliverables.length} Deliverables
              </Badge>
              <Badge
                variant="secondary"
                className="h-4 px-1.5 py-0 text-[7px] font-black uppercase tracking-tighter"
              >
                {bucket.tasks.length} Tasks
              </Badge>
              {bucket.status && (
                <Badge
                  variant="secondary"
                  className="h-4 px-1.5 py-0 text-[7px] font-black uppercase tracking-tighter"
                >
                  {bucket.status.replace("_", " ")}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isExpanded && editable && (
              <button
                type="button"
                onClick={openTaskDialog}
                className="rounded-lg border border-white/10 bg-white/5 p-2 text-muted-foreground transition-all hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Add task"
                title={
                  bucket.deliverables.length === 0
                    ? "Add deliverables before adding tasks"
                    : "Add task"
                }
                disabled={bucket.deliverables.length === 0}
              >
                <Plus size={14} />
              </button>
            )}
            {isExpanded && editable && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setIsEditMode((value) => !value);
                }}
                className={`rounded-lg border p-2 transition-all ${
                  isEditMode
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-white/10 bg-white/5 text-muted-foreground hover:text-foreground"
                }`}
                aria-label={
                  isEditMode ? "Stop editing milestone" : "Edit milestone"
                }
              >
                <Pencil size={14} />
              </button>
            )}
            <div className="text-muted-foreground/40 transition-transform duration-200">
              {isExpanded ? (
                <ChevronDown size={18} />
              ) : (
                <ChevronRight size={18} />
              )}
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="animate-in slide-in-from-top-2 space-y-5 border-t border-white/5 p-4 duration-200">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="text-[10px] font-black uppercase tracking-widest text-primary">
                  Execution Flow
                </h5>
                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                  {bucket.progressPercent ?? 0}% complete
                </span>
              </div>

              {executionGroups.length > 0 ? (
                <div className="space-y-2">
                  {executionGroups.map((group, groupIndex) => (
                    <div
                      key={`${group.deliverable?.id || "ungrouped"}-${groupIndex}`}
                      className="space-y-2"
                    >
                      {group.tasks.length > 0 && (
                        <div className="rounded-[1.5rem] border border-white/6 bg-white/[0.04] p-3">
                          <div className="mb-3 flex items-center justify-between">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                              Task Group {groupIndex + 1}
                            </p>
                            <span className="text-[9px] font-black uppercase text-muted-foreground">
                              {group.tasks.length} task
                              {group.tasks.length === 1 ? "" : "s"}
                            </span>
                          </div>

                          <div className="space-y-2">
                            {group.tasks.map((task, taskIndex) => {
                              const taskIndexInBucket = bucket.tasks.findIndex(
                                (candidate) =>
                                  (candidate.id || candidate.temp_id) === task.id,
                              );

                              return (
                                <div
                                  key={`${task.id || taskIndex}`}
                                  className="rounded-2xl border border-white/5 bg-card/40 p-3"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                      <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                        Task
                                      </p>
                                      {editable &&
                                      isEditMode &&
                                      taskIndexInBucket >= 0 ? (
                                        <InlineEditableText
                                          value={task.title}
                                          onSave={(value) =>
                                            onUpdateTask?.(taskIndexInBucket, {
                                              title: value,
                                            })
                                          }
                                          className="truncate text-sm font-semibold"
                                        />
                                      ) : (
                                        <p className="truncate text-sm font-semibold">
                                          {task.title}
                                        </p>
                                      )}
                                    </div>

                                    <div className="flex shrink-0 items-start gap-2">
                                      <div className="text-right">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-primary">
                                          {formatShort(task.due_date || "")}
                                        </p>
                                        <p className="text-[10px] uppercase text-muted-foreground">
                                          {task.status?.replace("_", " ") ||
                                            "pending"}
                                        </p>
                                      </div>

                                      {task.status === "completed" ? (
                                        <CheckCircle2
                                          size={14}
                                          className="mt-0.5 text-emerald-500"
                                        />
                                      ) : editable &&
                                        isEditMode &&
                                        taskIndexInBucket >= 0 ? (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setDeleteTarget({
                                              index: taskIndexInBucket,
                                              title: task.title,
                                            })
                                          }
                                          className="text-rose-500/60 transition-colors hover:text-rose-500"
                                          aria-label={`Delete ${task.title}`}
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      ) : null}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {group.deliverable && (
                        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-emerald-500">
                                  Deliverable Checkpoint
                                </p>
                                <p className="text-sm font-semibold">
                                  {group.deliverable.title}
                                </p>
                              </div>
                              <Badge
                                variant={
                                  group.deliverable.status === "completed"
                                    ? "success"
                                    : "secondary"
                                }
                                className="text-[9px] uppercase"
                              >
                                {group.deliverable.status?.replace("_", " ") ||
                                  "pending"}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                              <span>
                                {group.deliverable.completed_task_count || 0}/
                                {group.deliverable.task_count || 0} tasks completed
                              </span>
                              <span>
                                {formatShort(group.deliverable.target_date || "")}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No sequenced items available yet.
                </p>
              )}
            </div>
          </div>
        )}
      </Card>

      <Dialog
        isOpen={showAddTaskDialog}
        onClose={handleCancelTask}
        title="Add Freelancer Task"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Task title
            </label>
            <input
              autoFocus
              value={newTaskTitle}
              onChange={(event) => setNewTaskTitle(event.target.value)}
              placeholder="QA responsive checkout flow"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Due date
              </label>
              <input
                type="date"
                value={newTaskDate}
                onChange={(event) => setNewTaskDate(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Deliverable
              </label>
              <select
                value={newTaskDeliverableId}
                onChange={(event) => {
                  setNewTaskDeliverableId(event.target.value);
                  setTaskFormError(null);
                }}
                className="w-full rounded-xl border border-white/10 bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="">Select deliverable</option>
                {bucket.deliverables.map((deliverable, deliverableIndex) => (
                  <option
                    key={deliverable.id || deliverable.temp_id || deliverableIndex}
                    value={deliverable.id || ""}
                    disabled={!deliverable.id}
                  >
                    {deliverable.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {bucket.deliverables.length === 0 && (
            <p className="text-xs text-amber-300">
              Add deliverables to this milestone before creating tasks.
            </p>
          )}

          {taskFormError && (
            <p className="text-xs text-rose-400">{taskFormError}</p>
          )}

          <div className="flex items-center justify-end gap-3">
            <Button variant="ghost" className="rounded-xl" onClick={handleCancelTask}>
              Cancel
            </Button>
            <Button
              variant="gradient"
              className="rounded-xl font-black uppercase"
              onClick={handleAddTask}
              disabled={!newTaskTitle.trim() || bucket.deliverables.length === 0}
            >
              Save task
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Task"
      >
        <p className="text-sm leading-relaxed text-muted-foreground">
          Confirm deletion for{" "}
          <span className="font-bold text-foreground">{deleteTarget?.title}</span>
          . This will update the timeline immediately.
        </p>
        <div className="flex items-center justify-end gap-3">
          <Button
            variant="ghost"
            className="rounded-xl"
            onClick={() => setDeleteTarget(null)}
          >
            Cancel
          </Button>
          <Button
            variant="secondary"
            className="rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500/15"
            onClick={handleConfirmDelete}
          >
            Confirm delete
          </Button>
        </div>
      </Dialog>
    </>
  );
}

function formatShort(dateStr: string): string {
  if (!dateStr) return "---";
  try {
    const date = new Date(`${dateStr}T00:00:00`);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

function buildSequenceItems(bucket: BucketData): BucketSequenceItem[] {
  if (bucket.sequence?.length) {
    return bucket.sequence;
  }

  if (!bucket.deliverables.length) {
    return bucket.tasks.map((task) => ({
      type: "task",
      id: task.id || task.temp_id,
      title: task.title,
      due_date: task.due_date,
      status: task.status || "pending",
      deliverable_id: task.deliverable_id || null,
    }));
  }

  const sortedTasks = [...bucket.tasks].sort((a, b) =>
    a.due_date.localeCompare(b.due_date),
  );

  return bucket.deliverables.flatMap((deliverable, deliverableIndex) => {
    const relatedTasks = sortedTasks.filter((task, taskIndex) => {
      if (task.deliverable_id) {
        return task.deliverable_id === deliverable.id;
      }

      const fallbackIndex = Math.min(
        bucket.deliverables.length - 1,
        Math.floor(
          (taskIndex * bucket.deliverables.length) /
            Math.max(sortedTasks.length, 1),
        ),
      );
      return fallbackIndex === deliverableIndex;
    });

    return [
      ...relatedTasks.map<BucketSequenceItem>((task) => ({
        type: "task",
        id: task.id || task.temp_id,
        title: task.title,
        due_date: task.due_date,
        status: task.status || "pending",
        deliverable_id: deliverable.id || null,
      })),
      {
        type: "deliverable",
        id: deliverable.id || deliverable.temp_id,
        title: deliverable.title,
        status:
          deliverable.status ||
          (relatedTasks.length > 0 &&
          relatedTasks.every((task) => task.status === "completed")
            ? "completed"
            : relatedTasks.some(
                  (task) =>
                    task.status === "completed" ||
                    task.status === "in_progress",
                )
              ? "in_progress"
              : "pending"),
        target_date:
          deliverable.target_date ||
          relatedTasks[relatedTasks.length - 1]?.due_date ||
          bucket.end_date,
        task_count: deliverable.task_count ?? relatedTasks.length,
        completed_task_count:
          deliverable.completed_task_count ??
          relatedTasks.filter((task) => task.status === "completed").length,
      },
    ];
  });
}

function buildExecutionGroups(sequenceItems: BucketSequenceItem[]) {
  const groups: Array<{
    tasks: BucketSequenceItem[];
    deliverable: BucketSequenceItem | null;
  }> = [];
  let pendingTasks: BucketSequenceItem[] = [];

  sequenceItems.forEach((item) => {
    if (item.type === "task") {
      pendingTasks.push(item);
      return;
    }

    groups.push({
      tasks: pendingTasks,
      deliverable: item,
    });
    pendingTasks = [];
  });

  if (pendingTasks.length > 0) {
    groups.push({
      tasks: pendingTasks,
      deliverable: null,
    });
  }

  return groups;
}
