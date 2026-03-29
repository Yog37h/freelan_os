import * as scopeDb from '@/db/scopeDb';

export async function getScopeItems(projectId: string) {
  return scopeDb.getScopeItems(projectId);
}

export async function addScopeItem(
  projectId: string,
  ownerId: string,
  data: Record<string, unknown>,
) {
  return scopeDb.createScopeItem({
    ...(data as {
      label: string;
      type?: string;
      note?: string;
    }),
    projectId,
    ownerId,
  });
}
