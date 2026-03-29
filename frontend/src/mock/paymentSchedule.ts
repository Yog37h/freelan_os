import { PaymentScheduleItem } from '../types';

export const mockPaymentSchedule: PaymentScheduleItem[] = [
    {
        scheduleId: 'ps1',
        projectId: 'p1',
        clientName: 'John Doe',
        projectTitle: 'Website Revamp',
        type: 'milestone',
        amount: 30000,
        currency: 'INR',
        dueDate: new Date(Date.now() + 604800000).toISOString(), // 7 days later
        status: 'scheduled',
    },
    {
        scheduleId: 'ps2',
        projectId: 'p2',
        clientName: 'Sarah Smith',
        projectTitle: 'Branding Kit',
        type: 'upfront',
        amount: 65000,
        currency: 'INR',
        dueDate: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        status: 'due',
    },
    {
        scheduleId: 'ps3',
        projectId: 'p3',
        clientName: 'Mike Ross',
        projectTitle: 'Mobile App CI/CD',
        type: 'milestone',
        amount: 15000,
        currency: 'INR',
        dueDate: new Date(Date.now() + 1209600000).toISOString(), // 14 days later
        status: 'scheduled',
    },
    {
        scheduleId: 'ps4',
        projectId: 'p4',
        clientName: 'Elena Gilbert',
        projectTitle: 'UI Audit',
        type: 'one-time',
        amount: 12500,
        currency: 'INR',
        dueDate: new Date(Date.now() - 432000000).toISOString(), // 5 days ago
        status: 'overdue',
    },
    {
        scheduleId: 'ps5',
        projectId: 'p6',
        clientName: 'Peter Parker',
        projectTitle: 'Photography Portfolio',
        type: 'monthly',
        amount: 15000,
        currency: 'INR',
        dueDate: new Date(Date.now() + 172800000).toISOString(), // 2 days later
        status: 'scheduled',
    },
    {
        scheduleId: 'ps6',
        projectId: 'p7',
        clientName: 'Bruce Wayne',
        projectTitle: 'Security Dashboard',
        type: 'upfront',
        amount: 150000,
        currency: 'INR',
        dueDate: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        status: 'overdue',
    }
];
