import * as React from "react";
import { UpdateCenterItem, ProjectUpdate, WhatsAppMessage } from "@/types";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import {
  MessageSquare,
  Send,
  Zap,
  Clock,
  ChevronRight,
  User,
  ExternalLink,
  Copy,
  Check,
  CheckCheck,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Link } from "@/components/router/Link";
import { sendWhatsAppMessage, getWhatsAppMessages } from "@/lib/whatsappApi";

interface UpdatePanelProps {
  item: UpdateCenterItem;
  history: ProjectUpdate[];
}

function DeliveryStatus({ status }: { status: string }) {
  switch (status) {
    case "sent":
      return (
        <span title="Sent">
          <Check size={12} className="text-muted-foreground" />
        </span>
      );
    case "delivered":
      return (
        <span title="Delivered">
          <CheckCheck size={12} className="text-muted-foreground" />
        </span>
      );
    case "read":
      return (
        <span title="Read">
          <CheckCheck size={12} className="text-blue-400" />
        </span>
      );
    case "failed":
      return (
        <span title="Failed">
          <AlertCircle size={12} className="text-red-400" />
        </span>
      );
    case "pending":
      return (
        <span title="Pending">
          <Loader2 size={12} className="text-muted-foreground animate-spin" />
        </span>
      );
    default:
      return null;
  }
}

