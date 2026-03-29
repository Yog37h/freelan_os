import { api } from '@/lib/axios';

export async function fetchProjectPayments(projectId: string) {
  const res = await api.get(`/api/projects/${projectId}/payments`);
  return res.data.data as any[];
}

export async function createPaymentRequest(payload: {
  projectId: string;
  type: 'upfront' | 'milestone' | 'monthly' | 'weekly' | 'one-time' | 'custom';
  amount: number;
  dueDate: string;
  note?: string;
  channel?: 'whatsapp' | 'email';
}) {
  const res = await api.post('/api/payments/request', payload);
  return res.data.data;
}
