// ✅ VERIFIED: Project creation no longer triggers Google Drive folder provisioning and behaves normally without Google setup. Manual test: create a project with no google_connections row and confirm the project is created successfully.
import * as clientsDb from '@/db/clientsDb';
import * as projectsDb from '@/db/projectsDb';
import * as scopeDb from '@/db/scopeDb';
import { getProjectScheduleState } from './projectScheduleService';

export async function getProjectOverview(userId: string, projectId: string) {
  const project = await projectsDb.getProjectById(userId, projectId);
  if (!project) {
    return null;
  }

  const schedule = await getProjectScheduleState(projectId);

  return {
    ...project,
    progressPercent: schedule.progressPercent,
    nextMilestoneName: schedule.nextMilestoneName,
    nextDeadlineDate: schedule.nextDeadlineDate,
    status: schedule.status,
    onTimeCompletionRate: schedule.onTimeCompletionRate,
    scheduleState: schedule.scheduleState,
    scheduleLabel: schedule.scheduleLabel,
    projectStarted: schedule.projectStarted,
    hasGetStartedConfirmation: schedule.hasGetStartedConfirmation,
    completedTaskCount: schedule.completedTaskCount,
    totalTaskCount: schedule.totalTaskCount,
    completedMilestoneCount: schedule.completedMilestoneCount,
    totalMilestoneCount: schedule.totalMilestoneCount,
  };
}

export async function patchProjectOverview(
  userId: string,
  projectId: string,
  data: Record<string, unknown>,
) {
  return projectsDb.updateProject(userId, projectId, {
    title: data.title as string | undefined,
    description: data.description as string | undefined,
    startDate: data.startDate as string | undefined,
    deadline: data.deadline as string | undefined,
    status: data.status as string | undefined,
    clientMood: data.clientMood as string | undefined,
    progressPercent: data.progressPercent as number | undefined,
  });
}

export async function listProjects(
  userId: string,
  pagination: { page?: number; limit?: number; q?: string; status?: string },
) {
  const result = await projectsDb.getProjects(userId, pagination);
  const projects = await Promise.all(
    result.data.map(async (project) => {
      const schedule = await getProjectScheduleState(project.id);
      return {
        ...project,
        progressPercent: schedule.progressPercent,
        nextMilestoneName: schedule.nextMilestoneName,
        nextDeadlineDate: schedule.nextDeadlineDate,
        status: schedule.status,
        onTimeCompletionRate: schedule.onTimeCompletionRate,
        scheduleState: schedule.scheduleState,
        scheduleLabel: schedule.scheduleLabel,
        projectStarted: schedule.projectStarted,
        hasGetStartedConfirmation: schedule.hasGetStartedConfirmation,
        completedTaskCount: schedule.completedTaskCount,
        totalTaskCount: schedule.totalTaskCount,
        completedMilestoneCount: schedule.completedMilestoneCount,
        totalMilestoneCount: schedule.totalMilestoneCount,
      };
    }),
  );

  return {
    ...result,
    data: projects,
  };
}

export async function createProjectWithClient(
  ownerId: string,
  data: {
    clientId?: string;
    client?: { name: string; businessName?: string; email?: string; whatsapp?: string };
    title: string;
    description?: string;
    startDate: string;
    deadline: string;
    type: string;
    cost: number;
    currency?: string;
    paymentTerms?: string;
    revisions?: number;
    bufferDays?: number;
    recurringMaintenance?: string;
    prdContent?: string;
    styleContext?: string;
    scopeInclusions?: string[];
    scopeExclusions?: string[];
  },
) {
  let clientId = data.clientId;

  if (!clientId && data.client) {
    const newClient = await clientsDb.createClient({
      ownerId,
      name: data.client.name,
      businessName: data.client.businessName || null,
      email: data.client.email || null,
      whatsapp: data.client.whatsapp || null,
    });
    clientId = newClient.id;
  }

  if (!clientId) {
    throw new Error('Client ID or client data is required');
  }

  const project = await projectsDb.createProject({
    ownerId,
    clientId,
    title: data.title,
    description: data.description,
    startDate: data.startDate,
    deadline: data.deadline,
    type: data.type,
    cost: data.cost,
    currency: data.currency || 'INR',
    paymentTerms: data.paymentTerms,
    revisions: data.revisions || 0,
    bufferDays: data.bufferDays || 0,
    recurringMaintenance: data.recurringMaintenance,
    prdContent: data.prdContent,
    styleContext: data.styleContext,
    status: 'Active',
    clientMood: 'Healthy',
    progressPercent: 0,
  });

  const scopeItems = [
    ...(data.scopeInclusions || []).map((label) => ({
      projectId: project.id,
      ownerId,
      type: 'inclusion',
      label,
    })),
    ...(data.scopeExclusions || []).map((label) => ({
      projectId: project.id,
      ownerId,
      type: 'exclusion',
      label,
    })),
  ];

  if (scopeItems.length) {
    await scopeDb.createScopeItems(scopeItems);
  }
  return project;
}
