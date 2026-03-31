import { getLocalProjects, getLocalProjectById } from "./clientStore";
import { api } from "./axios";
import { getAllWhatsAppMessages } from "./whatsappApi";
import { useAuthStore } from "../store/auth.store";
import type {
  ClientApprovalItem,
  DashboardSummaryCard,
  Invoice,
  Notification,
  PaymentScheduleItem,
  ProjectUpdate,
  TimelineTask,
  UpdateCenterItem,
  User,
} from "@/types";

async function getJson<T>(url: string) {
  const response = await api.get(url);
  return response.data as T;
}

async function postJson<T>(url: string, body?: unknown) {
  const response = await api.post(url, body);
  return response.data as T;
}

async function patchJson<T>(url: string, body?: unknown) {
  const response = await api.patch(url, body);
  return response.data as T;
}

function asArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function getFallbackUser() {
  const authUser = useAuthStore.getState().user;
  if (!authUser) {
    return null;
  }

  return {
    id: authUser.id,
    name: authUser.name || authUser.email.split("@")[0] || "User",
    avatar: authUser.avatar,
    role: authUser.role || "freelancer",
    plan: "FREE" as const,
  };
}

export async function getUser(): Promise<User | null> {
  try {
    const result = await getJson<any>("/api/profile");
    const data = result.data;
    const fallbackUser = getFallbackUser();
    if (!data) return fallbackUser;

    return {
      id: data.id || fallbackUser?.id || "",
      name: data.full_name || fallbackUser?.name || "User",
      avatar: data.avatar_url || fallbackUser?.avatar,
      role: data.headline || fallbackUser?.role || "freelancer",
      plan: "FREE" as const,
    };
  } catch {
    return getFallbackUser();
  }
}

export async function getProjects(params?: { status?: string; q?: string }) {
  try {
    const queryParams = new URLSearchParams();
    if (params?.status && params.status !== "all")
      queryParams.append("status", params.status);
    if (params?.q) queryParams.append("q", params.q);

    const { data } = await getJson<any>(
      `/api/projects?${queryParams.toString()}`,
    );

    const projects = asArray(data);
    if (projects.length === 0) return getLocalProjects();

    return projects.map((p: any) => ({
      id: p.id,
      clientId: p.client_id,
      client: {
        id: p.client?.id,
        name: p.client?.name,
        businessName: p.client?.business_name,
        email: p.client?.email,
        whatsapp: p.client?.whatsapp,
        verifiedEmail: p.client?.verified_email,
        verifiedWhatsapp: p.client?.verified_whatsapp,
      },
      projectTitle: p.title,
      projectDescription: p.description,
      projectStartDate: p.start_date || p.startDate,
      projectDeadline: p.deadline,
      projectType: p.type,
      projectCost: Number(p.cost),
      currency: p.currency,
      paymentTerms: p.payment_terms || p.paymentTerms,
      progressPercent: p.progress_percent ?? p.progressPercent ?? 0,
      status: p.status,
      clientMood: p.client_mood || p.clientMood,
      onTimeCompletionRate:
        p.on_time_completion_rate ?? p.onTimeCompletionRate ?? null,
      scheduleState: p.schedule_state || p.scheduleState,
      scheduleLabel: p.schedule_label || p.scheduleLabel,
      projectStarted: p.project_started ?? p.projectStarted ?? false,
      hasGetStartedConfirmation:
        p.has_get_started_confirmation ?? p.hasGetStartedConfirmation ?? false,
      completedTaskCount: p.completed_task_count ?? p.completedTaskCount ?? 0,
      totalTaskCount: p.total_task_count ?? p.totalTaskCount ?? 0,
      completedMilestoneCount:
        p.completed_milestone_count ?? p.completedMilestoneCount ?? 0,
      totalMilestoneCount:
        p.total_milestone_count ?? p.totalMilestoneCount ?? 0,
      revisions: p.revisions,
      bufferDays: p.buffer_days,
      recurringMaintenance: p.recurring_maintenance,
      prdContent: p.prd_content,
      styleContext: p.style_context,
      // Next milestone info would ideally come from a joined query or computed in SQL
      nextDeadlineDate:
        p.next_deadline_date || p.nextDeadlineDate || p.deadline,
      nextMilestoneName:
        p.next_milestone_name || p.nextMilestoneName || "Project Deadline",
    }));
  } catch (err) {
    console.error("getProjects error:", err);
    return getLocalProjects();
  }
}

