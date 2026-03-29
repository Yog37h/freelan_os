import { z } from 'zod';

export const createPaymentRequestSchema = z.object({
    projectId: z.string().uuid(),
    type: z.enum(['upfront', 'milestone', 'monthly', 'weekly', 'one-time', 'custom']),
    amount: z.number().positive(),
    dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    note: z.string().optional(),
    channel: z.enum(['whatsapp', 'email']).default('whatsapp'),
});
