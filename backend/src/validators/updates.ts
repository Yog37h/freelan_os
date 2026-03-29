import { z } from 'zod';

export const createUpdateSchema = z.object({
    type: z.enum(['weekly', 'deliverable', 'buffer', 'approval']),
    summary: z.string().min(1),
    channel: z.enum(['WhatsApp', 'Email']).default('WhatsApp'),
    metadata: z.record(z.any()).optional(),
});
