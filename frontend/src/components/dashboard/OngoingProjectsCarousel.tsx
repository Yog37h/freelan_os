

import * as React from 'react';
import { ProjectCard } from './ProjectCard';
import { Project } from '@/types';
import { Button } from '../ui/Button';
import { ChevronRight, ChevronLeft, LayoutGrid } from 'lucide-react';
import { Link } from '@/components/router/Link';

export function OngoingProjectsCarousel({ projects, isLoading = false }: { projects: Project[]; isLoading?: boolean }) {
    const scrollRef = React.useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { scrollLeft, clientWidth } = scrollRef.current;
            const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
            scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
        }
    };

    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold tracking-tight">Ongoing Projects</h2>
                    <span className="bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                        {projects.length} ACTIVE
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <Link to="/projects">
                        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground">
                            View All <ChevronRight size={14} className="ml-1" />
                        </Button>
                    </Link>
                    <div className="hidden sm:flex items-center gap-1 ml-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-full border-border/50"
                            onClick={() => scroll('left')}
                        >
                            <ChevronLeft size={16} />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-full border-border/50"
                            onClick={() => scroll('right')}
                        >
                            <ChevronRight size={16} />
                        </Button>
                    </div>
                </div>
            </div>

            <div
                ref={scrollRef}
                className="flex gap-6 overflow-x-auto pb-6 scroll-smooth hide-scrollbar snap-x no-scrollbar"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {isLoading ? (
                    Array(3).fill(0).map((_, i) => (
                        <div key={i} className="snap-start">
                            <ProjectCard project={{} as Project} isLoading />
                        </div>
                    ))
                ) : projects.length > 0 ? (
                    projects.map(project => (
                        <div key={project.id} className="snap-start">
                            <ProjectCard project={project} />
                        </div>
                    ))
                ) : (
                    <div className="w-full flex flex-col items-center justify-center p-12 glass-panel rounded-2xl border-dashed">
                        <LayoutGrid className="text-muted-foreground mb-4 opacity-20" size={48} />
                        <h3 className="text-lg font-bold mb-2">Create your first project</h3>
                        <p className="text-sm text-muted-foreground mb-6">Start managing your workflow with FreelanceOS</p>
                        <Button variant="gradient">New Project</Button>
                    </div>
                )}
            </div>
        </section>
    );
}
