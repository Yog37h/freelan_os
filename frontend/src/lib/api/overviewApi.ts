import { api } from '@/lib/axios';

export async function fetchProjectOverview(projectId: string) {
  const res = await api.get(`/api/projects/${projectId}/overview`);
  return res.data.data;
}

export async function patchProjectOverview(projectId: string, payload: Record<string, unknown>) {
  const res = await api.patch(`/api/projects/${projectId}/overview`, payload);
  return res.data.data;
}
