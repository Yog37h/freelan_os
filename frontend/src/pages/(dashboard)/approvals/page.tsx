"use client";

import * as React from "react";
import { getPendingApprovals } from "@/lib/data";
import { ClientApprovalItem } from "@/types";
import { ApprovalCard } from "@/components/approvals/ApprovalCard";
import { Button } from "@/components/ui/Button";
import { PartyPopper } from "lucide-react";
import { cn } from "@/lib/cn";

const APPROVAL_REFRESH_MS = 12000;
const VALID_FILTERS = ["all", "pending", "approved", "revision", "will_connect"] as const;

type ApprovalFilter = (typeof VALID_FILTERS)[number];

function getInitialFilter(): ApprovalFilter {
  const params = new URLSearchParams(window.location.search);
  const filter = params.get("filter");

  if (filter && VALID_FILTERS.includes(filter as ApprovalFilter)) {
    return filter as ApprovalFilter;
  }

  return "all";
}

export default function ApprovalsPage() {
  const [approvals, setApprovals] = React.useState<ClientApprovalItem[]>([]);
  const [filter, setFilter] = React.useState<ApprovalFilter>(getInitialFilter);
  const [isLoading, setIsLoading] = React.useState(true);

  const loadApprovals = React.useCallback(async () => {
    const data = await getPendingApprovals();
    setApprovals(data);
    setIsLoading(false);
  }, []);

  React.useEffect(() => {
    loadApprovals();

    const intervalId = window.setInterval(loadApprovals, APPROVAL_REFRESH_MS);
    const handleFocus = () => {
      loadApprovals();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
    };
  }, [loadApprovals]);

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

  const filteredApprovals = approvals.filter(
    (approval) => filter === "all" || approval.status === filter,
  );

  const filters: Array<{ id: ApprovalFilter; label: string }> = [
    { id: "all", label: "All Decisions" },
    { id: "pending", label: "Pending" },
    { id: "approved", label: "Approved" },
    { id: "revision", label: "Revisions" },
    { id: "will_connect", label: "Will Connect" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-8">
        <div>
          <h1 className="text-4xl font-black tracking-tighter">
            Project Requests
          </h1>
          <p className="text-muted-foreground text-sm font-medium">
            Live WhatsApp decisions for approval, buffer, and sync requests
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-card/40 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar">
          {filters.map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id)}
              className={cn(
                "px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap",
                filter === item.id
                  ? "bg-primary text-white shadow-lg glow-blue"
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
                className="h-64 bg-muted/20 rounded-3xl animate-pulse"
              />
            ))
        ) : filteredApprovals.length > 0 ? (
          filteredApprovals.map((approval) => (
            <ApprovalCard key={approval.approvalId} approval={approval} />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-24 bg-card/30 rounded-[3rem] border border-dashed border-white/10">
            <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 flex items-center justify-center mb-8 rotate-3 shadow-2xl">
              <PartyPopper size={40} className="text-emerald-500" />
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">
              All Clear!
            </h3>
            <p className="text-muted-foreground text-sm max-w-sm text-center">
              {filter === "all"
                ? "No live client decisions are waiting right now."
                : `No items found in the ${filter.replace("_", " ")} category.`}
            </p>
            {filter !== "all" && (
              <Button
                variant="outline"
                className="mt-8 rounded-xl font-bold h-10 px-8"
                onClick={() => setFilter("all")}
              >
                View All
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
