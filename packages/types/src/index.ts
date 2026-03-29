export type User = {
  id: string;
  name: string;
  avatar?: string;
  plan: "FREE" | "PRO" | "ULTIMATE";
  role?: string;
};

export type ProjectStatus =
  | "Active"
  | "Completed"
  | "Drop Pending Ack"
  | "Dropped"
  | "Delayed"
  | "Recurring"
  | "At Risk"
  | "On Track"
  | "Not Yet Started"
  | "Ahead of Schedule";
export type ProjectType = "Fixed" | "Recurring";
export type ClientMood = "Healthy" | "Watch" | "Risk";
export type RecurringFrequency =
  | "Biweekly"
  | "Monthly"
  | "Quarterly"
  | "Ad-hoc"
  | "No";

export type Client = {
  id: string;
  name: string;
  businessName: string;
  email: string;
  whatsapp: string;
  verifiedEmail: boolean;
  verifiedWhatsapp: boolean;
};

export type MilestoneStatus =
  | "Completed"
  | "Upcoming"
  | "In Progress"
  | "Delayed";

export type Milestone = {
  id: string;
  projectId: string;
  name: string;
  dueDate: string;
  status: MilestoneStatus;
  deliverablesCount: number;
};

export type ProjectUpdateType = "WhatsApp" | "Email" | "Meeting" | "System";

export type ProjectUpdate = {
  id: string;
  projectId: string;
  date: string;
  type: ProjectUpdateType;
  summary: string;
  channel: "WhatsApp" | "Email" | "System";
};

export type ProjectFile = {
  id: string;
  projectId: string;
  name: string;
  type: string;
  size: string;
  uploadedAt: string;
  provider?: string;
  itemType?: string;
  bucketId?: string | null;
  deliverableId?: string | null;
  externalFileId?: string | null;
  parentExternalFileId?: string | null;
  webViewLink?: string | null;
  shareable?: boolean;
  syncMetadata?: Record<string, unknown>;
  syncedAt?: string | null;
};

export type DeliverableFolderItem = ProjectFile & {
  deliverableTitle: string;
  deliverableStatus?: string;
  bucketTitle?: string;
};

export type ProjectFilesBucketGroup = {
  bucketId: string;
  bucketTitle: string;
  bucketStatus?: string;
  deliverables: DeliverableFolderItem[];
};

export type GoogleIntegrationStatus = {
  connected: boolean;
  googleEmail?: string | null;
  scopes?: string[];
  expiresAt?: string | null;
  rootFolderExternalId?: string | null;
  rootFolderWebViewLink?: string | null;
  lastValidatedAt?: string | null;
  connectUrl?: string;
};

export type ProjectFilesView = {
  projectId: string;
  connected: boolean;
  projectFolder: ProjectFile | null;
  buckets: ProjectFilesBucketGroup[];
  unassignedItems: ProjectFile[];
  google: GoogleIntegrationStatus;
};

export type ScopeItem = {
  id: string;
  projectId: string;
  label: string;
  note?: string;
};

export type InvoiceStatus = "Paid" | "Unpaid" | "Overdue" | "Draft";

export type Invoice = {
  id: string;
  projectId: string;
  amount: number;
  currency: string;
  dueDate: string;
  status: InvoiceStatus;
};

export type Project = {
  id: string;
  clientId: string;
  client: Client;
  projectTitle: string;
  projectDescription: string;
  projectStartDate: string;
  projectDeadline: string;
  projectType: ProjectType;
  projectCost: number;
  currency: string;
  paymentTerms: string;
  progressPercent: number;
  nextDeadlineDate: string;
  nextMilestoneName: string;
  status: ProjectStatus;
  clientMood: ClientMood;
  onTimeCompletionRate?: number | null;
  scheduleState?: "not_started" | "ahead" | "on_track" | "behind" | "completed";
  scheduleLabel?: string;
  projectStarted?: boolean;
  hasGetStartedConfirmation?: boolean;
  completedTaskCount?: number;
  totalTaskCount?: number;
  completedMilestoneCount?: number;
  totalMilestoneCount?: number;
  tags?: string[];
  // New fields for wizard
  revisions?: number;
  bufferDays?: number;
  recurringMaintenance?: RecurringFrequency;
  prdContent?: string;
  styleContext?: string;
  scopeInclusions?: string[];
  scopeExclusions?: string[];
  // Compatibility with old mock
  clientName?: string;
  projectName?: string;
  isVerified?: boolean;
};

export type ProjectDraft = Partial<Project> & {
  step: number;
};

export type DashboardCardType =
  | "deliverable"
  | "approval"
  | "invoice"
  | "update";

export type DashboardCardSeverity = "high" | "medium" | "low";

export type DashboardSummaryCard = {
  id: string;
  type: DashboardCardType;
  title: string;
  context: string;
  severity: DashboardCardSeverity;
  count: number;
  actionLabel: string;
  route: string;
  projectId: string | null;
  targetTab?: string | null;
  targetFilter?: string | null;
};

export type TodayTask = DashboardSummaryCard;

export type Notification = {
  id: string;
  title: string;
  description: string;
  time: string;
  isRead: boolean;
};

