import { Notification } from '../types';

export const mockNotifications: Notification[] = [
    {
        id: 'n1',
        title: 'New message from ABC Pvt Ltd',
        description: 'Can we move the QA to Wednesday?',
        time: '5m ago',
        isRead: false,
    },
    {
        id: 'n2',
        title: 'Invoice Paid',
        description: 'Zenith Studio paid ₹12,000.',
        time: '2h ago',
        isRead: true,
    },
];
