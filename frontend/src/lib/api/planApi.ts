import { api } from '@/lib/axios';
import { TimelineTask } from '@/types';

export interface TimelinePromptInput {
  projectId: string;
  projectTitle: string;
  projectDescription: string;
  prdContent: string;
  freelancerContext: string;
  startDate: string;
  deadline: string;
  bufferDays: number;
  revisions: number;
  cost: number;
  currency: string;
  updateMode: 'weekly' | 'milestone';
}

export async function generatePlanClientSide(
  promptInput: TimelinePromptInput,
): Promise<{ plan_id: string; preview: any }> {
  const res = await api.post('/api/timeline/generate', promptInput);
  return res.data.data as { plan_id: string; preview: any };
}

export async function generatePlan(
  projectId: string,
  body: { prd_markdown: string; freelancer_context: string; update_mode: 'weekly' | 'milestone' },
) {
  const res = await api.post('/api/timeline/generate', {
    projectId,
    projectTitle: '',
    projectDescription: '',
    prdContent: body.prd_markdown,
    freelancerContext: body.freelancer_context,
    startDate: '',
    deadline: '',
    bufferDays: 0,
    revisions: 0,
    cost: 0,
    currency: 'INR',
    updateMode: body.update_mode,
  });
  return res.data.data as { plan_id: string; preview: any };
}

export async function confirmPlan(
  projectId: string,
  body: { plan_id: string; edited_preview_json: any },
) {
  const res = await api.post(`/api/projects/${projectId}/plan/confirm`, body);
  return res.data.data;
}

export async function fetchPlanTimeline(projectId: string) {
  const res = await api.get(`/api/projects/${projectId}/plan/timeline`);
  return res.data.data as { plan: any; buckets: any[] };
}

export async function fetchWorkspacePlanTasks() {
  const res = await api.get('/api/timeline/tasks');
  return res.data.data as TimelineTask[];
}

export async function reorderBuckets(
  projectId: string,
  body: { bucket_order: string[]; auto_shift_dates: boolean },
) {
  const res = await api.patch(`/api/projects/${projectId}/plan/timeline`, body);
  return res.data.data;
}

export async function updateBucket(
  projectId: string,
  bucketId: string,
  body: { title?: string; start_date?: string; end_date?: string },
) {
  const res = await api.patch(`/api/projects/${projectId}/plan/bucket/${bucketId}`, body);
  return res.data.data;
}

export async function addDeliverable(
  projectId: string,
  bucketId: string,
  body: { title: string; acceptance_criteria?: string[] },
) {
  const res = await api.post(`/api/projects/${projectId}/plan/bucket/${bucketId}/deliverables`, body);
  return res.data.data;
}

export async function updateDeliverable(
  projectId: string,
  deliverableId: string,
  body: { title?: string; acceptance_criteria?: string[] },
) {
  const res = await api.patch(`/api/projects/${projectId}/plan/deliverable/${deliverableId}`, body);
  return res.data.data;
}

export async function deleteDeliverable(projectId: string, deliverableId: string) {
  const res = await api.delete(`/api/projects/${projectId}/plan/deliverable/${deliverableId}`);
  return res.data.data;
}

export async function addPlanTask(
  projectId: string,
  bucketId: string,
  body: { title: string; due_date: string; deliverable_id?: string },
) {
  const res = await api.post(`/api/projects/${projectId}/plan/bucket/${bucketId}/tasks`, body);
  return res.data.data;
}

export async function updatePlanTask(
  projectId: string,
  taskId: string,
  body: {
    title?: string;
    due_date?: string;
    deliverable_id?: string | null;
    status?: 'pending' | 'in_progress' | 'completed';
  },
) {
  const res = await api.patch(`/api/projects/${projectId}/plan/task/${taskId}`, body);
  return res.data.data;
}

export async function deletePlanTask(projectId: string, taskId: string) {
  const res = await api.delete(`/api/projects/${projectId}/plan/task/${taskId}`);
  return res.data.data;
}

export async function shareDeliverable(
  projectId: string,
  deliverableId: string,
) {
  const res = await api.post(
    `/api/projects/${projectId}/plan/deliverable/${deliverableId}/share`,
  );
  return res.data.data as {
    shared: boolean;
    alreadySent?: boolean;
    deliverableId: string;
    folderUrl?: string;
  };
}
