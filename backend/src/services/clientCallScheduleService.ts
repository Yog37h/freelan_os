// ✅ VERIFIED: Replaced Google Meet scheduling with direct DB-backed client call scheduling plus a static placeholder call link. Manual test: schedule or reschedule a client call, confirm the DB row updates, google ids remain null, and WhatsApp sends the placeholder URL.
import { clientActionRequests, clientCallSchedules, db } from "@freelancer-os/db";
import { and, eq } from "drizzle-orm";
import { getClientCallPlaceholderUrl } from "@/lib/placeholderLinks";

type CreateScheduleInput = {
  requestId: string;
  ownerId: string;
  startIso: string;
  endIso: string;
  timezone: string;
  agenda: string;
};

export async function createOrUpdateClientCallSchedule(
  input: CreateScheduleInput,
) {
  const request = await db.query.clientActionRequests.findFirst({
    where: and(
      eq(clientActionRequests.id, input.requestId),
      eq(clientActionRequests.ownerId, input.ownerId),
    ),
    with: {
      client: true,
    },
  });

  if (!request) {
    throw new Error("Client call request not found");
  }

  const startsAt = new Date(input.startIso);
  const endsAt = new Date(input.endIso);
  const durationMinutes = Math.max(
    15,
    Math.round((endsAt.getTime() - startsAt.getTime()) / 60000),
  );
  const placeholderUrl = getClientCallPlaceholderUrl();

  const existingSchedule = await db.query.clientCallSchedules.findFirst({
    where: eq(clientCallSchedules.clientActionRequestId, request.id),
  });

  if (existingSchedule) {
    const [updated] = await db
      .update(clientCallSchedules)
      .set({
        timezone: input.timezone,
        startsAt,
        endsAt,
        durationMinutes,
        agenda: input.agenda,
        status: "scheduled",
        googleCalendarId: null,
        googleEventId: null,
        meetUrl: placeholderUrl,
        invitedClientEmail: request.client?.email || null,
        updatedAt: new Date(),
      })
      .where(eq(clientCallSchedules.id, existingSchedule.id))
      .returning();

    return updated;
  }

  const [created] = await db
    .insert(clientCallSchedules)
    .values({
      clientActionRequestId: request.id,
      projectId: request.projectId,
      ownerId: input.ownerId,
      clientId: request.clientId,
      timezone: input.timezone,
      startsAt,
      endsAt,
      durationMinutes,
      agenda: input.agenda,
      status: "scheduled",
      googleCalendarId: null,
      googleEventId: null,
      meetUrl: placeholderUrl,
      invitedClientEmail: request.client?.email || null,
    })
    .returning();

  return created;
}

export async function markClientCallScheduleSent(requestId: string) {
  await db
    .update(clientCallSchedules)
    .set({
      lastSentAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(clientCallSchedules.clientActionRequestId, requestId));
}
