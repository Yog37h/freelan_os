import { api } from '@/lib/axios';
import { ProjectFilesView } from '@/types';

export async function fetchFiles(projectId: string) {
  const res = await api.get(`/api/projects/${projectId}/files`);
  return res.data.data as ProjectFilesView;
}

export async function postFileMetadata(
  projectId: string,
  payload: { name: string; type?: string; size?: string; storagePath?: string },
) {
  const res = await api.post(`/api/projects/${projectId}/files`, payload);
  return res.data.data;
}
