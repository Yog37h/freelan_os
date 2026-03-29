import {
  clientActionRequests,
  db,
  payments,
  planTasks,
  projects,
} from "@freelancer-os/db";
import {
  and,
  asc,
  count,
  desc,
  eq,
  inArray,
  ne,
  notInArray,
} from "drizzle-orm";

type ClientActionMessageRow = {
  id: string;
  direction: string | null;
  status: string | null;
};

type ClientActionRow = {
  id: string;
  category: string;
  projectId: string;
  status: string;
  requestLabel: string | null;
  requestSummary: string | null;
  responseLabel: string | null;
  responseMessage: string | null;
  requestedAt: Date;
  respondedAt: Date | null;
  requestMetadata: Record<string, unknown> | null;
  project?: {
    title: string | null;
    client?: {
      name: string | null;
    } | null;
  } | null;
  client?: {
    name: string | null;
  } | null;
  whatsappMessages?: ClientActionMessageRow[];
  clientCallSchedule?: {
    id: string;
    clientActionRequestId: string;
    projectId: string;
    clientId: string | null;
    timezone: string;
    startsAt: Date;
    endsAt: Date;
    durationMinutes: number;
    agenda: string | null;
    status: string;
    googleCalendarId: string | null;
    googleEventId: string | null;
    meetUrl: string | null;
    invitedClientEmail: string | null;
    lastSentAt: Date | null;
  } | null;
};

function formatRequestLabel(row: ClientActionRow) {
  if (row.requestLabel) {
    return row.requestLabel;
  }

  if (row.category === "buffer") {
    const days = Number(
      (row.requestMetadata as Record<string, unknown>)?.bufferDays,
    );
    return `Buffer Request${days ? ` - ${days} day(s)` : ""}`;
  }

  if (row.category === "status_check") {
    return "Status Check";
  }

  if (row.category === "project_drop") {
    return "Project Drop Acknowledgement";
  }

  if (row.category === "sync") {
    return "Client requested a sync";
  }

  if (row.category === "revision") {
    return "Revision requested";
  }

  if (row.category === "deliverable_review") {
    return "Deliverable review";
  }

  if (row.category === "closure") {
    return "Project closure";
  }

  return "Scope Request";
}

function linkedMessageShape(row: ClientActionRow) {
  const linkedMessages = row.whatsappMessages || [];
  const outbound = linkedMessages.find(
    (message) => message.direction === "outgoing",
  );
  const inbound = linkedMessages.find(
    (message) => message.direction === "incoming",
  );

  return {
    linkedMessageIds: linkedMessages.map((message) => message.id),
    outboundMessageId: outbound?.id || null,
    inboundMessageId: inbound?.id || null,
    outboundMessageStatus: outbound?.status || null,
  };
}

function toRequestItem(row: ClientActionRow) {
  return {
    approvalId: row.id,
    clientActionRequestId: row.id,
    category: row.category,
    projectId: row.projectId,
    projectTitle: row.project?.title || "Untitled Project",
    projectRoute: `/projects/${row.projectId}`,
    milestoneName: formatRequestLabel(row),
    clientName: row.client?.name || row.project?.client?.name || "Client",
    status: row.status,
    clientComment: row.responseMessage || undefined,
    requestSummary: row.requestSummary || undefined,
    responseLabel: row.responseLabel || undefined,
    requestedAt: row.requestedAt,
    respondedAt: row.respondedAt,
    ...linkedMessageShape(row),
  };
}

export async function listApprovalRequests(ownerId: string) {
  const rows = await db.query.clientActionRequests.findMany({
    where: (table, { and: whereAnd }) =>
      whereAnd(
        eq(table.ownerId, ownerId),
        inArray(table.category, ["approval", "buffer", "status_check"]),
      ),
    orderBy: [desc(clientActionRequests.requestedAt)],
    with: {
      project: {
        with: {
          client: true,
        },
      },
      client: true,
      whatsappMessages: true,
      clientCallSchedule: true,
    },
  });

  return rows.map(toRequestItem);
}

