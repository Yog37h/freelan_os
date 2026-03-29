import type { WhatsAppMessage, WhatsAppMessageType } from '@/types';
import { api } from '@/lib/axios';

const BASE = '/api/whatsapp/send';

export interface WhatsAppSendResult {
  data: {
    sent: boolean;
    messageId?: string;
    error?: string;
  } | null;
  error: { message: string } | null;
}

export async function sendWhatsAppMessage(
  projectId: string,
  messageType: WhatsAppMessageType,
): Promise<WhatsAppSendResult> {
  try {
    const response = await api.post(BASE, { projectId, messageType });
    return response.data;
  } catch (error) {
    return {
      data: null,
      error: { message: error instanceof Error ? error.message : 'Network error' },
    };
  }
}

function mapMessage(m: Record<string, unknown>): WhatsAppMessage {
  return {
    id: String(m.id),
    projectId: String(m.projectId ?? m.project_id ?? ''),
    clientId: String(m.clientId ?? m.client_id ?? ''),
    ownerId: String(m.ownerId ?? m.owner_id ?? ''),
    campaignName: String(m.campaignName ?? m.campaign_name ?? ''),
    templateName: String(m.templateName ?? m.template_name ?? ''),
    messageType: m.messageType as WhatsAppMessage['messageType'],
    content: String(m.content ?? ''),
    status: m.status as WhatsAppMessage['status'],
    direction: m.direction as WhatsAppMessage['direction'],
    aisensyMessageId: m.aisensyMessageId as string | undefined,
    createdAt: String(m.createdAt ?? m.created_at ?? ''),
    updatedAt: String(m.updatedAt ?? m.updated_at ?? ''),
  };
}

export async function getWhatsAppMessages(projectId: string): Promise<WhatsAppMessage[]> {
  try {
    const response = await api.get(BASE, { params: { projectId } });
    return (response.data.data || []).map(mapMessage);
  } catch {
    return [];
  }
}

export async function getAllWhatsAppMessages(): Promise<WhatsAppMessage[]> {
  try {
    const response = await api.get(BASE);
    return (response.data.data || []).map(mapMessage);
  } catch {
    return [];
  }
}
