import { api } from "@/lib/axios";

export async function fetchClosure(projectId: string) {
  const res = await api.get(`/api/projects/${projectId}/closure`);
  return res.data.data as {
    checklist_state?: Record<string, boolean>;
    closed_at?: string | null;
  };
}

export async function saveClosureChecklist(
  projectId: string,
  checklistState: Record<string, boolean>,
) {
  const res = await api.post(`/api/projects/${projectId}/closure`, {
    checklist_state: checklistState,
  });
  return res.data.data;
}

export async function closeProject(projectId: string) {
  const res = await api.post(`/api/projects/${projectId}/closure/close`);
  return res.data.data;
}

export async function dropProject(projectId: string, reason: string) {
  const res = await api.post(`/api/projects/${projectId}/closure/drop`, {
    reason,
  });
  return res.data.data;
}
