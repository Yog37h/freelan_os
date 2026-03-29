import * as React from "react";
import {
  CheckCircle2,
  ExternalLink,
  Send,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Project } from "@/types";
import { cn } from "@/lib/cn";
import { Link } from "@/components/router/Link";

export function ProjectCard({
  project,
  isLoading = false,
}: {
  project: Project;
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <Card className="min-w-[320px] p-6 animate-pulse">
        <div className="flex justify-between mb-4">
          <div className="h-4 w-24 bg-muted rounded" />
          <div className="h-4 w-16 bg-muted rounded" />
        </div>
        <div className="h-6 w-3/4 bg-muted rounded mb-6" />
        <div className="h-2 w-full bg-muted rounded mb-2" />
        <div className="h-3 w-1/4 bg-muted rounded mb-6" />
        <div className="flex gap-2">
          <div className="h-9 flex-1 bg-muted rounded-xl" />
          <div className="h-9 flex-1 bg-muted rounded-xl" />
        </div>
      </Card>
    );
  }

  const title =
    project.projectTitle || project.projectName || "Untitled Project";
  const clientName =
    project.client?.businessName || project.clientName || "Unknown Client";
  const progress = project.progressPercent || 0;

  return (
    <Card className="min-w-[340px] p-6 group hover:translate-y-[-4px] transition-all duration-300 glass-panel border-white/5 shadow-xl">
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/5">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            {clientName}
          </span>
          {project.isVerified && (
            <CheckCircle2 size={12} className="text-primary fill-primary/20" />
          )}
        </div>
        <Badge
          variant={
            project.status === "Ahead of Schedule"
              ? "success"
              : project.status === "Not Yet Started"
                ? "secondary"
                : project.status === "Drop Pending Ack"
                  ? "warning"
                : project.status === "On Track" ||
                    project.status === "Completed"
                  ? "success"
                  : project.status === "Dropped"
                    ? "destructive"
                    : project.status === "At Risk"
                      ? "warning"
                      : "destructive"
          }
          className="rounded-full text-[10px]"
        >
          {project.status}
        </Badge>
      </div>

      <h3 className="text-lg font-bold mb-6 group-hover:text-primary transition-colors">
        {title}
      </h3>

      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted-foreground uppercase tracking-tighter font-bold">
            Progress
          </span>
          <span className="font-bold text-primary">{progress}%</span>
        </div>
        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full gradient-blue transition-all duration-1000 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 mb-6">
        <Calendar size={16} className="text-muted-foreground" />
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider leading-none mb-1">
            Next Milestone
          </span>
          <span className="text-xs font-bold leading-none">
            {project.nextMilestoneName || "TBD"} (
            {project.nextDeadlineDate || "TBD"})
          </span>
        </div>
      </div>

      <div className="flex gap-3">
        <Link to={`/projects/${project.id}?tab=timeline`} className="flex-1">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs rounded-xl h-10 border-white/10 hover:bg-white/5"
          >
            Timeline
          </Button>
        </Link>
        <Link to={`/projects/${project.id}`} className="flex-1">
          <Button
            variant="gradient"
            size="sm"
            className="w-full text-xs rounded-xl h-10"
          >
            View Project
          </Button>
        </Link>
      </div>
    </Card>
  );
}
