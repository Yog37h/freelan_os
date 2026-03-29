import { db, clients } from '@freelancer-os/db';
import { eq } from 'drizzle-orm';

export async function createClient(clientData: typeof clients.$inferInsert) {
  const [created] = await db.insert(clients).values(clientData).returning();
  return created;
}

export async function getClientById(clientId: string) {
  return db.query.clients.findFirst({
    where: eq(clients.id, clientId),
  });
}
