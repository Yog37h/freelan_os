"use client";

import * as React from "react";
import { Dialog } from "../ui/Dialog";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Project } from "@/types";
import { MessageSquare, Loader2, CalendarDays } from "lucide-react";

type RequestType = "buffer" | "scope";
type ScopeType = "inclusion" | "exclusion" | "change";

function addDays(dateValue: string, days: number) {
  if (!dateValue) return "";
  const next = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(next.getTime())) return dateValue;
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
}

function differenceInDays(fromDate: string, toDate: string) {
  if (!fromDate || !toDate) return 0;
  const start = new Date(`${fromDate}T00:00:00`);
  const end = new Date(`${toDate}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDateWithDay(dateValue: string) {
  if (!dateValue) return "No date";
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateValue;
  return `${date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} (${date.toLocaleDateString("en-US", { weekday: "short" })})`;
}

export function ChangeRequestModal({
  isOpen,
  onClose,
  project,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onSubmit?: (payload: {
    type: "buffer" | "approval";
    summary: string;
    channel: "WhatsApp" | "Email";
    metadata: Record<string, unknown>;
  }) => Promise<void>;
}) {
  const currentEndDate = project?.projectDeadline || "";
  const [requestType, setRequestType] = React.useState<RequestType>("buffer");
  const [bufferDays, setBufferDays] = React.useState("0");
  const [reason, setReason] = React.useState("");
  const [scopeType, setScopeType] = React.useState<ScopeType>("change");
  const [scopeTitle, setScopeTitle] = React.useState("");
  const [scopeDetail, setScopeDetail] = React.useState("");
  const [bufferEndDate, setBufferEndDate] = React.useState(currentEndDate);
  const [scopeEndDate, setScopeEndDate] = React.useState(currentEndDate);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) {
      setRequestType("buffer");
      setBufferDays("0");
      setReason("");
      setScopeType("change");
      setScopeTitle("");
      setScopeDetail("");
      setBufferEndDate(currentEndDate);
      setScopeEndDate(currentEndDate);
      return;
    }

    setBufferEndDate(currentEndDate);
    setScopeEndDate(currentEndDate);
  }, [currentEndDate, isOpen]);

  React.useEffect(() => {
    if (requestType !== "buffer" || !currentEndDate) {
      return;
    }

    setBufferEndDate(addDays(currentEndDate, Number(bufferDays) || 0));
  }, [bufferDays, currentEndDate, requestType]);

  React.useEffect(() => {
    if (requestType !== "buffer" || !currentEndDate || !bufferEndDate) {
      return;
    }

    const nextDays = Math.max(
      0,
      differenceInDays(currentEndDate, bufferEndDate),
    );
    if (String(nextDays) !== bufferDays) {
      setBufferDays(String(nextDays));
    }
  }, [bufferDays, bufferEndDate, currentEndDate, requestType]);

  if (!project) return null;

  const previewEndDate =
    requestType === "buffer" ? bufferEndDate : scopeEndDate;
  const summary =
    requestType === "buffer"
      ? `Buffer request for ${bufferDays} day(s)\nCurrent end date: ${formatDateWithDay(currentEndDate)}\nRequested end date: ${formatDateWithDay(bufferEndDate)}\nReason: ${reason || "Pending reason"}`.trim()
      : `Scope request (${scopeType})\nCurrent end date: ${formatDateWithDay(currentEndDate)}\nRequested end date: ${formatDateWithDay(scopeEndDate)}\nTitle: ${scopeTitle || "Pending title"}\nDetails: ${scopeDetail || "Pending details"}`.trim();

  const handleSend = async () => {
    if (!onSubmit) {
      onClose();
      return;
    }

    if (requestType === "buffer" && !reason.trim()) {
      return;
    }

    if (
      requestType === "scope" &&
      (!scopeTitle.trim() || !scopeDetail.trim())
    ) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        type: requestType === "buffer" ? "buffer" : "approval",
        summary,
        channel: "WhatsApp",
        metadata:
          requestType === "buffer"
            ? {
                requestType,
                status: "pending",
                bufferDays: Number(bufferDays) || 0,
                reason,
                currentEndDate,
                proposedEndDate: bufferEndDate,
              }
            : {
                requestType,
                status: "pending",
                scopeType,
                scopeTitle,
                scopeDetail,
                reason: scopeDetail,
                currentEndDate,
                proposedEndDate: scopeEndDate,
              },
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Request">
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
            Type of Request
          </label>
          <div className="grid grid-cols-2 gap-3">
            {(["buffer", "scope"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setRequestType(type)}
                className={`rounded-xl border px-4 py-3 text-left text-sm font-bold transition-all ${
                  requestType === type
                    ? "border-primary/50 bg-primary/5 text-primary"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}
              >
                {type === "buffer" ? "Buffer" : "Scope Change"}
              </button>
            ))}
          </div>
        </div>

        {requestType === "buffer" ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                  Days
                </label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  className="h-11 border-white/10"
                  value={bufferDays}
                  onChange={(e) => setBufferDays(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                  Project End Date
                </label>
                <Input
                  type="date"
                  placeholder={currentEndDate}
                  className="h-11 border-white/10"
                  value={bufferEndDate}
                  onChange={(e) => setBufferEndDate(e.target.value)}
                />
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <CalendarDays size={18} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Current End Date
                </p>
                <p className="text-sm font-bold">
                  {formatDateWithDay(currentEndDate)}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                Reason for Buffer
              </label>
              <textarea
                className="w-full h-28 bg-card p-4 rounded-xl border border-white/10 text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                placeholder="Explain why the additional days are needed..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                Scope Type
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(
                  [
                    { value: "inclusion", label: "In Scope" },
                    { value: "exclusion", label: "Out of Scope" },
                    { value: "change", label: "Change Request" },
                  ] as const
                ).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setScopeType(option.value)}
                    className={`rounded-xl border px-3 py-3 text-left text-xs font-bold transition-all ${
                      scopeType === option.value
                        ? "border-primary/50 bg-primary/5 text-primary"
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                  Request Title
                </label>
                <Input
                  className="h-11 border-white/10"
                  placeholder="e.g. Add CMS handoff"
                  value={scopeTitle}
                  onChange={(e) => setScopeTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                  Project End Date
                </label>
                <Input
                  type="date"
                  placeholder={currentEndDate}
                  className="h-11 border-white/10"
                  value={scopeEndDate}
                  onChange={(e) => setScopeEndDate(e.target.value)}
                />
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <CalendarDays size={18} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Current End Date
                </p>
                <p className="text-sm font-bold">
                  {formatDateWithDay(currentEndDate)}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                Request Details
              </label>
              <textarea
                className="w-full h-28 bg-card p-4 rounded-xl border border-white/10 text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                placeholder="Describe the scope item clearly..."
                value={scopeDetail}
                onChange={(e) => setScopeDetail(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
            Preview
          </label>
          <div className="w-full min-h-28 bg-white/5 p-4 rounded-xl border border-white/5 text-[11px] font-medium leading-relaxed text-muted-foreground whitespace-pre-wrap">
            {summary}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            className="flex-1 rounded-xl font-bold h-12"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="gradient"
            className="flex-[2] rounded-xl font-bold h-12 shadow-lg"
            onClick={handleSend}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 size={18} className="mr-2 animate-spin" />
            ) : (
              <MessageSquare size={18} className="mr-2" />
            )}
            Send Request
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