export async function getProjectById(projectId: string) {
  try {
    const { data: p } = await getJson<any>(
      `/api/projects/${projectId}/overview`,
    );

    return {
      id: p.id,
      clientId: p.client_id,
      client: {
        id: p.client?.id,
        name: p.client?.name,
        businessName: p.client?.business_name,
        email: p.client?.email,
        whatsapp: p.client?.whatsapp,
        verifiedEmail: p.client?.verified_email,
        verifiedWhatsapp: p.client?.verified_whatsapp,
      },
      projectTitle: p.title,
      projectDescription: p.description,
      projectStartDate: p.start_date || p.startDate,
      projectDeadline: p.deadline,
      projectType: p.type,
      projectCost: Number(p.cost),
      currency: p.currency,
      paymentTerms: p.payment_terms || p.paymentTerms,
      progressPercent: p.progress_percent ?? p.progressPercent ?? 0,
      status: p.status,
      clientMood: p.client_mood || p.clientMood,
      onTimeCompletionRate:
        p.on_time_completion_rate ?? p.onTimeCompletionRate ?? null,
      scheduleState: p.schedule_state || p.scheduleState,
      scheduleLabel: p.schedule_label || p.scheduleLabel,
      projectStarted: p.project_started ?? p.projectStarted ?? false,
      hasGetStartedConfirmation:
        p.has_get_started_confirmation ?? p.hasGetStartedConfirmation ?? false,
      completedTaskCount: p.completed_task_count ?? p.completedTaskCount ?? 0,
      totalTaskCount: p.total_task_count ?? p.totalTaskCount ?? 0,
      completedMilestoneCount:
        p.completed_milestone_count ?? p.completedMilestoneCount ?? 0,
      totalMilestoneCount:
        p.total_milestone_count ?? p.totalMilestoneCount ?? 0,
      revisions: p.revisions,
      bufferDays: p.buffer_days,
      recurringMaintenance: p.recurring_maintenance,
      prdContent: p.prd_content,
      styleContext: p.style_context,
      nextDeadlineDate:
        p.next_deadline_date || p.nextDeadlineDate || p.deadline,
      nextMilestoneName:
        p.next_milestone_name || p.nextMilestoneName || "Project Deadline",
    };
  } catch (err) {
    const local = getLocalProjectById(projectId);
    if (local) return local;
    return null;
  }
}

export async function getProjectUpdates(projectId: string) {
  try {
    const { data } = await getJson<any>(`/api/projects/${projectId}/updates`);
    return asArray(data).map((u: any) => ({
      id: u.id,
      projectId: u.project_id,
      date: u.sent_at,
      type: u.channel === "System" ? "System" : u.type,
      summary: u.summary,
      channel: u.channel || "System",
    }));
  } catch {
    return [];
  }
}

export async function getProjectMilestones(projectId: string) {
  try {
    const { data } = await getJson<any>(`/api/projects/${projectId}/timeline`);
    return asArray(data?.milestones).map((m: any) => ({
      id: m.id,
      projectId: m.project_id,
      name: m.name,
      dueDate: m.due_date,
      status: m.status,
      deliverablesCount: 0, // Fetch from tasks if needed
    }));
  } catch {
    return [];
  }
}

export async function getProjectTimelineTasks(projectId: string) {
  try {
    const { data } = await getJson<any>(`/api/projects/${projectId}/timeline`);
    return asArray(data?.tasks).map((t: any) => ({
      taskId: t.id,
      projectId: t.project_id,
      milestoneId: t.milestone_id,
      taskTitle: t.title,
      dueDate: t.due_date,
      status:
        t.status === "completed" || t.status === "achieved"
          ? "completed"
          : "pending",
    }));
  } catch {
    return [];
  }
}

