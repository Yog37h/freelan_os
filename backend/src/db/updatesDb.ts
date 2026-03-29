import { db, updates } from "@freelancer-os/db";
import { desc, eq, inArray } from "drizzle-orm";

export async function getUpdates(projectId: string) {
  return db.query.updates.findMany({
    where: eq(updates.projectId, projectId),
    orderBy: [desc(updates.sentAt)],
  });
}

export async function createUpdate(updateData: typeof updates.$inferInsert) {
  const [created] = await db.insert(updates).values(updateData).returning();
  return created;
}

export async function updateUpdate(
  updateId: string,
  updateData: Partial<typeof updates.$inferInsert>,
) {
  const [updated] = await db
    .update(updates)
    .set(updateData)
    .where(eq(updates.id, updateId))
    .returning();

  return updated ?? null;
}

export async function getRequestUpdates(projectId: string) {
  return db.query.updates.findMany({
    where: (table, { and }) =>
      and(
        eq(table.projectId, projectId),
        inArray(table.type, ["approval", "buffer"]),
      ),
    orderBy: [desc(updates.sentAt)],
  });
}