export function UpdatePanel({ item, history }: UpdatePanelProps) {
  const [isAuto, setIsAuto] = React.useState(item.autoMode);
  const [copied, setCopied] = React.useState<string | null>(null);
  const [sending, setSending] = React.useState<string | null>(null);
  const [sendResult, setSendResult] = React.useState<{
    id: string;
    success: boolean;
    message: string;
  } | null>(null);
  const [waMessages, setWaMessages] = React.useState<WhatsAppMessage[]>([]);

  React.useEffect(() => {
    async function fetchWaMessages() {
      if (!item.projectId) return;
      const msgs = await getWhatsAppMessages(item.projectId);
      setWaMessages(msgs);
    }
    fetchWaMessages();
  }, [item.projectId]);

  const combinedHistory = React.useMemo(() => {
    const whatsappEntries = waMessages.map((message) => ({
      id: `wa-${message.id}`,
      date: message.createdAt,
      kind: "whatsapp" as const,
      message,
    }));
    const updateEntries = history.map((update) => ({
      id: `update-${update.id}`,
      date: update.date,
      kind: "update" as const,
      update,
    }));

    return [...whatsappEntries, ...updateEntries].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [history, waMessages]);

  const templates = [
    {
      id: "t1",
      title: "Weekly Progress",
      type: "update" as const,
      campaignName: "project_weekly_update",
      content: `Hi ${item.clientName}! Weekly update for ${item.projectTitle}: Everything is moving smoothly. We've hit major milestones in development and design. Looking forward to our sync!`,
    },
    {
      id: "t2",
      title: "Deliverable Shared",
      type: "deliverable" as const,
      campaignName: "deliverable_shared",
      content: `Great news ${item.clientName}! The new deliverable for ${item.projectTitle} is ready. You can find it in your vault. Please review it at your earliest convenience.`,
    },
    {
      id: "t3",
      title: "Approval Request",
      type: "approval_request" as const,
      campaignName: "approval_request",
      content: `Hi ${item.clientName}, we've finished the current phase of ${item.projectTitle}. Awaiting your approval on the latest milestones to proceed to the next stage.`,
    },
  ];

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSendUpdate = async () => {
    setSending("main");
    setSendResult(null);
    try {
      const result = await sendWhatsAppMessage(item.projectId, "update");
      setSendResult({
        id: "main",
        success: !!result.data?.sent,
        message: result.data?.sent
          ? "Message sent via WhatsApp!"
          : result.data?.error || result.error?.message || "Failed to send",
      });
      const msgs = await getWhatsAppMessages(item.projectId);
      setWaMessages(msgs);
    } catch {
      setSendResult({ id: "main", success: false, message: "Network error" });
    }
    setSending(null);
  };

  const handleLiveSend = async (
    templateId: string,
    messageType: "update" | "deliverable" | "approval_request",
  ) => {
    setSending(templateId);
    setSendResult(null);
    try {
      const result = await sendWhatsAppMessage(item.projectId, messageType);
      setSendResult({
        id: templateId,
        success: !!result.data?.sent,
        message: result.data?.sent
          ? "Sent!"
          : result.data?.error || result.error?.message || "Failed",
      });
      const msgs = await getWhatsAppMessages(item.projectId);
      setWaMessages(msgs);
    } catch {
      setSendResult({
        id: templateId,
        success: false,
        message: "Network error",
      });
    }
    setSending(null);
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
      <Card className="p-8 border-white/5 glass-panel relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link
                to={`/projects/${item.projectId}`}
                className="group flex items-center gap-2"
              >
                <h2 className="text-2xl font-black tracking-tighter hover:text-primary transition-colors">
                  {item.projectTitle}
                </h2>
                <ExternalLink
                  size={16}
                  className="text-muted-foreground group-hover:text-primary"
                />
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                variant="secondary"
                className="bg-primary/5 text-primary border-none rounded-full px-3 py-1 text-[10px] font-black uppercase"
              >
                <User size={12} className="mr-1.5" /> {item.clientName}
              </Badge>
              <span className="text-xs text-muted-foreground font-medium">
                Last activity {new Date(item.sentAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-8 p-3 bg-white/5 rounded-2xl border border-white/5">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-2 h-2 rounded-full",
                    isAuto
                      ? "bg-emerald-500 animate-pulse"
                      : "bg-muted-foreground/30",
                  )}
                />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  Auto-Send (Weekly)
                </span>
              </div>
              <button
                onClick={() => setIsAuto(!isAuto)}
                className={cn(
                  "w-10 h-5 rounded-full relative transition-all",
                  isAuto
                    ? "bg-primary shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                    : "bg-white/10",
                )}
              >
                <div
                  className={cn(
                    "absolute top-1 w-3 h-3 rounded-full bg-white transition-all",
                    isAuto ? "left-6" : "left-1",
                  )}
                />
              </button>
            </div>
            <Button
              variant="gradient"
              className="rounded-xl font-bold h-11 shadow-xl"
              onClick={handleSendUpdate}
              disabled={sending === "main"}
            >
              {sending === "main" ? (
                <>
                  <Loader2 size={18} className="mr-2 animate-spin" /> Sending...
                </>
              ) : (
                <>
                  <Send size={18} className="mr-2" /> Send Update Now
                </>
              )}
            </Button>
            {sendResult?.id === "main" && (
              <div
                className={cn(
                  "text-xs font-medium text-center py-1.5 px-3 rounded-lg",
                  sendResult.success
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-red-500/10 text-red-400",
                )}
              >
                {sendResult.message}
              </div>
            )}
          </div>
        </div>
        <MessageSquare
          className="absolute bottom-[-20px] left-[-20px] opacity-[0.03] text-primary"
          size={200}
        />
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
              <Clock size={16} /> Message History
            </h3>
            <Badge variant="outline" className="text-[9px] border-white/5">
              {combinedHistory.length} entries
            </Badge>
          </div>

          <div className="space-y-4 relative before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-[2px] before:bg-white/5">
            {combinedHistory.map((entry) => (
              <div key={entry.id} className="relative pl-10">
                <div
                  className={cn(
                    "absolute left-0 top-1 w-8 h-8 rounded-full border flex items-center justify-center font-bold text-[10px] z-10",
                    entry.kind === "whatsapp" &&
                      entry.message.direction === "incoming"
                      ? "bg-emerald-500/10 border-emerald-500/30"
                      : "bg-card border-white/5",
                  )}
                >
                  {entry.kind === "update" &&
                  entry.update.channel === "Email" ? (
                    <Send size={12} className="text-primary" />
                  ) : entry.kind === "update" &&
                    entry.update.channel === "System" ? (
                    <Zap size={12} className="text-amber-400" />
                  ) : (
                    <MessageSquare size={12} className="text-emerald-500" />
                  )}
                </div>
                <Card className="p-4 border-white/5 hover:border-white/10 transition-all bg-card/60">
                  <div className="flex justify-between items-start mb-2 gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {entry.kind === "whatsapp" ? (
                        <>
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-[8px] h-4 py-0 uppercase border-none",
                              entry.message.direction === "incoming"
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-muted/30",
                            )}
                          >
                            {entry.message.direction === "incoming"
                              ? "Reply"
                              : entry.message.messageType.replace("_", " ")}
                          </Badge>
                          <DeliveryStatus status={entry.message.status} />
                        </>
                      ) : (
                        <>
                          <Badge
                            variant="secondary"
                            className="text-[8px] h-4 py-0 uppercase border-none bg-muted/30"
                          >
                            {entry.update.type}
                          </Badge>
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-[8px] h-4 py-0 uppercase border-none",
                              entry.update.channel === "System"
                                ? "bg-amber-500/10 text-amber-400"
                                : "bg-primary/10 text-primary",
                            )}
                          >
                            {entry.update.channel}
                          </Badge>
                        </>
                      )}
                    </div>
                    <span className="text-[9px] text-muted-foreground uppercase font-black">
                      {new Date(entry.date).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs font-medium leading-relaxed italic whitespace-pre-line">
                    {entry.kind === "whatsapp"
                      ? `"${entry.message.content.substring(0, 220)}${entry.message.content.length > 220 ? "..." : ""}"`
                      : `"${entry.update.summary}"`}
                  </p>
                </Card>
              </div>
            ))}

            {combinedHistory.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare size={32} className="mx-auto mb-3 opacity-20" />
                <p className="text-xs font-medium">No messages yet</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
            <Zap size={16} /> Communication Templates
          </h3>

          <div className="space-y-4">
            {templates.map((template) => (
              <Card
                key={template.id}
                className="p-5 border-white/5 bg-white/5 hover:bg-white/10 transition-all group"
              >
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-bold text-foreground/90">
                    {template.title}
                  </h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        copyToClipboard(template.content, template.id)
                      }
                      className="p-2 rounded-lg bg-card border border-white/5 text-muted-foreground hover:text-primary transition-colors"
                    >
                      {copied === template.id ? (
                        <Check size={14} className="text-emerald-500" />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-[10px] font-black uppercase border-white/10 hover:bg-primary hover:text-white transition-all"
                      onClick={() => handleLiveSend(template.id, template.type)}
                      disabled={sending === template.id}
                    >
                      {sending === template.id ? (
                        <>
                          <Loader2 size={14} className="mr-1 animate-spin" />{" "}
                          Sending
                        </>
                      ) : (
                        <>
                          Live Send <ChevronRight size={14} className="ml-1" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                {sendResult?.id === template.id && (
                  <div
                    className={cn(
                      "text-xs font-medium py-1.5 px-3 rounded-lg mb-3",
                      sendResult.success
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-red-500/10 text-red-400",
                    )}
                  >
                    {sendResult.message}
                  </div>
                )}
                <div className="p-3 rounded-xl bg-card/40 border border-white/5 text-[11px] leading-relaxed text-muted-foreground font-medium">
                  {template.content}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
