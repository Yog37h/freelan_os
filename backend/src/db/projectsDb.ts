import { db, clients, projects } from '@freelancer-os/db';
import { and, desc, eq, ilike, inArray, ne, sql } from 'drizzle-orm';

export async function getProjects(
  userId: string,
  {
    page = 1,
    limit = 10,
    q,
    status,
  }: { page?: number; limit?: number; q?: string; status?: string },
) {
  const filters = [eq(projects.ownerId, userId)];

  if (q) {
    filters.push(ilike(projects.title, `%${q}%`));
  }

  if (!status || status.toLowerCase() === 'all') {
    filters.push(ne(projects.status, 'Dropped'));
  } else {
    const normalizedStatus = status.toLowerCase();

    if (normalizedStatus === 'active') {
      filters.push(
        sql`${projects.status} not in ('Completed', 'Dropped', 'Drop Pending Ack')`,
      );
    } else if (normalizedStatus === 'completed') {
      filters.push(eq(projects.status, 'Completed'));
    } else if (normalizedStatus === 'dropped') {
      filters.push(eq(projects.status, 'Dropped'));
    } else if (normalizedStatus === 'delayed') {
      filters.push(eq(projects.status, 'Delayed'));
    } else if (normalizedStatus === 'recurring') {
      filters.push(eq(projects.status, 'Recurring'));
    } else {
      filters.push(eq(projects.status, status));
    }
  }

  const rows = await db
    .select({
      project: projects,
      client: clients,
      total: sql<number>`count(*) over()`,
    })
    .from(projects)
    .leftJoin(clients, eq(projects.clientId, clients.id))
    .where(and(...filters))
    .orderBy(desc(projects.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);

  return {
    data: rows.map((row) => ({
      ...row.project,
      client: row.client,
    })),
    count: rows[0]?.total ?? 0,
  };
}

export async function getProjectById(userId: string, projectId: string) {
  const row = await db
    .select({
      project: projects,
      client: clients,
    })
    .from(projects)
    .leftJoin(clients, eq(projects.clientId, clients.id))
    .where(and(eq(projects.id, projectId), eq(projects.ownerId, userId)))
    .limit(1);

  if (!row[0]) {
    return null;
  }

  return {
    ...row[0].project,
    client: row[0].client,
  };
}

export async function createProject(projectData: typeof projects.$inferInsert) {
  const [created] = await db.insert(projects).values(projectData).returning();
  return created;
}

export async function updateProject(
  userId: string,
  projectId: string,
  projectData: Partial<typeof projects.$inferInsert>,
) {
  const [updated] = await db
    .update(projects)
    .set({
      ...projectData,
      updatedAt: new Date(),
    })
    .where(and(eq(projects.id, projectId), eq(projects.ownerId, userId)))
    .returning();

  return updated ?? null;
}
