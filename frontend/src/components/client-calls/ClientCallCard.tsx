// ✅ VERIFIED: Client call cards now present generic scheduled-call details and placeholder call links without any Google Meet dependency. Manual test: schedule a call and confirm the card shows the saved time plus an “Open Call Link” action.
import * as React from "react";
import { ClientCallItem } from "@/types";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Calendar, ExternalLink, Link as LinkIcon, MessageSquare, PhoneCall, RotateCcw, User } from "lucide-react";
import { Link } from "@/components/router/Link";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";

export function ClientCallCard({
  item,
  onSchedule,
}: {
  item: ClientCallItem;
  onSchedule: (item: ClientCallItem) => void;
}) {
  const isRevision = item.status === "revision";
  const hasSchedule = !!item.schedule;

  return (
    <Card className={cn("relative overflow-hidden border p-8 transition-all hover:border-white/10", isRevision ? "border-rose-500/20 bg-card/40" : "border-sky-400/20 bg-card/40")}>
      <div className="relative z-10 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <Link to={item.projectRoute} className="group/link flex items-center gap-1.5">
                <h3 className="text-xl font-black tracking-tighter transition-colors hover:text-primary">
                  {item.projectTitle}
                </h3>
                <ExternalLink size={14} className="text-muted-foreground group-hover/link:text-primary" />
              </Link>
              <Badge className={cn("rounded-full border-none px-3 py-0.5 text-[10px] font-black uppercase", isRevision ? "bg-rose-500/10 text-rose-500" : "bg-sky-400/10 text-sky-400")}>
                {item.status.replace("_", " ")}
              </Badge>
            </div>

            <div>
              <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-primary">Client Action</p>
              <p className="text-lg font-bold">{item.requestLabel}</p>
            </div>
          </div>

          <div className={cn("min-w-[260px] rounded-2xl border bg-white/5 px-4 py-3", isRevision ? "border-rose-500/20" : "border-sky-400/20")}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">
                {isRevision ? <RotateCcw size={18} className="text-rose-500" /> : <PhoneCall size={18} className="text-sky-400" />}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Webhook Decision</p>
                <p className="text-sm font-bold">{item.responseLabel || (isRevision ? "Client requested a revision" : "Client wants to connect")}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <User size={14} className="text-muted-foreground" />
            <span className="text-xs font-bold">{item.clientName}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-muted-foreground" />
            <span className="text-xs font-bold text-muted-foreground">Requested {formatDate(item.requestedAt)}</span>
          </div>
        </div>

        {item.requestSummary && (
          <div className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              <MessageSquare size={12} /> Request Summary
            </p>
            <p className="text-sm leading-relaxed text-foreground/90">{item.requestSummary}</p>
          </div>
        )}

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary">Call Schedule</p>
              {hasSchedule ? (
                <>
                  <p className="text-sm font-bold">{formatDate(item.schedule!.startsAt)} · {formatTime(item.schedule!.startsAt, item.schedule!.timezone)}</p>
                  <p className="text-xs text-muted-foreground">{item.schedule!.durationMinutes} minutes · {item.schedule!.timezone}</p>
                  {item.schedule!.agenda && <p className="text-xs text-muted-foreground">Agenda: {item.schedule!.agenda}</p>}
                  {item.schedule!.meetUrl && (
                    <a href={item.schedule!.meetUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs font-bold text-primary">
                      <LinkIcon size={12} />
                      Open Call Link
                    </a>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No call has been scheduled yet.</p>
              )}
            </div>

            <Button variant={hasSchedule ? "secondary" : "gradient"} className="rounded-xl font-black uppercase" onClick={() => onSchedule(item)}>
              {hasSchedule ? "Reschedule" : "Schedule"}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function formatTime(value: string, timezone: string) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: timezone,
  }).format(new Date(value));
}
