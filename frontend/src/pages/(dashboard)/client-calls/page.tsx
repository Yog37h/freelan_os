// ✅ VERIFIED: Client calls page keeps scheduling/rescheduling intact while removing Google connect prompts and Meet-specific copy. Manual test: open the schedule modal, save a schedule, and confirm the UI updates without any Google setup language.
"use client";

import * as React from "react";
import { getClientCalls } from "@/lib/data";
import { ClientCallItem } from "@/types";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { ClientCallCard } from "@/components/client-calls/ClientCallCard";
import { Dialog } from "@/components/ui/Dialog";
import { scheduleClientCall } from "@/lib/api/clientCallsApi";
import { PhoneCall, RotateCcw } from "lucide-react";

const CLIENT_CALL_REFRESH_MS = 12000;
const VALID_FILTERS = ["all", "revision", "will_connect"] as const;
const DEFAULT_TIMEZONE =
  Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Calcutta";

type ClientCallFilter = (typeof VALID_FILTERS)[number];

function getInitialFilter(): ClientCallFilter {
  const params = new URLSearchParams(window.location.search);
  const filter = params.get("filter");

  if (filter && VALID_FILTERS.includes(filter as ClientCallFilter)) {
    return filter as ClientCallFilter;
  }

  return "all";
}

function buildDefaultStart() {
  const date = new Date();
  date.setHours(date.getHours() + 1, 0, 0, 0);
  return toDateTimeLocal(date);
}