// --- NEW TYPES FOR TIMELINE, UPDATES, AND APPROVALS ---

export type TimelineTask = {
  taskId: string;
  projectId: string;
  projectTitle: string;
  milestoneName: string;
  taskTitle: string;
  dueDate: string; // ISO string
  status: "pending" | "in_progress" | "completed";
};

export type UpdateCenterItem = {
  updateId: string;
  projectId: string;
  clientName: string;
  projectTitle: string;
  type: "weekly" | "deliverable" | "buffer" | "approval";
  contentPreview: string;
  sentAt: string; // ISO
  autoMode: boolean;
  history?: ProjectUpdate[];
};

export type ClientActionCategory =
  | "approval"
  | "buffer"
  | "status_check"
  | "project_drop"
  | "closure"
  | "onboarding"
  | "sync"
  | "revision"
  | "deliverable_review";

export type ClientActionStatus =
  | "pending"
  | "approved"
  | "revision"
  | "will_connect"
  | "acknowledged"
  | "completed"
  | "concern_raised"
  | "failed";

export type ClientApprovalItem = {
  approvalId: string;
  clientActionRequestId: string;
  category: ClientActionCategory;
  projectId: string;
  projectTitle: string;
  projectRoute: string;
  milestoneName: string;
  clientName: string;
  status: ClientActionStatus;
  clientComment?: string;
  requestSummary?: string;
  responseLabel?: string;
  requestedAt: string; // ISO
  respondedAt?: string | null;
  linkedMessageIds?: string[];
  outboundMessageId?: string | null;
  inboundMessageId?: string | null;
  outboundMessageStatus?: WhatsAppMessageStatus | null;
};

export type ClientCallItem = {
  id: string;
  clientActionRequestId: string;
  category: ClientActionCategory;
  status: Extract<ClientActionStatus, "revision" | "will_connect">;
  projectId: string;
  projectTitle: string;
  projectRoute: string;
  clientName: string;
  requestLabel: string;
  requestSummary?: string;
  responseLabel?: string;
  requestedAt: string;
  respondedAt?: string | null;
  linkedMessageIds?: string[];
  outboundMessageId?: string | null;
  inboundMessageId?: string | null;
  outboundMessageStatus?: WhatsAppMessageStatus | null;
  schedule?: ClientCallSchedule | null;
};

export type ClientCallSchedule = {
  id: string;
  clientActionRequestId: string;
  projectId: string;
  clientId?: string | null;
  timezone: string;
  startsAt: string;
  endsAt: string;
  durationMinutes: number;
  agenda?: string | null;
  status: string;
  googleCalendarId?: string | null;
  googleEventId?: string | null;
  meetUrl?: string | null;
  invitedClientEmail?: string | null;
  lastSentAt?: string | null;
};

// --- NEW TYPES FOR PAYMENTS ---

export type PaymentPlanType =
  | "upfront"
  | "milestone"
  | "monthly"
  | "weekly"
  | "one-time"
  | "custom";

export type PaymentStatus = "scheduled" | "due" | "paid" | "overdue";

export type PaymentRequest = {
  requestId: string;
  projectId: string;
  clientName: string;
  projectTitle: string;
  type: PaymentPlanType;
  amount: number;
  currency: "INR";
  dueDate: string; // ISO
  note?: string;
  channel: "whatsapp";
  createdAt: string; // ISO
  status: "sent" | "draft";
};

export type PaymentTransaction = {
  txnId: string;
  projectId: string;
  clientName: string;
  projectTitle: string;
  type: PaymentPlanType;
  direction: "credit" | "debit";
  amount: number;
  currency: "INR";
  status: "success" | "pending" | "failed";
  paidAt: string; // ISO
  reference?: string;
};

export type PaymentScheduleItem = {
  scheduleId: string;
  projectId: string;
  clientName: string;
  projectTitle: string;
  type: PaymentPlanType;
  amount: number;
  currency: "INR";
  dueDate: string; // ISO
  status: PaymentStatus;
};

// --- WHATSAPP AUTOMATION TYPES ---

export type WhatsAppMessageType =
  | "welcome"
  | "summary"
  | "milestone_start"
  | "update"
  | "reminder"
  | "status_check"
  | "approval_request"
  | "deliverable"
  | "deliverable_sent"
  | "buffer_request"
  | "closure"
  | "client_call"
  | "project_dropped"
  | "text_reply"
  | "button_response";
export type WhatsAppMessageStatus =
  | "pending"
  | "sent"
  | "delivered"
  | "read"
  | "failed";
export type WhatsAppDirection = "outgoing" | "incoming";

export type WhatsAppMessage = {
  id: string;
  projectId: string;
  clientId: string;
  ownerId: string;
  campaignName: string;
  templateName: string;
  messageType: WhatsAppMessageType;
  content: string;
  status: WhatsAppMessageStatus;
  direction: WhatsAppDirection;
  aisensyMessageId?: string;
  createdAt: string;
  updatedAt: string;
};

export type WhatsAppSendRequest = {
  projectId: string;
  messageType: WhatsAppMessageType;
};

export type WhatsAppDeliveryStatus =
  | "pending"
  | "sent"
  | "delivered"
  | "read"
  | "failed";

export * from "./api";
