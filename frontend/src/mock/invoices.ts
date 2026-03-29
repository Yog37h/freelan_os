import { Invoice } from '../types';

export const mockInvoices: Invoice[] = [
    {
        id: 'i1',
        projectId: 'p1',
        amount: 60000,
        currency: 'INR',
        dueDate: '2026-01-20T00:00:00Z',
        status: 'Paid',
    },
    {
        id: 'i2',
        projectId: 'p1',
        amount: 30000,
        currency: 'INR',
        dueDate: '2026-03-01T00:00:00Z',
        status: 'Unpaid',
    },
    {
        id: 'i3',
        projectId: 'p1',
        amount: 30000,
        currency: 'INR',
        dueDate: '2026-03-25T00:00:00Z',
        status: 'Draft',
    },
];
