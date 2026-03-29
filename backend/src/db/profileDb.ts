import { db, profiles } from '@freelancer-os/db';
import { and, eq, ne } from 'drizzle-orm';

export async function getProfileByUserId(userId: string) {
  return db.query.profiles.findFirst({
    where: eq(profiles.id, userId),
  });
}

export async function updateProfile(
  userId: string,
  profileData: Partial<typeof profiles.$inferInsert>,
) {
  const [updated] = await db
    .update(profiles)
    .set({
      ...profileData,
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, userId))
    .returning();

  return updated;
}

export async function checkUsernameAvailability(username: string, excludeUserId?: string) {
  const existing = await db.query.profiles.findFirst({
    where: excludeUserId
      ? and(eq(profiles.username, username), ne(profiles.id, excludeUserId))
      : eq(profiles.username, username),
    columns: { id: true },
  });

  return !existing;
}