export async function listClientCalls(ownerId: string) {
  const rows = await db.query.clientActionRequests.findMany({
    where: (table, { and: whereAnd }) =>
      whereAnd(
        eq(table.ownerId, ownerId),
        inArray(table.status, ["revision", "will_connect"]),
      ),
    orderBy: [
      desc(clientActionRequests.respondedAt),
      desc(clientActionRequests.requestedAt),
    ],
    with: {
      project: {
        with: {
          client: true,
        },
      },
      client: true,
      whatsappMessages: true,
      clientCallSchedule: true,
    },
  });

  return rows.map((row) => ({
    id: row.id,
    clientActionRequestId: row.id,
    category: row.category,
    status: row.status,
    projectId: row.projectId,
    projectTitle: row.project?.title || "Untitled Project",
    projectRoute: `/projects/${row.projectId}`,
    clientName: row.client?.name || row.project?.client?.name || "Client",
    requestLabel: formatRequestLabel(row),
    requestSummary: row.requestSummary || undefined,
    responseLabel: row.responseLabel || undefined,
    requestedAt: row.requestedAt,
    respondedAt: row.respondedAt,
    schedule: row.clientCallSchedule
      ? {
          id: row.clientCallSchedule.id,
          clientActionRequestId: row.clientCallSchedule.clientActionRequestId,
          projectId: row.clientCallSchedule.projectId,
          clientId: row.clientCallSchedule.clientId,
          timezone: row.clientCallSchedule.timezone,
          startsAt: row.clientCallSchedule.startsAt.toISOString(),
          endsAt: row.clientCallSchedule.endsAt.toISOString(),
          durationMinutes: row.clientCallSchedule.durationMinutes,
          agenda: row.clientCallSchedule.agenda,
          status: row.clientCallSchedule.status,
          googleCalendarId: row.clientCallSchedule.googleCalendarId,
          googleEventId: row.clientCallSchedule.googleEventId,
          meetUrl: row.clientCallSchedule.meetUrl,
          invitedClientEmail: row.clientCallSchedule.invitedClientEmail,
          lastSentAt: row.clientCallSchedule.lastSentAt?.toISOString() ?? null,
        }
      : null,
    ...linkedMessageShape(row),
  }));
}

export async function getDashboardSummary(ownerId: string) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = tomorrow.toISOString().slice(0, 10);

  const [deliverableRows, pendingApprovals, overduePayments, revisions] =
    await Promise.all([
      db
        .select({
          taskId: planTasks.id,
          projectId: planTasks.projectId,
          projectTitle: projects.title,
          taskTitle: planTasks.title,
        })
        .from(planTasks)
        .innerJoin(projects, eq(planTasks.projectId, projects.id))
        .where(
          and(
            eq(planTasks.ownerId, ownerId),
            eq(planTasks.dueDate, tomorrowKey),
            ne(planTasks.status, "completed"),
            notInArray(projects.status, [
              "Completed",
              "Dropped",
              "Drop Pending Ack",
            ]),
          ),
        )
        .orderBy(asc(planTasks.dueDate), asc(planTasks.orderIndex)),
      db
        .select({ value: count() })
        .from(clientActionRequests)
        .where(
          and(
            eq(clientActionRequests.ownerId, ownerId),
            inArray(clientActionRequests.category, [
              "approval",
              "buffer",
              "status_check",
            ]),
            eq(clientActionRequests.status, "pending"),
          ),
        ),
      db
        .select({ value: count() })
        .from(payments)
        .where(
          and(
            eq(payments.ownerId, ownerId),
            inArray(payments.status, ["due", "overdue", "Unpaid", "Overdue"]),
          ),
        ),
      db
        .select({ value: count() })
        .from(clientActionRequests)
        .where(
          and(
            eq(clientActionRequests.ownerId, ownerId),
            eq(clientActionRequests.status, "revision"),
          ),
        ),
    ]);

  const nextDeliverable = deliverableRows[0] || null;

  return [
    {
      id: "deliverable_due_tomorrow",
      type: "deliverable",
      title: "Deliverable due tomorrow",
      context: nextDeliverable
        ? `${nextDeliverable.projectTitle} - ${nextDeliverable.taskTitle}`
        : "No deliverables due tomorrow",
      severity: deliverableRows.length > 0 ? "high" : "low",
      count: deliverableRows.length,
      actionLabel: "Open Deliverable",
      route: nextDeliverable
        ? `/projects/${nextDeliverable.projectId}?tab=timeline`
        : "/timeline",
      projectId: nextDeliverable?.projectId || null,
      targetTab: "timeline",
      targetFilter: null,
    },
    {
      id: "client_approval_pending",
      type: "approval",
      title: "Client approval pending",
      context: `${pendingApprovals[0]?.value || 0} request(s) awaiting response`,
      severity: (pendingApprovals[0]?.value || 0) > 0 ? "medium" : "low",
      count: pendingApprovals[0]?.value || 0,
      actionLabel: "Review Approvals",
      route: "/approvals?filter=pending",
      projectId: null,
      targetTab: null,
      targetFilter: "pending",
    },
    {
      id: "invoice_unpaid",
      type: "invoice",
      title: "Invoice unpaid",
      context: `${overduePayments[0]?.value || 0} payment(s) need attention`,
      severity: (overduePayments[0]?.value || 0) > 0 ? "high" : "low",
      count: overduePayments[0]?.value || 0,
      actionLabel: "Open Payments",
      route: "/payments",
      projectId: null,
      targetTab: null,
      targetFilter: null,
    },
    {
      id: "client_revisions",
      type: "update",
      title: "Client Revisions",
      context: `${revisions[0]?.value || 0} change request(s) waiting your action`,
      severity: "low",
      count: revisions[0]?.value || 0,
      actionLabel: "Review Revisions",
      route: "/client-calls?filter=revision",
      projectId: null,
      targetTab: null,
      targetFilter: "revision",
    },
  ];
}
