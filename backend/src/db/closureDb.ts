import { db, closures } from '@freelancer-os/db';
import { eq } from 'drizzle-orm';

export async function getClosure(projectId: string) {
  return db.query.closures.findFirst({
    where: eq(closures.projectId, projectId),
  });
}

export async function upsertClosure(closureData: typeof closures.$inferInsert) {
  const existing = await getClosure(closureData.projectId);

  if (existing) {
    const [updated] = await db
      .update(closures)
      .set({
        ...closureData,
        updatedAt: new Date(),
      })
      .where(eq(closures.projectId, closureData.projectId))
      .returning();

    return updated;
  }

  const [created] = await db.insert(closures).values(closureData).returning();
  return created;
}
