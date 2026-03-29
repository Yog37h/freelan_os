import { Milestone } from '../types';

export const mockMilestones: Milestone[] = [
    {
        id: 'm1',
        projectId: 'p1',
        name: 'Discovery & Research',
        dueDate: '2026-01-25T00:00:00Z',
        status: 'Completed',
        deliverablesCount: 3,
    },
    {
        id: 'm2',
        projectId: 'p1',
        name: 'Wireframes & Information Architecture',
        dueDate: '2026-02-10T00:00:00Z',
        status: 'Completed',
        deliverablesCount: 5,
    },
    {
        id: 'm3',
        projectId: 'p1',
        name: 'Homepage UI Design',
        dueDate: '2026-02-28T00:00:00Z',
        status: 'In Progress',
        deliverablesCount: 2,
    },
    {
        id: 'm4',
        projectId: 'p1',
        name: 'Full Site Development',
        dueDate: '2026-03-15T00:00:00Z',
        status: 'Upcoming',
        deliverablesCount: 12,
    },
];
