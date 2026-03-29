import { db, scopeItems } from '@freelancer-os/db';
import { asc, eq } from 'drizzle-orm';

export async function getScopeItems(projectId: string) {
  return db.query.scopeItems.findMany({
    where: eq(scopeItems.projectId, projectId),
    orderBy: [asc(scopeItems.createdAt)],
  });
}

export async function createScopeItem(scopeData: typeof scopeItems.$inferInsert) {
  const [created] = await db.insert(scopeItems).values(scopeData).returning();
  return created;
}

export async function createScopeItems(items: Array<typeof scopeItems.$inferInsert>) {
  if (items.length === 0) {
    return [];
  }

  return db.insert(scopeItems).values(items).returning();
}
