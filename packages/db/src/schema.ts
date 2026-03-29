import {
  boolean,
  date,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  googleId: text("google_id"),
  name: text("name"),
  avatar: text("avatar"),
  plan: text("plan").default("FREE"),
  role: text("role"),
  refreshTokenHash: text("refresh_token_hash"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    email: text("email"),
    fullName: text("full_name"),
    username: text("username"),
    headline: text("headline"),
    bio: text("bio"),
    experienceLevel: text("experience_level"),
    skills: jsonb("skills").$type<string[]>().default([]).notNull(),
    education: jsonb("education")
      .$type<Record<string, unknown>[]>()
      .default([])
      .notNull(),
    certifications: jsonb("certifications")
      .$type<Record<string, unknown>[]>()
      .default([])
      .notNull(),
    portfolioLinks: jsonb("portfolio_links")
      .$type<Record<string, unknown>[]>()
      .default([])
      .notNull(),
    dateOfBirth: date("date_of_birth"),
    phoneNumber: text("phone_number"),
    socialLinks: jsonb("social_links")
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),
    avatarUrl: text("avatar_url"),
    onboardingCompleted: boolean("onboarding_completed")
      .default(false)
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    usernameIdx: uniqueIndex("idx_profiles_username").on(table.username),
  }),
);

