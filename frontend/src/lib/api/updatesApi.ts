import { api } from '@/lib/axios';

export async function fetchUpdates(projectId: string) {
  const res = await api.get(`/api/projects/${projectId}/updates`);
  return res.data.data as any[];
}

export async function postUpdate(
  projectId: string,
  payload: {
    type: 'weekly' | 'deliverable' | 'buffer' | 'approval';
    summary: string;
    channel?: 'WhatsApp' | 'Email';
    metadata?: Record<string, unknown>;
  },
) {
  const res = await api.post(`/api/projects/${projectId}/updates`, payload);
  return res.data.data;
}
