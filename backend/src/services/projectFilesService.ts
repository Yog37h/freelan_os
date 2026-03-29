// ✅ VERIFIED: Files service now serves manual grouped deliverable links instead of Drive-backed folders. Manual test: load a project files view after plan confirmation and confirm grouped deliverable links are returned without Google state.
import * as filesDb from '@/db/filesDb';
import { getProjectFilesView } from '@/services/projectFilesViewService';

export async function getFiles(projectId: string, ownerId: string) {
  return getProjectFilesView(projectId, ownerId);
}

export async function addFile(
  projectId: string,
  ownerId: string,
  data: Record<string, unknown>,
) {
  return filesDb.createProjectFile({
    ...(data as {
      name: string;
      type?: string;
      size?: string;
      storagePath?: string;
    }),
    projectId,
    ownerId,
    uploadedAt: new Date(),
  });
}