export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  businessName: text("business_name"),
  email: text("email"),
  whatsapp: text("whatsapp"),
  verifiedEmail: boolean("verified_email").default(false).notNull(),
  verifiedWhatsapp: boolean("verified_whatsapp").default(false).notNull(),
  ownerId: uuid("owner_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").references(() => clients.id, {
    onDelete: "set null",
  }),
  ownerId: uuid("owner_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  title: text("title").notNull(),
  description: text("description"),
  startDate: date("start_date"),
  deadline: date("deadline"),
  type: text("type"),
  cost: integer("cost"),
  currency: text("currency").default("INR"),
  paymentTerms: text("payment_terms"),
  progressPercent: integer("progress_percent").default(0),
  nextDeadlineDate: date("next_deadline_date"),
  nextMilestoneName: text("next_milestone_name"),
  status: text("status").default("Active"),
  dropReason: text("drop_reason"),
  droppedAt: timestamp("dropped_at", { withTimezone: true }),
  dropAcknowledgedAt: timestamp("drop_acknowledged_at", {
    withTimezone: true,
  }),
  clientMood: text("client_mood").default("Healthy"),
  revisions: integer("revisions").default(0),
  bufferDays: integer("buffer_days").default(0),
  recurringMaintenance: text("recurring_maintenance"),
  prdContent: text("prd_content"),
  styleContext: text("style_context"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const milestones = pgTable("milestones", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  ownerId: uuid("owner_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  dueDate: date("due_date"),
  status: text("status").default("Upcoming"),
  deliverablesCount: integer("deliverables_count").default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  milestoneId: uuid("milestone_id").references(() => milestones.id, {
    onDelete: "set null",
  }),
  ownerId: uuid("owner_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  title: text("title").notNull(),
  dueDate: date("due_date"),
  status: text("status").default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const projectFiles = pgTable("project_files", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  ownerId: uuid("owner_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  type: text("type"),
  size: text("size"),
  storagePath: text("storage_path"),
  provider: text("provider").default("manual").notNull(),
  itemType: text("item_type").default("file").notNull(),
  bucketId: uuid("bucket_id"),
  deliverableId: uuid("deliverable_id"),
  externalFileId: text("external_file_id"),
  parentExternalFileId: text("parent_external_file_id"),
  webViewLink: text("web_view_link"),
  shareable: boolean("shareable").default(false).notNull(),
  syncMetadata: jsonb("sync_metadata")
    .$type<Record<string, unknown>>()
    .default({})
    .notNull(),
  syncedAt: timestamp("synced_at", { withTimezone: true }),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).defaultNow(),
});

export const googleConnections = pgTable(
  "google_connections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    googleEmail: text("google_email").notNull(),
    accessToken: text("access_token").notNull(),
    refreshToken: text("refresh_token"),
    scopes: jsonb("scopes").$type<string[]>().default([]).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    rootFolderExternalId: text("root_folder_external_id"),
    rootFolderWebViewLink: text("root_folder_web_view_link"),
    lastValidatedAt: timestamp("last_validated_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdx: uniqueIndex("idx_google_connections_user_id").on(table.userId),
  }),
);

export const scopeItems = pgTable("scope_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  ownerId: uuid("owner_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  type: text("type").default("inclusion"),
  label: text("label").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const updates = pgTable("updates", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  ownerId: uuid("owner_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }).defaultNow(),
  type: text("type"),
  summary: text("summary"),
  channel: text("channel"),
  whatsappStatus: text("whatsapp_status"),
});

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  ownerId: uuid("owner_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  type: text("type"),
  amount: integer("amount"),
  currency: text("currency").default("INR"),
  dueDate: date("due_date"),
  status: text("status"),
  note: text("note"),
  channel: text("channel"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  direction: text("direction"),
  reference: text("reference"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const closures = pgTable("closures", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  ownerId: uuid("owner_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  checklistState: jsonb("checklist_state")
    .$type<Record<string, boolean>>()
    .default({})
    .notNull(),
  closedAt: timestamp("closed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const clientActionRequests = pgTable("client_action_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  clientId: uuid("client_id").references(() => clients.id, {
    onDelete: "set null",
  }),
  ownerId: uuid("owner_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  updateId: uuid("update_id").references(() => updates.id, {
    onDelete: "set null",
  }),
  category: text("category").notNull(),
  templateName: text("template_name"),
  status: text("status").default("pending").notNull(),
  requestLabel: text("request_label"),
  requestSummary: text("request_summary"),
  responseLabel: text("response_label"),
  responseMessage: text("response_message"),
  requestMetadata: jsonb("request_metadata")
    .$type<Record<string, unknown>>()
    .default({})
    .notNull(),
  requestedAt: timestamp("requested_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  respondedAt: timestamp("responded_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const whatsappMessages = pgTable("whatsapp_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").references(() => projects.id, {
    onDelete: "set null",
  }),
  clientId: uuid("client_id").references(() => clients.id, {
    onDelete: "set null",
  }),
  ownerId: uuid("owner_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  clientActionRequestId: uuid("client_action_request_id").references(
    () => clientActionRequests.id,
    {
      onDelete: "set null",
    },
  ),
  campaignName: text("campaign_name"),
  templateName: text("template_name"),
  messageType: text("message_type"),
  content: text("content"),
  status: text("status"),
  direction: text("direction"),
  aisensyMessageId: text("aisensy_message_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const whatsappWebhookEvents = pgTable("whatsapp_webhook_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: text("event_id").notNull().unique(),
  eventType: text("event_type").notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>().default({}).notNull(),
  receivedAt: timestamp("received_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
});

export const projectPlans = pgTable("project_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  ownerId: uuid("owner_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  status: text("status").default("draft").notNull(),
  mode: text("mode").notNull(),
  model: text("model"),
  previewJson: jsonb("preview_json").$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const planBuckets = pgTable("plan_buckets", {
  id: uuid("id").primaryKey().defaultRandom(),
  planId: uuid("plan_id")
    .references(() => projectPlans.id, { onDelete: "cascade" })
    .notNull(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  ownerId: uuid("owner_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  type: text("type").notNull(),
  orderIndex: integer("order_index").default(0).notNull(),
  title: text("title").notNull(),
  startDate: date("start_date"),
  endDate: date("end_date"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const planDeliverables = pgTable("plan_deliverables", {
  id: uuid("id").primaryKey().defaultRandom(),
  bucketId: uuid("bucket_id")
    .references(() => planBuckets.id, { onDelete: "cascade" })
    .notNull(),
  planId: uuid("plan_id")
    .references(() => projectPlans.id, { onDelete: "cascade" })
    .notNull(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  ownerId: uuid("owner_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  orderIndex: integer("order_index").default(0).notNull(),
  title: text("title").notNull(),
  acceptanceCriteria: jsonb("acceptance_criteria")
    .$type<string[]>()
    .default([])
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const planTasks = pgTable("plan_tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  bucketId: uuid("bucket_id")
    .references(() => planBuckets.id, { onDelete: "cascade" })
    .notNull(),
  deliverableId: uuid("deliverable_id").references(() => planDeliverables.id, {
    onDelete: "set null",
  }),
  planId: uuid("plan_id")
    .references(() => projectPlans.id, { onDelete: "cascade" })
    .notNull(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  ownerId: uuid("owner_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  orderIndex: integer("order_index").default(0).notNull(),
  title: text("title").notNull(),
  dueDate: date("due_date"),
  status: text("status").default("pending").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const planNotes = pgTable("plan_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  bucketId: uuid("bucket_id")
    .references(() => planBuckets.id, { onDelete: "cascade" })
    .notNull(),
  planId: uuid("plan_id")
    .references(() => projectPlans.id, { onDelete: "cascade" })
    .notNull(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  ownerId: uuid("owner_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  noteType: text("note_type").notNull(),
  text: text("text").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const messageTemplates = pgTable("message_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  planId: uuid("plan_id")
    .references(() => projectPlans.id, { onDelete: "cascade" })
    .notNull(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  ownerId: uuid("owner_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  type: text("type").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const calendarQueue = pgTable("calendar_queue", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  ownerId: uuid("owner_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  taskId: uuid("task_id").references(() => planTasks.id, {
    onDelete: "set null",
  }),
  bucketId: uuid("bucket_id").references(() => planBuckets.id, {
    onDelete: "set null",
  }),
  title: text("title").notNull(),
  scheduledFor: date("scheduled_for").notNull(),
  status: text("status").default("pending").notNull(),
  retryCount: integer("retry_count").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const clientCallSchedules = pgTable(
  "client_call_schedules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clientActionRequestId: uuid("client_action_request_id")
      .references(() => clientActionRequests.id, { onDelete: "cascade" })
      .notNull(),
    projectId: uuid("project_id")
      .references(() => projects.id, { onDelete: "cascade" })
      .notNull(),
    ownerId: uuid("owner_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    clientId: uuid("client_id").references(() => clients.id, {
      onDelete: "set null",
    }),
    timezone: text("timezone").default("Asia/Calcutta").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    durationMinutes: integer("duration_minutes").default(30).notNull(),
    agenda: text("agenda"),
    status: text("status").default("scheduled").notNull(),
    googleCalendarId: text("google_calendar_id"),
    googleEventId: text("google_event_id"),
    meetUrl: text("meet_url"),
    invitedClientEmail: text("invited_client_email"),
    lastSentAt: timestamp("last_sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    requestIdx: uniqueIndex("idx_client_call_schedules_request_id").on(
      table.clientActionRequestId,
    ),
  }),
);

export const userRelations = relations(users, ({ many, one }) => ({
  profile: one(profiles, {
    fields: [users.id],
    references: [profiles.id],
  }),
  clients: many(clients),
  projects: many(projects),
  milestones: many(milestones),
  tasks: many(tasks),
  projectFiles: many(projectFiles),
  scopeItems: many(scopeItems),
  updates: many(updates),
  payments: many(payments),
  closures: many(closures),
  clientActionRequests: many(clientActionRequests),
  whatsappMessages: many(whatsappMessages),
  projectPlans: many(projectPlans),
  googleConnections: many(googleConnections),
  clientCallSchedules: many(clientCallSchedules),
}));

export const profileRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.id],
    references: [users.id],
  }),
}));

export const clientRelations = relations(clients, ({ one, many }) => ({
  owner: one(users, {
    fields: [clients.ownerId],
    references: [users.id],
  }),
  projects: many(projects),
  clientActionRequests: many(clientActionRequests),
  whatsappMessages: many(whatsappMessages),
}));

export const projectRelations = relations(projects, ({ one, many }) => ({
  owner: one(users, {
    fields: [projects.ownerId],
    references: [users.id],
  }),
  client: one(clients, {
    fields: [projects.clientId],
    references: [clients.id],
  }),
  milestones: many(milestones),
  tasks: many(tasks),
  files: many(projectFiles),
  scopeItems: many(scopeItems),
  updates: many(updates),
  payments: many(payments),
  closures: many(closures),
  clientActionRequests: many(clientActionRequests),
  whatsappMessages: many(whatsappMessages),
  plans: many(projectPlans),
  clientCallSchedules: many(clientCallSchedules),
}));

export const milestoneRelations = relations(milestones, ({ one, many }) => ({
  project: one(projects, {
    fields: [milestones.projectId],
    references: [projects.id],
  }),
  owner: one(users, {
    fields: [milestones.ownerId],
    references: [users.id],
  }),
  tasks: many(tasks),
}));

export const taskRelations = relations(tasks, ({ one }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  milestone: one(milestones, {
    fields: [tasks.milestoneId],
    references: [milestones.id],
  }),
  owner: one(users, {
    fields: [tasks.ownerId],
    references: [users.id],
  }),
}));

export const projectFileRelations = relations(projectFiles, ({ one }) => ({
  project: one(projects, {
    fields: [projectFiles.projectId],
    references: [projects.id],
  }),
  owner: one(users, {
    fields: [projectFiles.ownerId],
    references: [users.id],
  }),
  bucket: one(planBuckets, {
    fields: [projectFiles.bucketId],
    references: [planBuckets.id],
  }),
  deliverable: one(planDeliverables, {
    fields: [projectFiles.deliverableId],
    references: [planDeliverables.id],
  }),
}));

export const scopeItemRelations = relations(scopeItems, ({ one }) => ({
  project: one(projects, {
    fields: [scopeItems.projectId],
    references: [projects.id],
  }),
  owner: one(users, {
    fields: [scopeItems.ownerId],
    references: [users.id],
  }),
}));

export const updateRelations = relations(updates, ({ one, many }) => ({
  project: one(projects, {
    fields: [updates.projectId],
    references: [projects.id],
  }),
  owner: one(users, {
    fields: [updates.ownerId],
    references: [users.id],
  }),
  clientActionRequests: many(clientActionRequests),
}));

export const paymentRelations = relations(payments, ({ one }) => ({
  project: one(projects, {
    fields: [payments.projectId],
    references: [projects.id],
  }),
  owner: one(users, {
    fields: [payments.ownerId],
    references: [users.id],
  }),
}));

export const closureRelations = relations(closures, ({ one }) => ({
  project: one(projects, {
    fields: [closures.projectId],
    references: [projects.id],
  }),
  owner: one(users, {
    fields: [closures.ownerId],
    references: [users.id],
  }),
}));

export const clientActionRequestRelations = relations(
  clientActionRequests,
  ({ one, many }) => ({
    project: one(projects, {
      fields: [clientActionRequests.projectId],
      references: [projects.id],
    }),
    client: one(clients, {
      fields: [clientActionRequests.clientId],
      references: [clients.id],
    }),
    owner: one(users, {
      fields: [clientActionRequests.ownerId],
      references: [users.id],
    }),
    update: one(updates, {
      fields: [clientActionRequests.updateId],
      references: [updates.id],
    }),
    whatsappMessages: many(whatsappMessages),
    clientCallSchedule: one(clientCallSchedules, {
      fields: [clientActionRequests.id],
      references: [clientCallSchedules.clientActionRequestId],
    }),
  }),
);

export const whatsappMessageRelations = relations(
  whatsappMessages,
  ({ one }) => ({
    project: one(projects, {
      fields: [whatsappMessages.projectId],
      references: [projects.id],
    }),
    client: one(clients, {
      fields: [whatsappMessages.clientId],
      references: [clients.id],
    }),
    owner: one(users, {
      fields: [whatsappMessages.ownerId],
      references: [users.id],
    }),
    clientActionRequest: one(clientActionRequests, {
      fields: [whatsappMessages.clientActionRequestId],
      references: [clientActionRequests.id],
    }),
  }),
);

export const whatsappWebhookEventRelations = relations(
  whatsappWebhookEvents,
  () => ({}),
);

export const projectPlanRelations = relations(
  projectPlans,
  ({ one, many }) => ({
    project: one(projects, {
      fields: [projectPlans.projectId],
      references: [projects.id],
    }),
    owner: one(users, {
      fields: [projectPlans.ownerId],
      references: [users.id],
    }),
    buckets: many(planBuckets),
    deliverables: many(planDeliverables),
    tasks: many(planTasks),
    notes: many(planNotes),
    templates: many(messageTemplates),
  }),
);

export const planBucketRelations = relations(planBuckets, ({ one, many }) => ({
  plan: one(projectPlans, {
    fields: [planBuckets.planId],
    references: [projectPlans.id],
  }),
  project: one(projects, {
    fields: [planBuckets.projectId],
    references: [projects.id],
  }),
  owner: one(users, {
    fields: [planBuckets.ownerId],
    references: [users.id],
  }),
  deliverables: many(planDeliverables),
  tasks: many(planTasks),
  notes: many(planNotes),
}));

export const planDeliverableRelations = relations(
  planDeliverables,
  ({ one, many }) => ({
    bucket: one(planBuckets, {
      fields: [planDeliverables.bucketId],
      references: [planBuckets.id],
    }),
    plan: one(projectPlans, {
      fields: [planDeliverables.planId],
      references: [projectPlans.id],
    }),
    tasks: many(planTasks),
  }),
);

export const planTaskRelations = relations(planTasks, ({ one, many }) => ({
  bucket: one(planBuckets, {
    fields: [planTasks.bucketId],
    references: [planBuckets.id],
  }),
  deliverable: one(planDeliverables, {
    fields: [planTasks.deliverableId],
    references: [planDeliverables.id],
  }),
  plan: one(projectPlans, {
    fields: [planTasks.planId],
    references: [projectPlans.id],
  }),
  queueEntries: many(calendarQueue),
}));

export const planNoteRelations = relations(planNotes, ({ one }) => ({
  bucket: one(planBuckets, {
    fields: [planNotes.bucketId],
    references: [planBuckets.id],
  }),
  plan: one(projectPlans, {
    fields: [planNotes.planId],
    references: [projectPlans.id],
  }),
}));

export const messageTemplateRelations = relations(
  messageTemplates,
  ({ one }) => ({
    plan: one(projectPlans, {
      fields: [messageTemplates.planId],
      references: [projectPlans.id],
    }),
  }),
);

export const calendarQueueRelations = relations(calendarQueue, ({ one }) => ({
  project: one(projects, {
    fields: [calendarQueue.projectId],
    references: [projects.id],
  }),
  owner: one(users, {
    fields: [calendarQueue.ownerId],
    references: [users.id],
  }),
  task: one(planTasks, {
    fields: [calendarQueue.taskId],
    references: [planTasks.id],
  }),
  bucket: one(planBuckets, {
    fields: [calendarQueue.bucketId],
    references: [planBuckets.id],
  }),
}));

export const googleConnectionRelations = relations(
  googleConnections,
  ({ one }) => ({
    user: one(users, {
      fields: [googleConnections.userId],
      references: [users.id],
    }),
  }),
);

export const clientCallScheduleRelations = relations(
  clientCallSchedules,
  ({ one }) => ({
    clientActionRequest: one(clientActionRequests, {
      fields: [clientCallSchedules.clientActionRequestId],
      references: [clientActionRequests.id],
    }),
    project: one(projects, {
      fields: [clientCallSchedules.projectId],
      references: [projects.id],
    }),
    owner: one(users, {
      fields: [clientCallSchedules.ownerId],
      references: [users.id],
    }),
    client: one(clients, {
      fields: [clientCallSchedules.clientId],
      references: [clients.id],
    }),
  }),
);
