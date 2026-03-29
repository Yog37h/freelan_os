import { z } from "zod";

export const projectIdSchema = z.object({
  projectId: z.string().uuid("projectId must be a valid UUID"),
});

export const projectStatusSchema = z.enum([
  "Active",
  "Completed",
  "Drop Pending Ack",
  "Dropped",
  "Delayed",
  "Recurring",
  "At Risk",
  "On Track",
  "Not Yet Started",
  "Ahead of Schedule",
]);
export const projectTypeSchema = z.enum(["Fixed", "Recurring"]);
export const clientMoodSchema = z.enum(["Healthy", "Watch", "Risk"]);
export const recurringFrequencySchema = z.enum([
  "Biweekly",
  "Monthly",
  "Quarterly",
  "Ad-hoc",
  "No",
]);

export const createClientSchema = z.object({
  name: z.string().min(1),
  businessName: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  whatsapp: z.string().optional(),
});

export const createProjectSchema = z.object({
  clientId: z.string().uuid().optional(),
  client: createClientSchema.optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  startDate: z
    .string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  deadline: z
    .string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  type: projectTypeSchema,
  cost: z.number().nonnegative(),
  currency: z.string().default("INR"),
  paymentTerms: z.string().optional(),
  revisions: z.number().int().nonnegative().default(0),
  bufferDays: z.number().int().nonnegative().default(0),
  recurringMaintenance: recurringFrequencySchema.optional(),
  prdContent: z.string().optional(),
  styleContext: z.string().optional(),
  scopeInclusions: z.array(z.string().min(1)).optional(),
  scopeExclusions: z.array(z.string().min(1)).optional(),
});

export const updateProjectOverviewSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  deadline: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  status: projectStatusSchema.optional(),
  clientMood: clientMoodSchema.optional(),
  progressPercent: z.number().int().min(0).max(100).optional(),
});

export const paginationSchema = z.object({
  page: z.string().regex(/^\d+$/).default("1").transform(Number),
  limit: z.string().regex(/^\d+$/).default("10").transform(Number),
  q: z.string().optional(),
  status: z.string().optional(),
});
