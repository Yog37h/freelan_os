import { api } from '@/lib/axios';

export async function fetchTimeline(projectId: string) {
  const res = await api.get(`/api/projects/${projectId}/timeline`);
  return res.data.data as { milestones: any[]; tasks: any[] };
}

export async function addMilestone(
  projectId: string,
  payload: { name: string; dueDate: string; status?: string },
) {
  const res = await api.post(`/api/projects/${projectId}/timeline`, { type: 'milestone', ...payload });
  return res.data.data;
}

export async function addTask(
  projectId: string,
  payload: { title: string; dueDate: string; milestoneId?: string; status?: string },
) {
  const res = await api.post(`/api/projects/${projectId}/timeline`, { type: 'task', ...payload });
  return res.data.data;
}

export async function patchTaskStatus(
  projectId: string,
  taskId: string,
  status: 'pending' | 'in_progress' | 'completed' | 'achieved',
) {
  const res = await api.patch(`/api/projects/${projectId}/timeline/${taskId}`, { status });
  return res.data.data;
}
