"use client";

import * as React from "react";
import {
  User,
  Mail,
  MessageSquare,
  Copy,
  Check,
  Calendar,
  Clock,
  ExternalLink,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Project } from "@/types";
import { formatCurrency, formatDate, daysUntil } from "@/lib/format";
import { Link } from "@/components/router/Link";
import { fetchUpdates } from "@/lib/api/updatesApi";
import { getWhatsAppMessages } from "@/lib/whatsappApi";

interface OverviewTabProps {
  project: Project;
  projectId: string;
}

type PulseItem = {
  id: string;
  date: string;
  summary: string;
  channel: string;
};

export function OverviewTab({ project, projectId }: OverviewTabProps) {
  const [copiedEmail, setCopiedEmail] = React.useState(false);
  const [recentUpdates, setRecentUpdates] = React.useState<PulseItem[]>([]);

  React.useEffect(() => {
    Promise.all([fetchUpdates(projectId), getWhatsAppMessages(projectId)])
      .then(([updates, messages]) => {
        const updateItems: PulseItem[] = (updates || []).map((item: any) => ({
          id: item.id,
          date: String(item.sentAt || item.sent_at || new Date().toISOString()),
          summary: String(item.summary || ""),
          channel: String(item.channel || "Email"),
        }));

        const messageItems: PulseItem[] = (messages || []).map((message) => ({
          id: message.id,
          date: message.createdAt,
          summary: describeWhatsAppMessage(message),
          channel: "WhatsApp",
        }));

        setRecentUpdates(
          [...updateItems, ...messageItems]
            .sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
            )
            .slice(0, 3),
        );
      })
      .catch(() => {
        setRecentUpdates([]);
      });
  }, [projectId]);
  const scheduleLabel =
    project.scheduleLabel ||
    (project.projectStarted ? "On track" : "Not yet started");
  const onTimeValue = project.onTimeCompletionRate;
  const onTimeDisplay =
    !project.projectStarted && onTimeValue == null
      ? "Not yet started"
      : typeof onTimeValue === "number"
        ? `${onTimeValue}%`
        : "Tracking";
  const timelineMeta = getTimelineMeta(
    project.nextDeadlineDate,
    project.scheduleState,
  );

  const copyEmail = () => {
    navigator.clipboard.writeText(project.client.email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-8">
        <Card className="p-6 glass-panel border-white/5 shadow-2xl relative overflow-hidden">
          <div className="flex items-center gap-2 mb-6 text-primary">
            <User size={18} />
            <h3 className="text-xs font-black uppercase tracking-widest">
              Client Intelligence
            </h3>
          </div>

          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-muted border border-white/5 flex items-center justify-center font-black text-xl text-primary">
              {project.client.name[0]}
            </div>
            <div>
              <p className="text-xl font-black">{project.client.name}</p>
              <p className="text-sm text-muted-foreground">
                {project.client.businessName}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Mail size={16} />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                    Email
                  </p>
                  <p className="text-sm font-bold">
                    {project.client.email.replace(/(.{3})(.*)(@.*)/, "$1***$3")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {project.client.verifiedEmail && (
                  <Badge variant="success" className="h-5 text-[9px]">
                    VERIFIED
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  onClick={copyEmail}
                >
                  {copiedEmail ? (
                    <Check size={14} className="text-emerald-500" />
                  ) : (
                    <Copy size={14} />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <MessageSquare size={16} />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                    WhatsApp
                  </p>
                  <p className="text-sm font-bold">
                    {project.client.whatsapp.replace(/(.{6})(.*)/, "$1****")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {project.client.verifiedWhatsapp && (
                  <Badge variant="success" className="h-5 text-[9px]">
                    VERIFIED
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <ShieldCheck size={120} />
          </div>
        </Card>

        <Card className="p-6 border-white/5">
          <div className="flex items-center gap-2 mb-6 text-primary">
            <Calendar size={18} />
            <h3 className="text-xs font-black uppercase tracking-widest">
              Project Summary
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-y-6">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter mb-1">
                Project Type
              </p>
              <span className="text-md font-bold">
                {project.projectType} Contract
              </span>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter mb-1">
                Total Quote
              </p>
              <span className="text-xl font-black text-primary">
                {formatCurrency(project.projectCost, project.currency)}
              </span>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter mb-1">
                Start Date
              </p>
              <span className="text-sm font-bold">
                {formatDate(project.projectStartDate)}
              </span>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter mb-1">
                Deadline
              </p>
              <span className="text-sm font-bold">
                {formatDate(project.projectDeadline)}
              </span>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-white/5">
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter mb-2">
              Scope Overview
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2">
              {project.projectDescription}
            </p>
          </div>
        </Card>
      </div>

      <div className="space-y-8">
        <Card className="p-6 glass-panel border-primary/20 bg-primary/5 shadow-[0_0_50px_rgba(59,130,246,0.1)]">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="text-4xl font-black tracking-tighter mb-1">
                {project.progressPercent}%
              </h3>
              <p className="text-xs font-bold text-primary uppercase tracking-widest">
                {scheduleLabel}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center animate-pulse">
              <TrendingUp size={24} className="text-primary" />
            </div>
          </div>

          <div className="w-full h-3 bg-white/5 rounded-full mb-8 overflow-hidden">
            <div
              className="h-full gradient-blue shadow-[0_0_20px_rgba(6,182,212,0.5)]"
              style={{ width: `${project.progressPercent}%` }}
            />
          </div>

          {project.scheduleState === "not_started" && (
            <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                Project Status
              </p>
              <p className="text-sm font-bold text-foreground">
                Not yet started
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                Work has not started yet. Progress will begin after the first
                milestone is unlocked and active.
              </p>
            </div>
          )}

          <div className="p-4 rounded-2xl bg-card/60 border border-white/5 flex items-center justify-between">
            <div className="space-y-3">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter mb-1">
                  On-Time Completion Rate
                </p>
                <p className="text-lg font-black text-primary">
                  {onTimeDisplay}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {project.totalTaskCount
                    ? `${project.completedTaskCount || 0}/${project.totalTaskCount} tasks done`
                    : "Timeline tracking will appear after confirmation"}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter mb-1">
                  Target Milestone
                </p>
                <p className="text-sm font-bold">{project.nextMilestoneName}</p>
                <p className="text-xs text-primary mt-1 flex items-center gap-1">
                  <Clock size={12} /> {timelineMeta}
                </p>
              </div>
            </div>
            <Link to="/timeline">
              <Button
                size="icon"
                variant="outline"
                className="rounded-xl border-white/10"
              >
                <ExternalLink size={16} />
              </Button>
            </Link>
          </div>
        </Card>

        <Card className="p-6 border-white/5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-primary">
              Pulse Check
            </h3>
            <Badge variant="secondary" className="text-[9px]">
              Last 3 Client Touchpoints
            </Badge>
          </div>

          <div className="space-y-4">
            {recentUpdates.length > 0 ? (
              recentUpdates.map((update, index) => (
                <div key={update.id} className="flex gap-4 relative">
                  {index !== recentUpdates.length - 1 && (
                    <div className="absolute left-[15px] top-8 bottom-[-16px] w-[2px] bg-white/5" />
                  )}
                  <div className="w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center shrink-0 z-10">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-bold leading-tight">
                      {update.summary}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[9px] text-muted-foreground uppercase font-black">
                        {formatDate(update.date)}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground uppercase font-black">
                        {update.channel}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4 italic">
                No client communication recorded yet.
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function describeWhatsAppMessage(message: {
  direction: string;
  content: string;
  messageType: string;
}) {
  if (
    message.direction === "incoming" &&
    message.messageType === "button_response"
  ) {
    return message.content || "Client sent a quick reply";
  }

  if (message.direction === "incoming") {
    return `Client sent: ${message.content}`;
  }

  return `Sent to client: ${message.content}`;
}

function getTimelineMeta(
  nextDeadlineDate: string,
  scheduleState?: Project["scheduleState"],
) {
  if (!nextDeadlineDate || nextDeadlineDate === "Completed") {
    return "All milestones completed";
  }

  const days = daysUntil(nextDeadlineDate);
  if (scheduleState === "not_started") {
    return days >= 0
      ? `Starts in ${days} day${days === 1 ? "" : "s"}`
      : "Waiting to begin";
  }

  if (days < 0) {
    const overdue = Math.abs(days);
    return `${overdue} day${overdue === 1 ? "" : "s"} overdue`;
  }

  return `${days} day${days === 1 ? "" : "s"} remaining`;
}
