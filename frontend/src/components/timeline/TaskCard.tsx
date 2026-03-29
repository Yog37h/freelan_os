import * as React from "react";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { ExternalLink, Clock, Folder, CheckCircle2 } from "lucide-react";
import { TimelineTask } from "@/types";
import { Link } from "@/components/router/Link";

export function TaskCard({
  task,
  onComplete,
  isCompleting = false,
}: {
  task: TimelineTask;
  onComplete?: (task: TimelineTask) => void;
  isCompleting?: boolean;
}) {
  return (
    <Card className="group hover:translate-y-[-2px] transition-all duration-300 glass-panel border-white/5 shadow-xl p-5 flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <Badge
            variant={task.status === "completed" ? "success" : "secondary"}
            className="rounded-full text-[10px] h-5 uppercase tracking-tighter"
          >
            {task.status}
          </Badge>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
            <Clock size={12} /> {formatDueLabel(task.dueDate)}
          </span>
        </div>

        <h3 className="text-md font-bold truncate group-hover:text-primary transition-colors">
          {task.taskTitle}
        </h3>

        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-1.5">
            <Folder size={12} className="text-primary" />
            <span className="text-[11px] font-medium text-foreground/80">
              {task.projectTitle}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
            <span className="text-[11px] text-muted-foreground">
              {task.milestoneName}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {task.status !== "completed" && onComplete && (
          <Button
            variant="secondary"
            size="sm"
            className="rounded-xl font-bold text-[11px] h-9 px-4 bg-primary/8 text-primary border border-primary/12 hover:bg-primary/12 shadow-none"
            disabled={isCompleting}
            onClick={() => onComplete(task)}
          >
            <CheckCircle2 size={12} className="mr-1.5" />
            {isCompleting ? "Saving..." : "Mark as done"}
          </Button>
        )}
        <Link to={`/projects/${task.projectId}`}>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl font-bold text-[11px] border-white/10 hover:bg-white/5 h-9 px-4 transition-all group-hover:bg-primary group-hover:text-white group-hover:border-primary"
          >
            Open Project <ExternalLink size={12} className="ml-1.5" />
          </Button>
        </Link>
      </div>
    </Card>
  );
}

function formatDueLabel(dateStr: string) {
  const target = new Date(`${dateStr}T00:00:00`);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (target.toDateString() === today.toDateString()) {
    return "Today";
  }

  if (target.toDateString() === tomorrow.toDateString()) {
    return "Tomorrow";
  }

  return target.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
