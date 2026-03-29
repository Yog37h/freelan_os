import { z } from 'zod';

export const createScopeItemSchema = z.object({
    type: z.enum(['inclusion', 'exclusion', 'change']),
    label: z.string().min(1),
    note: z.string().optional(),
});
