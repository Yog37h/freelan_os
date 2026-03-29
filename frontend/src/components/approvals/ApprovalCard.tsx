import * as React from "react";
import { ClientApprovalItem } from "@/types";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import {
  Calendar,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  User,
  PhoneCall,
  RotateCcw,
  Clock3,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Link } from "@/components/router/Link";
import { formatDate } from "@/lib/format";

export function ApprovalCard({ approval }: { approval: ClientApprovalItem }) {
  const statusStyles: Record<
    string,
    { badge: string; border: string; icon: React.ReactNode; copy: string }
  > = {
    pending: {
      badge: "text-amber-500 bg-amber-500/10",
      border: "border-amber-500/20",
      icon: <Clock3 size={18} className="text-amber-500" />,
      copy: "Waiting for client response from webhook",
    },
    approved: {
      badge: "text-emerald-500 bg-emerald-500/10",
      border: "border-emerald-500/20",
      icon: <ShieldCheck size={18} className="text-emerald-500" />,
      copy: "Client approved this request",
    },
    revision: {
      badge: "text-rose-500 bg-rose-500/10",
      border: "border-rose-500/20",
      icon: <RotateCcw size={18} className="text-rose-500" />,
      copy: "Client asked for changes",
    },
    will_connect: {
      badge: "text-sky-400 bg-sky-400/10",
      border: "border-sky-400/20",
      icon: <PhoneCall size={18} className="text-sky-400" />,
      copy: "Client wants to connect before deciding",
    },
  };

  const style = statusStyles[approval.status] || statusStyles.pending;

  return (
    <Card
      className={cn(
        "p-8 bg-card/40 glass-panel group hover:border-white/10 transition-all relative overflow-hidden",
        style.border,
      )}
    >
      <div className="relative z-10 space-y-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to={approval.projectRoute}
                className="flex items-center gap-1.5 group/link"
              >
                <h3 className="text-xl font-black tracking-tighter hover:text-primary transition-colors">
                  {approval.projectTitle}
                </h3>
                <ExternalLink
                  size={14}
                  className="text-muted-foreground group-hover/link:text-primary"
                />
              </Link>
              <Badge
                className={cn(
                  "rounded-full text-[10px] font-black uppercase px-3 py-0.5 border-none",
                  style.badge,
                )}
              >
                {approval.status.replace("_", " ")}
              </Badge>
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">
                Request Type
              </p>
              <p className="text-lg font-bold">{approval.milestoneName}</p>
              <p className="text-xs text-muted-foreground mt-1 capitalize">
                {approval.category.replace("_", " ")}
              </p>
            </div>
          </div>

          <div
            className={cn(
              "rounded-2xl border bg-white/5 px-4 py-3 min-w-[240px]",
              style.border,
            )}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                {style.icon}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Webhook Status
                </p>
                <p className="text-sm font-bold">
                  {approval.responseLabel || style.copy}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <User size={14} className="text-muted-foreground" />
            <span className="text-xs font-bold">{approval.clientName}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-muted-foreground" />
            <span className="text-xs font-bold text-muted-foreground">
              {approval.respondedAt
                ? `Resolved ${formatDate(approval.respondedAt)}`
                : `Requested ${formatDate(approval.requestedAt)}`}
            </span>
          </div>
        </div>

        {approval.requestSummary && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <MessageSquare size={12} /> Request Summary
            </p>
            <p className="text-sm leading-relaxed text-foreground/90">
              {approval.requestSummary}
            </p>
          </div>
        )}

        {approval.clientComment &&
          approval.clientComment !== approval.requestSummary && (
            <div
              className={cn(
                "rounded-2xl border p-4 space-y-2",
                style.border,
                "bg-white/5",
              )}
            >
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Client Response
              </p>
              <p className="text-sm font-medium text-foreground/90">
                {approval.clientComment}
              </p>
            </div>
          )}
      </div>

      <ShieldCheck
        className="absolute bottom-[-30px] right-[-30px] opacity-[0.03] text-primary"
        size={200}
      />
    </Card>
  );
}
