import { ClientApprovalItem } from '../types';

export const mockApprovals: ClientApprovalItem[] = [
    {
        approvalId: 'a1',
        clientActionRequestId: 'a1',
        category: 'approval',
        projectId: 'p1',
        projectTitle: 'Website Revamp',
        projectRoute: '/projects/p1',
        milestoneName: 'Wireframes & Information Architecture',
        clientName: 'John Doe',
        status: 'pending',
        requestedAt: new Date(Date.now() - 172800000).toISOString(),
    },
    {
        approvalId: 'a2',
        clientActionRequestId: 'a2',
        category: 'approval',
        projectId: 'p2',
        projectTitle: 'Branding Kit',
        projectRoute: '/projects/p2',
        milestoneName: 'Discovery & Research',
        clientName: 'Sarah Smith',
        status: 'approved',
        requestedAt: new Date(Date.now() - 432000000).toISOString(),
    },
    {
        approvalId: 'a3',
        clientActionRequestId: 'a3',
        category: 'approval',
        projectId: 'p4',
        projectTitle: 'UI Audit',
        projectRoute: '/projects/p4',
        milestoneName: 'Initial Audit',
        clientName: 'Elena Gilbert',
        status: 'revision',
        clientComment: 'Please look closer at the mobile checkout flow, specifically the keyboard overlap issue.',
        requestedAt: new Date(Date.now() - 86400000).toISOString(),
    }
];
