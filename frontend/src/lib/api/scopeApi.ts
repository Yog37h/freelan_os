import { api } from '@/lib/axios';

export async function fetchScope(projectId: string) {
  const res = await api.get(`/api/projects/${projectId}/scope`);
  const items = res.data.data as any[];

  return {
    inScope: items.filter((s) => s.type === 'inclusion').map((s) => ({ id: s.id, label: s.label, note: s.note })),
    outOfScope: items.filter((s) => s.type === 'exclusion').map((s) => ({ id: s.id, label: s.label, note: s.note })),
    changes: items.filter((s) => s.type === 'change').map((s) => ({ id: s.id, label: s.label, note: s.note })),
  };
}

export async function postScopeItem(
  projectId: string,
  payload: { type: 'inclusion' | 'exclusion' | 'change'; label: string; note?: string },
) {
  const res = await api.post(`/api/projects/${projectId}/scope`, payload);
  return res.data.data;
}
