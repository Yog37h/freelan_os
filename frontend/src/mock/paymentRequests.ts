import { PaymentRequest } from '../types';

export const mockPaymentRequests: PaymentRequest[] = [
    {
        requestId: 'req1',
        projectId: 'p1',
        clientName: 'John Doe',
        projectTitle: 'Website Revamp',
        type: 'milestone',
        amount: 30000,
        currency: 'INR',
        dueDate: new Date(Date.now() + 604800000).toISOString(),
        channel: 'whatsapp',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        status: 'sent',
        note: 'Phase 2 development starting.',
    },
    {
        requestId: 'req2',
        projectId: 'p4',
        clientName: 'Elena Gilbert',
        projectTitle: 'UI Audit',
        type: 'one-time',
        amount: 12500,
        currency: 'INR',
        dueDate: new Date(Date.now() - 432000000).toISOString(),
        channel: 'whatsapp',
        createdAt: new Date(Date.now() - 864000000).toISOString(),
        status: 'sent',
    },
    {
        requestId: 'req3',
        projectId: 'p2',
        clientName: 'Sarah Smith',
        projectTitle: 'Branding Kit',
        type: 'milestone',
        amount: 20000,
        currency: 'INR',
        dueDate: new Date(Date.now() + 1209600000).toISOString(),
        channel: 'whatsapp',
        createdAt: new Date().toISOString(),
        status: 'draft',
    }
];