export async function getProjectFiles(projectId: string) {
  try {
    const { data } = await getJson<any>(`/api/projects/${projectId}/files`);
    return asArray(data).map((f: any) => ({
      id: f.id,
      projectId: f.project_id,
      name: f.name,
      type: f.type,
      size: f.size,
      uploadedAt: f.uploaded_at,
    }));
  } catch {
    return [];
  }
}

export async function getProjectScope(projectId: string) {
  try {
    const { data } = await getJson<any>(`/api/projects/${projectId}/scope`);
    return {
      inScope: data
        .filter((s: any) => s.type === "inclusion")
        .map((s: any) => ({ id: s.id, label: s.label, note: s.note })),
      outOfScope: data
        .filter((s: any) => s.type === "exclusion")
        .map((s: any) => ({ id: s.id, label: s.label, note: s.note })),
      changes: data
        .filter((s: any) => s.type === "change")
        .map((s: any) => ({ id: s.id, label: s.label, note: s.note })),
    };
  } catch {
    return { inScope: [], outOfScope: [], changes: [] };
  }
}

export async function getProjectClosure(projectId: string) {
  try {
    const { data } = await getJson<any>(`/api/projects/${projectId}/closure`);
    return data;
  } catch {
    return { checklist_state: {} };
  }
}

export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export async function getPaymentSchedule(projectId?: string) {
  try {
    const url = projectId
      ? `/api/projects/${projectId}/payments`
      : "/api/payments";
    const result = await getJson<any>(url);
    const payments = projectId ? result.data : result.data.payments;

    return payments.map((p: any) => ({
      scheduleId: p.id,
      projectId: p.project_id,
      clientName: p.project?.client?.name || "Client",
      projectTitle: p.project?.title || "Project",
      type: p.type,
      amount: Number(p.amount),
      currency: p.currency,
      dueDate: p.due_date,
      status: p.status,
    }));
  } catch {
    return [];
  }
}

export async function getPaymentSummary() {
  try {
    const { data } = await getJson<any>("/api/payments");
    return data.summary;
  } catch {
    return { totalPaid: 0, upcoming: 0, overdue: 0 };
  }
}

export async function createPaymentRequest(data: any) {
  return postJson("/api/payments/request", data);
}

export async function updateTaskStatus(
  projectId: string,
  taskId: string,
  status: string,
) {
  return patchJson(`/api/projects/${projectId}/timeline/${taskId}`, { status });
}

export async function addProjectUpdate(projectId: string, update: any) {
  return postJson(`/api/projects/${projectId}/updates`, update);
}

export async function addProjectScopeItem(projectId: string, item: any) {
  return postJson(`/api/projects/${projectId}/scope`, item);
}

export async function addProjectFile(projectId: string, file: any) {
  return postJson(`/api/projects/${projectId}/files`, file);
}

export async function getProjectInvoices(projectId: string): Promise<Invoice[]> {
  void projectId;
  return [];
}

export async function getTodayTasks(): Promise<DashboardSummaryCard[]> {
  return getDashboardSummary();
}

export async function getDashboardSummary(): Promise<DashboardSummaryCard[]> {
  try {
    const { data } = await getJson<any>("/api/dashboard/summary");
    return asArray<DashboardSummaryCard>(data);
  } catch {
    return [];
  }
}

export async function getNotifications(): Promise<Notification[]> {
  return [];
}

export async function getAllTasks(): Promise<TimelineTask[]> {
  return [];
}

export async function getTasksByDate(dateStr: string) {
  const tasks = await getAllTasks();
  const targetDate = new Date(dateStr).toDateString();
  return tasks.filter((t) => new Date(t.dueDate).toDateString() === targetDate);
}

export async function getTasksGroupedByDate() {
  const tasks = await getAllTasks();
  const grouped: Record<string, any[]> = {};

  tasks.forEach((task) => {
    const dateKey = new Date(task.dueDate).toDateString();
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(task);
  });

  return grouped;
}

