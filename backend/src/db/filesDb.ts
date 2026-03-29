import { db, projectFiles } from '@freelancer-os/db';
import { desc, eq } from 'drizzle-orm';

export async function getProjectFiles(projectId: string) {
  return db.query.projectFiles.findMany({
    where: eq(projectFiles.projectId, projectId),
    orderBy: [desc(projectFiles.uploadedAt)],
  });
}

export async function createProjectFile(fileData: typeof projectFiles.$inferInsert) {
  const [created] = await db.insert(projectFiles).values(fileData).returning();
  return created;
}
