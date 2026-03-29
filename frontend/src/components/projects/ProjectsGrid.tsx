'use client';

import * as React from 'react';
import { ProjectTileCard } from './ProjectTileCard';
import { Project } from '@/types';
import { LayoutGrid } from 'lucide-react';
import { Button } from '../ui/Button';

interface ProjectsGridProps {
    projects: Project[];
    isLoading: boolean;
    onUpdateProject: (project: Project) => void;
    onCloseProject: (project: Project) => void;
    onReset: () => void;
}

export function ProjectsGrid({
    projects,
    isLoading,
    onUpdateProject,
    onCloseProject,
    onReset
}: ProjectsGridProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array(8).fill(0).map((_, i) => (
                    <ProjectTileCard key={i} project={{} as Project} isLoading />
                ))}
            </div>
        );
    }

    if (projects.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-card/30 rounded-3xl border border-dashed border-white/10 uppercase tracking-tighter">
                <LayoutGrid className="text-muted-foreground/20 mb-6" size={64} />
                <h2 className="text-xl font-bold mb-2">No projects found</h2>
                <p className="text-muted-foreground mb-8">Try adjusting your filters or search query.</p>
                <Button variant="outline" onClick={onReset}>Clear Filters</Button>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {projects.map((project) => (
                <ProjectTileCard
                    key={project.id}
                    project={project}
                    onUpdate={onUpdateProject}
                    onClose={onCloseProject}
                />
            ))}
        </div>
    );
}
