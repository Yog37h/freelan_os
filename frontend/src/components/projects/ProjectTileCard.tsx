import * as React from "react";
import {
  MoreVertical,
  ExternalLink,
  Send,
  Trash2,
  CheckCircle2,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Project } from "@/types";
import { cn } from "@/lib/cn";
import { Link } from "@/components/router/Link";

export function ProjectTileCard({
  project,
  isLoading = false,
  onUpdate,
  onClose,
}: {
  project: Project;
  isLoading?: boolean;
  onUpdate?: (project: Project) => void;
  onClose?: (project: Project) => void;
}) {
  if (isLoading) {
    return (
      <Card className="p-6 space-y-4 animate-pulse">
        <div className="flex justify-between">
          <div className="flex gap-2">
            <div className="w-10 h-10 rounded-full bg-muted" />
            <div className="space-y-2">
              <div className="h-3 w-20 bg-muted rounded" />
              <div className="h-2 w-16 bg-muted rounded" />
            </div>
          </div>
          <div className="h-5 w-16 bg-muted rounded-full" />
        </div>
        <div className="h-5 w-3/4 bg-muted rounded" />
        <div className="space-y-2">
          <div className="h-1.5 w-full bg-muted rounded" />
          <div className="h-2 w-10 bg-muted rounded ml-auto" />
        </div>
        <div className="flex gap-2 pt-2">
          <div className="h-8 flex-1 bg-muted rounded-lg" />
          <div className="h-8 flex-1 bg-muted rounded-lg" />
        </div>
      </Card>
    );
  }

  const moodColors = {
    Healthy: "bg-emerald-500",
    Watch: "bg-amber-500",
    Risk: "bg-rose-500",
  };

  const statusVariants: Record<string, any> = {
    Active: "default",
    Completed: "success",
    "Drop Pending Ack": "warning",
    Dropped: "destructive",
    Delayed: "destructive",
    Recurring: "secondary",
    "At Risk": "warning",
    "On Track": "success",
    "Not Yet Started": "secondary",
    "Ahead of Schedule": "success",
  };

  return (
    <Card className="group hover:translate-y-[-4px] transition-all duration-300 glass-panel border-white/5 shadow-xl p-6 flex flex-col h-full">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full gradient-blue flex items-center justify-center text-white font-bold text-sm shadow-inner">
            {project.client.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold truncate max-w-[120px]">
              {project.client.businessName}
            </span>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none">
                {project.client.name}
              </span>
              {project.client.verifiedEmail && (
                <CheckCircle2 size={10} className="text-primary" />
              )}
            </div>
          </div>
        </div>
        <Badge
          variant={statusVariants[project.status] || "default"}
          className="rounded-full text-[10px] h-5"
        >
          {project.status}
        </Badge>
      </div>

      <h3 className="text-lg font-extrabold mb-4 group-hover:text-primary transition-colors line-clamp-1">
        {project.projectTitle}
      </h3>

      <div className="flex items-center gap-2 mb-6">
        <div
          className={cn("w-2 h-2 rounded-full", moodColors[project.clientMood])}
        />
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
          Client: {project.clientMood}
        </span>
      </div>

      <div className="space-y-2 mb-6">
        <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">
          <span>Progress</span>
          <span className="text-primary">{project.progressPercent}%</span>
        </div>
        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full gradient-blue rounded-full transition-all duration-1000"
            style={{ width: `${project.progressPercent}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 mb-6 mt-auto">
        <Calendar size={14} className="text-muted-foreground" />
        <div className="flex flex-col min-w-0">
          <span className="text-[9px] text-muted-foreground uppercase tracking-wider leading-none mb-1">
            Next: {project.nextMilestoneName}
          </span>
          <span className="text-[10px] font-bold leading-none truncate">
            {project.nextDeadlineDate === "Completed"
              ? "Completed"
              : new Date(project.nextDeadlineDate).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-auto">
        <Link to={`/projects/${project.id}`}>
          <Button
            variant="gradient"
            size="sm"
            className="w-full h-10 text-[11px] font-bold rounded-xl shadow-sm"
          >
            Open <ExternalLink size={12} className="ml-1.5" />
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          className="h-10 text-[11px] font-bold rounded-xl text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors border border-white/5"
          onClick={() => onClose?.(project)}
          disabled={project.status === "Dropped" || project.status === "Drop Pending Ack"}
        >
          <Trash2 size={12} className="mr-1.5" />
          {project.status === "Drop Pending Ack" ? "Awaiting Ack" : "Drop Project"}
        </Button>
      </div>
    </Card>
  );
}
