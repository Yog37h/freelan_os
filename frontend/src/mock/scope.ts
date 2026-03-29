import { ScopeItem } from '../types';

export const mockScopes = {
    p1: {
        inScope: [
            { id: 'is1', projectId: 'p1', label: 'Responsive Design (Desktop, Tablet, Mobile)' },
            { id: 'is2', projectId: 'p1', label: 'CMS Integration for Blog', note: 'Using Contentful' },
            { id: 'is3', projectId: 'p1', label: 'Custom Contact Form with Validation' },
            { id: 'is4', projectId: 'p1', label: 'Basic SEO Setup' },
        ],
        outOfScope: [
            { id: 'os1', projectId: 'p1', label: 'E-commerce functionality' },
            { id: 'os2', projectId: 'p1', label: 'Logo design (client provided)' },
        ],
        changes: [
            { id: 'cr1', projectId: 'p1', label: 'Addition of Dark Mode toggle', note: 'Requested 2026-02-18' },
        ],
    },
};
