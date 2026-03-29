import { api } from '@/lib/axios';

export async function fetchProjects(params?: { status?: string; q?: string }) {
  const res = await api.get('/api/projects', { params });
  return res.data.data as any[];
}

export async function createProject(payload: Record<string, unknown>) {
  const res = await api.post('/api/projects', payload);
  return res.data.data;
}