export async function getUpdateCenterItems(): Promise<UpdateCenterItem[]> {
  try {
    const [projects, waMessages] = await Promise.all([
      getProjects(),
      getAllWhatsAppMessages(),
    ]);

    if (!projects.length) {
      return [];
    }

    const latestByProject = new Map<
      string,
      { createdAt: string; content: string; kind: string }
    >();
    waMessages.forEach((message) => {
      const existing = latestByProject.get(message.projectId);
      if (
        !existing ||
        new Date(message.createdAt).getTime() >
          new Date(existing.createdAt).getTime()
      ) {
        latestByProject.set(message.projectId, {
          createdAt: message.createdAt,
          content: message.content,
          kind: message.messageType,
        });
      }
    });

    const latestUpdates = await Promise.all(
      projects.map(async (project: any) => {
        const updates = await getProjectUpdates(project.id);
        return {
          projectId: project.id,
          latest: updates.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
          )[0],
        };
      }),
    );

    latestUpdates.forEach(({ projectId, latest }) => {
      if (!latest) return;
      const existing = latestByProject.get(projectId);
      if (
        !existing ||
        new Date(latest.date).getTime() > new Date(existing.createdAt).getTime()
      ) {
        latestByProject.set(projectId, {
          createdAt: latest.date,
          content: latest.summary,
          kind:
            latest.channel === "System"
              ? "system"
              : String(latest.channel).toLowerCase(),
        });
      }
    });

    return projects.map((project: any): UpdateCenterItem => {
      const latestMessage = latestByProject.get(project.id);
      const messageType = latestMessage?.kind;
      const type: UpdateCenterItem["type"] =
        messageType === "deliverable"
          ? "deliverable"
          : messageType === "buffer_request" || messageType === "whatsapp"
            ? "buffer"
            : messageType === "approval_request" || messageType === "system"
              ? "approval"
              : "weekly";

      return {
        updateId: project.id,
        projectId: project.id,
        clientName: project.client?.name || "Client",
        projectTitle: project.projectTitle,
        type,
        contentPreview:
          latestMessage?.content ||
          project.projectDescription ||
          "Project communication history",
        sentAt:
          latestMessage?.createdAt ||
          project.projectStartDate ||
          new Date().toISOString(),
        autoMode: true,
      };
    });
  } catch {
    return [];
  }
}

export async function getPendingApprovals() {
  try {
    const { data } = await getJson<any>("/api/approvals");
    return asArray<ClientApprovalItem>(data);
  } catch {
    return [];
  }
}

export async function getClientCalls() {
  try {
    const { data } = await getJson<any>("/api/client-calls");
    return data || [];
  } catch {
    return [];
  }
}

export async function getUpcomingPayments() {
  const schedule = await getPaymentSchedule();
  return schedule
    .filter((p: any) => p.status === "scheduled")
    .sort(
      (a: any, b: any) =>
        new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    );
}

export async function getDuePayments() {
  const schedule = await getPaymentSchedule();
  return schedule
    .filter((p: any) => p.status === "due" || p.status === "overdue")
    .sort(
      (a: any, b: any) =>
        new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    );
}

export async function getPaymentTransactions() {
  // Mapping success status to 'success'
  const schedule = await getPaymentSchedule();
  return schedule
    .filter((p: any) => p.status === "paid")
    .map((p: any) => ({
      ...p,
      paidAt: p.dueDate,
      status: "success",
    }));
}

export async function getTotalPaidAmount() {
  const summary = await getPaymentSummary();
  return summary.totalPaid;
}

export function deriveClientMood(project: any) {
  return project.clientMood;
}

export async function getWhatsAppMessageHistory(projectId: string) {
  try {
    const { data } = await getJson<any>(
      `/api/whatsapp/send?projectId=${projectId}`,
    );
    return (data || []).map((m: any) => ({
      id: m.id,
      projectId: m.project_id,
      clientId: m.client_id,
      ownerId: m.owner_id,
      campaignName: m.campaign_name,
      templateName: m.template_name,
      messageType: m.message_type,
      content: m.content,
      status: m.status,
      direction: m.direction,
      aisensyMessageId: m.aisensy_message_id,
      createdAt: m.created_at,
      updatedAt: m.updated_at,
    }));
  } catch {
    return [];
  }
}
