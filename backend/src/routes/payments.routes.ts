import { Hono } from 'hono';
import { db, payments, projects, clients, updates } from '@freelancer-os/db';
import { and, asc, eq } from 'drizzle-orm';
import { requireUser } from '@/auth/requireUser';
import { createPaymentRequestSchema } from '@/validators/payments';
import { fail, ok, unauthorized, validationError } from '@/http/response';

const paymentsRoutes = new Hono();

paymentsRoutes.get('/', async (c) => {
  const user = requireUser(c);
  if (!user) return unauthorized(c);
  const rows = await db
    .select({
      payment: payments,
      projectTitle: projects.title,
      clientName: clients.name,
    })
    .from(payments)
    .innerJoin(projects, eq(payments.projectId, projects.id))
    .leftJoin(clients, eq(projects.clientId, clients.id))
    .where(eq(payments.ownerId, user.sub))
    .orderBy(asc(payments.dueDate));

  return ok(
    c,
    rows.map((row) => ({
      ...row.payment,
      project: {
        title: row.projectTitle,
        client: { name: row.clientName },
      },
    })),
  );
});

paymentsRoutes.post('/request', async (c) => {
  const user = requireUser(c);
  if (!user) return unauthorized(c);
  const body = await c.req.json().catch(() => null);
  const parsed = createPaymentRequestSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(c, parsed.error.format());
  }

  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, parsed.data.projectId), eq(projects.ownerId, user.sub)),
  });

  if (!project) {
    return fail(c, 'Project not found', 404);
  }

  const [payment] = await db
    .insert(payments)
    .values({
      projectId: parsed.data.projectId,
      ownerId: user.sub,
      type: parsed.data.type,
      amount: parsed.data.amount,
      currency: 'INR',
      dueDate: parsed.data.dueDate,
      status: 'scheduled',
      note: parsed.data.note,
      channel: parsed.data.channel,
    })
    .returning();

  await db.insert(updates).values({
    projectId: parsed.data.projectId,
    ownerId: user.sub,
    type: 'deliverable',
    summary: `Payment request sent for INR ${parsed.data.amount} due on ${parsed.data.dueDate}.`,
    channel: parsed.data.channel === 'whatsapp' ? 'WhatsApp' : 'Email',
    sentAt: new Date(),
    whatsappStatus: JSON.stringify({
      requestType: 'payment',
      paymentId: payment.id,
      status: payment.status,
      amount: parsed.data.amount,
      dueDate: parsed.data.dueDate,
      paymentType: parsed.data.type,
    }),
  });

  return ok(c, payment, null, 201);
});

export default paymentsRoutes;
