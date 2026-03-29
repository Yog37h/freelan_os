import { api } from '@/lib/axios';
import { ClientCallItem } from '@/types';

export async function scheduleClientCall(
  requestId: string,
  body: {
    startsAt: string;
    endsAt: string;
    timezone: string;
    agenda: string;
  },
) {
  const response = await api.post(`/api/client-calls/${requestId}/schedule`, body);
  return response.data.data as ClientCallItem;
}
