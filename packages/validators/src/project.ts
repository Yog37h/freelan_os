import { z } from 'zod';

export const projectStatusSchema = z.enum(['Active', 'Completed', 'Delayed', 'Recurring', 'At Risk', 'On Track']);
export const projectTypeSchema = z.enum(['Fixed', 'Recurring']);
export const clientMoodSchema = z.enum(['Healthy', 'Watch', 'Risk']);
export const recurringFrequencySchema = z.enum(['Biweekly', 'Monthly', 'Quarterly', 'Ad-hoc', 'No']);

export const createClientSchema = z.object({
    name: z.string().min(1),
    businessName: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    whatsapp: z.string().optional(),
});

export const createProjectSchema = z.object({
    clientId: z.string().uuid().optional(), // If already exists
    client: createClientSchema.optional(), // If creating new client
    title: z.string().min(1),
    description: z.string().optional(),
    startDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    deadline: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    type: projectTypeSchema,
    cost: z.number().nonnegative(),
    currency: z.string().default('INR'),
    paymentTerms: z.string().optional(),
    revisions: z.number().int().nonnegative().default(0),
    bufferDays: z.number().int().nonnegative().default(0),
    recurringMaintenance: recurringFrequencySchema.optional(),
    prdContent: z.string().optional(),
    styleContext: z.string().optional(),
});

export const updateProjectOverviewSchema = z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    status: projectStatusSchema.optional(),
    clientMood: clientMoodSchema.optional(),
    progressPercent: z.number().int().min(0).max(100).optional(),
});

export const createMilestoneSchema = z.object({
    name: z.string().min(1),
    dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    status: z.enum(['Completed', 'Upcoming', 'In Progress', 'Delayed']).default('Upcoming'),
});

export const createTaskSchema = z.object({
    milestoneId: z.string().uuid().optional(),
    title: z.string().min(1),
    dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    status: z.enum(['pending', 'completed', 'in-progress', 'achieved']).default('pending'),
});

export const updateTaskStatusSchema = z.object({
    status: z.enum(['pending', 'completed', 'in-progress', 'achieved']),
});

export const createUpdateSchema = z.object({
    type: z.enum(['weekly', 'deliverable', 'buffer', 'approval']),
    summary: z.string().min(1),
    channel: z.enum(['WhatsApp', 'Email']).default('WhatsApp'),
});

export const createFileMetadataSchema = z.object({
    name: z.string().min(1),
    type: z.string().optional(),
    size: z.string().optional(),
    storagePath: z.string().optional(),
});

export const createScopeItemSchema = z.object({
    type: z.enum(['inclusion', 'exclusion', 'change']),
    label: z.string().min(1),
    note: z.string().optional(),
});

export const createPaymentRequestSchema = z.object({
    projectId: z.string().uuid(),
    type: z.enum(['upfront', 'milestone', 'monthly', 'weekly', 'one-time', 'custom']),
    amount: z.number().positive(),
    dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    note: z.string().optional(),
    channel: z.enum(['whatsapp', 'email']).default('whatsapp'),
});

export const paginationSchema = z.object({
    page: z.string().regex(/^\d+$/).default('1').transform(Number),
    limit: z.string().regex(/^\d+$/).default('10').transform(Number),
    q: z.string().optional(),
    status: z.string().optional(),
});
