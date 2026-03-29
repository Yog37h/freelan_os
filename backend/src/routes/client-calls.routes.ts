// ✅ VERIFIED: Client-call scheduling now stores schedules directly in DB and sends WhatsApp with a placeholder call link instead of creating Google Meet events. Manual test: schedule/reschedule a client call, confirm the row updates, google ids stay null, and the client_call message sends.
import { Hono } from "hono";
import { z } from "zod";
import { requireUser } from "@/auth/requireUser";
import { fail, ok, unauthorized, validationError } from "@/http/response";
import { listClientCalls } from "@/services/clientActionQueryService";
import {
  createOrUpdateClientCallSchedule,
  markClientCallScheduleSent,
} from "@/services/clientCallScheduleService";
import {
  buildProjectContext,
  sendClientCallMessage,
} from "@/services/whatsappService";

const clientCallsRoutes = new Hono();
const scheduleSchema = z.object({
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  timezone: z.string().min(1),
  agenda: z.string().min(1),
});

clientCallsRoutes.get("/", async (c) => {
  const user = requireUser(c);
  if (!user) return unauthorized(c);

  const items = await listClientCalls(user.sub);
  return ok(c, items);
});

clientCallsRoutes.post("/:requestId/schedule", async (c) => {
  const user = requireUser(c);
  if (!user) return unauthorized(c);

  const requestId = c.req.param("requestId");
  const body = await c.req.json().catch(() => null);
  const parsed = scheduleSchema.safeParse(body);

  if (!parsed.success) {
    return validationError(c, parsed.error.format());
  }

  const schedule = await createOrUpdateClientCallSchedule({
    requestId,
    ownerId: user.sub,
    startIso: parsed.data.startsAt,
    endIso: parsed.data.endsAt,
    timezone: parsed.data.timezone,
    agenda: parsed.data.agenda,
  });

  const ctx = await buildProjectContext(schedule.projectId, user.sub);
  if (!ctx) {
    return fail(
      c,
      "Cannot send client call message because client WhatsApp is missing",
      400,
    );
  }

  const startsAt = new Date(schedule.startsAt);
  const callDate = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: schedule.timezone,
  }).format(startsAt);
  const callTime = new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: schedule.timezone,
    timeZoneName: "short",
  }).format(startsAt);

  const messageResult = await sendClientCallMessage(
    ctx,
    {
      freelancerName: ctx.freelancerName,
      callDate,
      callTime,
      duration: `${schedule.durationMinutes} minutes`,
      agenda: schedule.agenda || parsed.data.agenda,
      meetUrl: schedule.meetUrl || "",
    },
    requestId,
  );

  if (!messageResult.success) {
    return fail(
      c,
      messageResult.error || "Call scheduled but WhatsApp send failed",
      400,
    );
  }

  await markClientCallScheduleSent(requestId);
  const items = await listClientCalls(user.sub);
  const item = items.find((row) => row.clientActionRequestId === requestId) ?? null;
  return ok(c, item ?? schedule);
});

export default clientCallsRoutes;
