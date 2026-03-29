import * as projectsDb from '@/db/projectsDb';

export async function assertProjectOwned(userId: string, projectId: string) {
  const project = await projectsDb.getProjectById(userId, projectId);

  if (!project) {
    return false;
  }

  return true;
}
