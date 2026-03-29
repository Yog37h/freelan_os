import { Client, Project, ProjectDraft } from '@/types';

const PROJECT_DRAFT_STORAGE_KEY = 'freelancer-os.project-draft';

let currentDraft: ProjectDraft | null = null;

function canUseStorage() {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function saveProjectDraft(draft: ProjectDraft): void {
    currentDraft = draft;

    if (!canUseStorage()) {
        return;
    }

    window.localStorage.setItem(PROJECT_DRAFT_STORAGE_KEY, JSON.stringify(draft));
}

export function getProjectDraft(): ProjectDraft | null {
    if (currentDraft) {
        return currentDraft;
    }

    if (!canUseStorage()) {
        return null;
    }

    const savedDraft = window.localStorage.getItem(PROJECT_DRAFT_STORAGE_KEY);
    if (!savedDraft) {
        return null;
    }

    try {
        currentDraft = JSON.parse(savedDraft) as ProjectDraft;
        return currentDraft;
    } catch {
        window.localStorage.removeItem(PROJECT_DRAFT_STORAGE_KEY);
        currentDraft = null;
        return null;
    }
}

export function updateProjectDraft(updates: Partial<ProjectDraft>): ProjectDraft {
    const current = getProjectDraft() || { step: 1 };
    const updated = { ...current, ...updates };
    saveProjectDraft(updated);
    return updated;
}

export function clearProjectDraft(): void {
    currentDraft = null;

    if (!canUseStorage()) {
        return;
    }

    window.localStorage.removeItem(PROJECT_DRAFT_STORAGE_KEY);
}

export function createProjectFromDraft(draft: ProjectDraft): Project {
    const clientId = draft.clientId || `c-${Date.now()}`;

    const clientData: Client = draft.client || {
        id: clientId,
        name: draft.clientName || 'Unknown',
        businessName: 'Freelancer', // default
        email: '',
        whatsapp: '',
        verifiedEmail: false,
        verifiedWhatsapp: false,
    };

    // This is where we finalize the project object
    const newProject: Project = {
        id: `p-${Date.now()}`,
        clientId: clientId,
        client: clientData,
        projectTitle: draft.projectTitle || 'Untitled Project',
        projectDescription: draft.projectDescription || '',
        projectStartDate: draft.projectStartDate || new Date().toISOString(),
        projectDeadline: draft.projectDeadline || new Date().toISOString(),
        projectType: draft.projectType || 'Fixed',
        projectCost: draft.projectCost || 0,
        currency: 'INR',
        paymentTerms: draft.paymentTerms || 'Milestones',
        progressPercent: 0,
        nextDeadlineDate: 'Starting Soon',
        nextMilestoneName: 'Kickoff',
        status: 'On Track',
        clientMood: 'Healthy',
        tags: draft.tags || ['Web'],
        revisions: draft.revisions,
        bufferDays: draft.bufferDays,
        recurringMaintenance: draft.recurringMaintenance,
        prdContent: draft.prdContent,
        styleContext: draft.styleContext,
    };

    return newProject;
}