export default function ClientCallsPage() {
  const [items, setItems] = React.useState<ClientCallItem[]>([]);
  const [filter, setFilter] = React.useState<ClientCallFilter>(getInitialFilter);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedItem, setSelectedItem] = React.useState<ClientCallItem | null>(null);
  const [startValue, setStartValue] = React.useState(buildDefaultStart);
  const [durationMinutes, setDurationMinutes] = React.useState("30");
  const [agenda, setAgenda] = React.useState("");
  const [timezone, setTimezone] = React.useState(DEFAULT_TIMEZONE);
  const [isSaving, setIsSaving] = React.useState(false);
  const [scheduleError, setScheduleError] = React.useState<string | null>(null);

  const loadItems = React.useCallback(async () => {
    const data = await getClientCalls();
    setItems(data);
    setIsLoading(false);
  }, []);

  React.useEffect(() => {
    loadItems();

    const intervalId = window.setInterval(loadItems, CLIENT_CALL_REFRESH_MS);
    const handleFocus = () => {
      loadItems();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
    };
  }, [loadItems]);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (filter === "all") {
      params.delete("filter");
    } else {
      params.set("filter", filter);
    }

    const nextUrl = params.toString()
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;

    window.history.replaceState({}, "", nextUrl);
  }, [filter]);

  const filteredItems = items.filter(
    (item) => filter === "all" || item.status === filter,
  );

  const filters: Array<{ id: ClientCallFilter; label: string }> = [
    { id: "all", label: "All" },
    { id: "revision", label: "Revisions" },
    { id: "will_connect", label: "Will Connect" },
  ];

  const openScheduleModal = (item: ClientCallItem) => {
    setSelectedItem(item);
    setScheduleError(null);
    setAgenda(item.requestSummary || "");
    setTimezone(item.schedule?.timezone || DEFAULT_TIMEZONE);
    setDurationMinutes(String(item.schedule?.durationMinutes || 30));
    setStartValue(
      item.schedule ? toDateTimeLocal(new Date(item.schedule.startsAt)) : buildDefaultStart(),
    );
  };

  const closeScheduleModal = () => {
    if (isSaving) return;
    setSelectedItem(null);
    setScheduleError(null);
  };

  const handleScheduleSave = async () => {
    if (!selectedItem) return;

    const duration = Number(durationMinutes);
    if (!startValue || !Number.isFinite(duration) || duration <= 0) {
      setScheduleError("Choose a valid date, time, and duration.");
      return;
    }

    const startDate = new Date(startValue);
    const endDate = new Date(startDate.getTime() + duration * 60 * 1000);

    setIsSaving(true);
    setScheduleError(null);
    try {
      await scheduleClientCall(selectedItem.clientActionRequestId, {
        startsAt: startDate.toISOString(),
        endsAt: endDate.toISOString(),
        timezone,
        agenda,
      });
      await loadItems();
      setSelectedItem(null);
    } catch (error: any) {
      setScheduleError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to schedule the call right now.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="animate-in space-y-8 fade-in duration-700">
      <div className="flex flex-col gap-4 border-b border-white/5 pb-8 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tighter">Client Calls</h1>
          <p className="text-sm font-medium text-muted-foreground">
            Structured WhatsApp call, sync, and revision actions from clients
          </p>
        </div>

        <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto rounded-2xl border border-white/5 bg-card/40 p-1">
          {filters.map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id)}
              className={cn(
                "whitespace-nowrap rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all",
                filter === item.id
                  ? "glow-blue bg-primary text-white shadow-lg"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {isLoading ? (
          Array(2)
            .fill(0)
            .map((_, index) => (
              <div
                key={index}
                className="h-64 animate-pulse rounded-3xl bg-muted/20"
              />
            ))
        ) : filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <ClientCallCard
              key={item.id}
              item={item}
              onSchedule={openScheduleModal}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center rounded-[3rem] border border-dashed border-white/10 bg-card/30 py-24">
            <div className="relative mb-8">
              <div className="flex h-20 w-20 rotate-3 items-center justify-center rounded-3xl bg-sky-400/10 shadow-2xl">
                {filter === "revision" ? (
                  <RotateCcw size={40} className="text-rose-500" />
                ) : (
                  <PhoneCall size={40} className="text-sky-400" />
                )}
              </div>
            </div>
            <h3 className="mb-2 text-2xl font-black uppercase tracking-tighter">
              No Client Actions
            </h3>
            <p className="max-w-sm text-center text-sm text-muted-foreground">
              {filter === "all"
                ? "Webhook-confirmed calls and revisions will appear here."
                : `No ${filter.replace("_", " ")} items are waiting right now.`}
            </p>
            {filter !== "all" && (
              <Button
                variant="outline"
                className="mt-8 h-10 rounded-xl px-8 font-bold"
                onClick={() => setFilter("all")}
              >
                View All
              </Button>
            )}
          </div>
        )}
      </div>

      <Dialog
        isOpen={!!selectedItem}
        onClose={closeScheduleModal}
        title={selectedItem?.schedule ? "Reschedule Client Call" : "Schedule Client Call"}
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-bold">
              {selectedItem?.projectTitle} · {selectedItem?.clientName}
            </p>
            <p className="text-xs text-muted-foreground">
              Scheduling will save the call details and send the `client_call`
              WhatsApp template with the current placeholder call link.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Date & time
              </label>
              <input
                type="datetime-local"
                value={startValue}
                onChange={(event) => setStartValue(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Duration (minutes)
              </label>
              <input
                type="number"
                min={15}
                step={15}
                value={durationMinutes}
                onChange={(event) => setDurationMinutes(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Timezone
            </label>
            <input
              value={timezone}
              onChange={(event) => setTimezone(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Agenda
            </label>
            <textarea
              value={agenda}
              onChange={(event) => setAgenda(event.target.value)}
              className="min-h-[120px] w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="Discuss revision notes, approve next milestone, review deliverable feedback..."
            />
          </div>

          {scheduleError && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">
              {scheduleError}
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <Button
              variant="ghost"
              className="rounded-xl"
              onClick={closeScheduleModal}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              variant="gradient"
              className="rounded-xl font-black uppercase"
              onClick={handleScheduleSave}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : selectedItem?.schedule ? "Update schedule" : "Schedule"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

function toDateTimeLocal(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  const hours = String(value.getHours()).padStart(2, "0");
  const minutes = String(value.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
