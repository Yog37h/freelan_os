import { Project } from '@/types';

const localProjects: Project[] = [];

export function saveProjectLocally(project: Project): void {
    const exists = localProjects.some((item) => item.id === project.id);
    if (!exists) {
        localProjects.push(project);
    }
}

export function getLocalProjects(): Project[] {
    return [...localProjects];
}

export function getLocalProjectById(id: string): Project | undefined {
    return localProjects.find(p => p.id === id);
}
