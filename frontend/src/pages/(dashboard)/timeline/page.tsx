"use client";

import * as React from "react";
import { TimelineTask } from "@/types";
import { TimelineCalendar } from "@/components/timeline/TimelineCalendar";
import { TaskCard } from "@/components/timeline/TaskCard";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Calendar, PartyPopper, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDate } from "@/lib/format";
import { fetchWorkspacePlanTasks, updatePlanTask } from "@/lib/api/planApi";

export default function TimelinePage() {
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [groupedTasks, setGroupedTasks] = React.useState<
    Record<string, TimelineTask[]>
  >({});
  const [isLoading, setIsLoading] = React.useState(true);
  const [completingTaskId, setCompletingTaskId] = React.useState<string | null>(
    null,
  );
  const [taskToConfirm, setTaskToConfirm] = React.useState<TimelineTask | null>(
    null,
  );

  const loadTasks = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const tasks = await fetchWorkspacePlanTasks();
      setGroupedTasks(groupTasksByDate(tasks));
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const selectedDateKey = toDateKey(selectedDate);
  const tasksForSelectedDate = groupedTasks[selectedDateKey] || [];
  const taskDates = Object.keys(groupedTasks);

  const goToPrevDay = () => {
    setSelectedDate((current) => addDays(current, -1));
  };

  const goToNextDay = () => {
    setSelectedDate((current) => addDays(current, 1));
  };

  const handleCompleteTask = async (task: TimelineTask) => {
    setTaskToConfirm(task);
  };

  const handleConfirmTask = async () => {
    if (!taskToConfirm) return;
    setCompletingTaskId(taskToConfirm.taskId);
    try {
      await updatePlanTask(taskToConfirm.projectId, taskToConfirm.taskId, {
        status: "completed",
      });
      setGroupedTasks((current) => {
        const next = { ...current };
        const dateKey = toDateKey(new Date(taskToConfirm.dueDate));
        next[dateKey] = (next[dateKey] || []).map((entry) =>
          entry.taskId === taskToConfirm.taskId
            ? { ...entry, status: "completed" }
            : entry,
        );
        return next;
      });
    } finally {
      setCompletingTaskId(null);
      setTaskToConfirm(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-8">
        <div>
          <h1 className="text-4xl font-black tracking-tighter">Timeline</h1>
          <p className="text-muted-foreground text-sm font-medium">
            All project tasks across your workspace
          </p>
        </div>

        <div className="flex items-center gap-3 bg-card/40 p-1.5 rounded-2xl border border-white/5">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl"
            onClick={goToPrevDay}
          >
            <ChevronLeft size={18} />
          </Button>
          <div className="px-4 text-xs font-black uppercase tracking-widest text-primary">
            {selectedDate.toDateString() === new Date().toDateString()
              ? "Today"
              : formatDate(selectedDate)}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl"
            onClick={goToNextDay}
          >
            <ChevronRight size={18} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Mini Calendar */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-6">
          <TimelineCalendar
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            taskDates={taskDates}
          />

          <div className="p-6 rounded-3xl bg-primary/5 border border-primary/10 relative overflow-hidden">
            <div className="relative z-10">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">
                Workspace Heatmap
              </h4>
              <p className="text-sm font-bold leading-tight">
                You have {Object.values(groupedTasks).flat().length} tasks
                scheduled this month.
              </p>
            </div>
            <Calendar
              className="absolute bottom-[-10px] right-[-10px] opacity-10 text-primary rotate-12"
              size={80}
            />
          </div>
        </div>

        {/* Right: Task List */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black tracking-tight uppercase flex items-center gap-3">
              <Calendar className="text-primary" size={20} />
              Agenda for {formatDate(selectedDate)}
            </h2>
            <span className="text-xs font-bold text-muted-foreground uppercase">
              {tasksForSelectedDate.length} Tasks
            </span>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              Array(3)
                .fill(0)
                .map((_, i) => (
                  <div
                    key={i}
                    className="h-28 bg-muted/20 rounded-2xl animate-pulse"
                  />
                ))
            ) : tasksForSelectedDate.length > 0 ? (
              tasksForSelectedDate.map((task) => (
                <TaskCard
                  key={task.taskId}
                  task={task}
                  onComplete={handleCompleteTask}
                  isCompleting={completingTaskId === task.taskId}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-20 bg-card/30 rounded-[2.5rem] border border-dashed border-white/10">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
                  <PartyPopper size={32} className="text-emerald-500" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-tighter mb-2">
                  You’re clear today 🎉
                </h3>
                <p className="text-muted-foreground text-sm max-w-xs text-center">
                  No tasks scheduled for this date across any projects.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog
        isOpen={!!taskToConfirm}
        onClose={() => {
          if (!completingTaskId) {
            setTaskToConfirm(null);
          }
        }}
        title="Mark Task as Done"
      >
        <p className="text-sm text-muted-foreground leading-relaxed">
          Confirm that you’ve completed{" "}
          <span className="font-bold text-foreground">
            {taskToConfirm?.taskTitle}
          </span>
          . This will update the timeline and project progress immediately.
        </p>
        <div className="flex items-center justify-end gap-3">
          <Button
            variant="ghost"
            className="rounded-xl"
            onClick={() => setTaskToConfirm(null)}
            disabled={!!completingTaskId}
          >
            Cancel
          </Button>
          <Button
            variant="secondary"
            className="rounded-xl bg-primary/8 text-primary border border-primary/12 hover:bg-primary/12"
            onClick={handleConfirmTask}
            disabled={!!completingTaskId}
          >
            {completingTaskId ? "Saving..." : "Mark as done"}
          </Button>
        </div>
      </Dialog>
    </div>
  );
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

function groupTasksByDate(tasks: TimelineTask[]) {
  return tasks.reduce<Record<string, TimelineTask[]>>((acc, task) => {
    const dateKey = toDateKey(new Date(task.dueDate));
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(task);
    return acc;
  }, {});
}
