import { z } from 'zod';

// ---- Legacy schemas (existing milestone/task system) ----

export const createMilestoneSchema = z.object({
    name: z.string().min(1),
    dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    status: z.enum(['Completed', 'Upcoming', 'In Progress', 'Delayed']).default('Upcoming'),
});

export const createTaskSchema = z.object({
    milestoneId: z.string().uuid().optional(),
    title: z.string().min(1),
    dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    status: z.enum(['pending', 'completed', 'in_progress', 'achieved']).default('pending'),
});

export const updateTaskStatusSchema = z.object({
    status: z.enum(['pending', 'completed', 'in_progress', 'achieved']),
});

// ---- AI Timeline Feature Schemas ----

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD');

// Deliverable in AI output
const aiDeliverableSchema = z.object({
    temp_id: z.string(),
    title: z.string().min(1),
    acceptance_criteria: z.array(z.string()).default([]),
});

// Task in AI output
const aiTaskSchema = z.object({
    temp_id: z.string(),
    title: z.string().min(1),
    due_date: dateStr,
});

// Bucket (milestone or week) in AI output
const aiBucketSchema = z.object({
    temp_id: z.string(),
    title: z.string().optional(),
    label: z.string().optional(),
    start_date: dateStr,
    end_date: dateStr,
    deliverables: z.array(aiDeliverableSchema).default([]),
    tasks: z.array(aiTaskSchema).default([]),
    assumptions: z.array(z.string()).default([]),
    risks: z.array(z.string()).default([]),
});

// Message templates
const messageTemplatesSchema = z.object({
    kickoff: z.string().default(''),
    weekly_update: z.string().default(''),
    milestone_achieved: z.string().default(''),
    approval_request: z.string().default(''),
    buffer_request: z.string().default(''),
    change_request: z.string().default(''),
}).passthrough();

// Summary
const aiSummarySchema = z.object({
    total_milestones: z.number().optional(),
    total_weeks: z.number().optional(),
    total_tasks: z.number().optional(),
    estimated_hours: z.number().optional(),
}).passthrough();

// Full AI timeline output — union of milestone and weekly modes
export const aiTimelineOutputSchema = z.discriminatedUnion('mode', [
    z.object({
        mode: z.literal('milestone'),
        summary: aiSummarySchema.optional(),
        milestones: z.array(aiBucketSchema).min(1),
        message_templates: messageTemplatesSchema.optional(),
    }),
    z.object({
        mode: z.literal('weekly'),
        summary: aiSummarySchema.optional(),
        weeks: z.array(aiBucketSchema).min(1),
        message_templates: messageTemplatesSchema.optional(),
    }),
]);

export type AITimelineOutput = z.infer<typeof aiTimelineOutputSchema>;

// ---- API Request Validators ----

export const generatePlanSchema = z.object({
    prd_markdown: z.string().min(1, 'PRD content is required'),
    freelancer_context: z.string().default(''),
    update_mode: z.enum(['weekly', 'milestone']),
});

export type GeneratePlanInput = z.infer<typeof generatePlanSchema>;

export const confirmPlanSchema = z.object({
    plan_id: z.string().uuid(),
    edited_preview_json: aiTimelineOutputSchema,
});

export type ConfirmPlanInput = z.infer<typeof confirmPlanSchema>;

export const reorderBucketsSchema = z.object({
    bucket_order: z.array(z.string().uuid()).min(1),
    auto_shift_dates: z.boolean().default(true),
});

export const updateBucketSchema = z.object({
    title: z.string().min(1).optional(),
    start_date: dateStr.optional(),
    end_date: dateStr.optional(),
});

export const createDeliverableSchema = z.object({
    title: z.string().min(1),
    acceptance_criteria: z.array(z.string()).default([]),
});

export const updateDeliverableSchema = z.object({
    title: z.string().min(1).optional(),
    acceptance_criteria: z.array(z.string()).optional(),
});

export const createPlanTaskSchema = z.object({
    title: z.string().min(1),
    due_date: dateStr,
    deliverable_id: z.string().uuid().optional(),
});

export const updatePlanTaskSchema = z.object({
    title: z.string().min(1).optional(),
    due_date: dateStr.optional(),
    deliverable_id: z.string().uuid().nullable().optional(),
    status: z.enum(['pending', 'in_progress', 'completed']).optional(),
});
