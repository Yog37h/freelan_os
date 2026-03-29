import { ProjectFile } from '../types';

export const mockFiles: ProjectFile[] = [
    {
        id: 'f1',
        projectId: 'p1',
        name: 'Brand_Guidelines_v1.pdf',
        type: 'PDF',
        size: '4.2 MB',
        uploadedAt: '2026-02-15T11:00:00Z',
    },
    {
        id: 'f2',
        projectId: 'p1',
        name: 'Homepage_Layout_Final.fig',
        type: 'Figma',
        size: '12.8 MB',
        uploadedAt: '2026-02-20T09:30:00Z',
    },
    {
        id: 'f3',
        projectId: 'p1',
        name: 'Assets_IconSet.zip',
        type: 'ZIP',
        size: '850 KB',
        uploadedAt: '2026-02-18T16:45:00Z',
    },
];
