import { ProjectUpdate, UpdateCenterItem } from '../types';

export const mockUpdates: ProjectUpdate[] = [
    {
        id: 'u1',
        projectId: 'p1',
        date: '2026-02-20T10:00:00Z',
        type: 'WhatsApp',
        summary: 'Sent the first batch of wireframes for the homepage. Feedback expected by tomorrow.',
        channel: 'WhatsApp',
    },
    {
        id: 'u2',
        projectId: 'p1',
        date: '2026-02-18T14:30:00Z',
        type: 'Meeting',
        summary: 'Bi-weekly sync. Discussed the color palette and typography. Client approved "Electric Blue".',
        channel: 'Email',
    },
    {
        id: 'u3',
        projectId: 'p1',
        date: '2026-02-15T09:00:00Z',
        type: 'System',
        summary: 'Project initialized on FreelanceOS.',
        channel: 'Email',
    },
];

export const mockUpdateCenterItems: UpdateCenterItem[] = [
    {
        updateId: 'uc1',
        projectId: 'p1',
        clientName: 'John Doe',
        projectTitle: 'Website Revamp',
        type: 'weekly',
        contentPreview: 'Weekly progress: Homepage UI matches brand guidelines. Wireframes 100% complete.',
        sentAt: new Date(Date.now() - 3600000).toISOString(),
        autoMode: true,
    },
    {
        updateId: 'uc2',
        projectId: 'p2',
        clientName: 'Sarah Smith',
        projectTitle: 'Branding Kit',
        type: 'deliverable',
        contentPreview: 'New logo variants are ready for your review in the project dashboard.',
        sentAt: new Date(Date.now() - 86400000).toISOString(),
        autoMode: false,
    },
    {
        updateId: 'uc3',
        projectId: 'p3',
        clientName: 'Mike Ross',
        projectTitle: 'Mobile App CI/CD',
        type: 'approval',
        contentPreview: 'Staging deployment finalized. Awaiting your approval to move to UAT.',
        sentAt: new Date(Date.now() - 172800000).toISOString(),
        autoMode: true,
    },
    {
        updateId: 'uc4',
        projectId: 'p4',
        clientName: 'Elena Gilbert',
        projectTitle: 'UI Audit',
        type: 'buffer',
        contentPreview: 'Brief delay due to additional complexity in the checkout flow audit (Buffer req: +2 days).',
        sentAt: new Date(Date.now() - 259200000).toISOString(),
        autoMode: false,
    }
];
