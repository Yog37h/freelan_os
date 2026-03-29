

import * as React from 'react';
import { Link } from '@/components/router/Link';
import {
    ChevronLeft,
    Send,
    MessageSquare,
    Clock,
    Plus
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Project } from '@/types';
import { cn } from '@/lib/cn';
import { ChangeRequestModal } from './ChangeRequestModal';
import { SendUpdateModal } from '../projects/SendUpdateModal';
import { postUpdate } from '@/lib/api/updatesApi';

export function ProjectDetailHeader({ project }: { project: Project }) {
    const [isChangeModalOpen, setIsChangeModalOpen] = React.useState(false);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = React.useState(false);

    const moodColors = {
        Healthy: 'bg-emerald-500',
        Watch: 'bg-amber-500',
        Risk: 'bg-rose-500',
    };

    return (
        <div className="space-y-6 mb-10">
            {/* Breadcrumbs & Back */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/projects">
                        <Button variant="ghost" size="icon" className="rounded-full bg-card/50 border border-white/5 hover:bg-muted text-muted-foreground hover:text-foreground">
                            <ChevronLeft size={18} />
                        </Button>
                    </Link>
                    <div className="flex items-center gap-2 text-sm">
                        <Link href="/projects" className="text-muted-foreground hover:text-foreground transition-colors">Projects</Link>
                        <span className="text-muted-foreground/30">/</span>
                        <span className="font-bold text-foreground truncate max-w-[200px]">{project.projectTitle}</span>
                    </div>
                </div>
                <div className="hidden md:flex items-center gap-3">
                    <Badge variant="secondary" className="bg-card/50 border-white/5 text-[10px] py-1 px-3 rounded-full">
                        <span className={cn("inline-block w-1.5 h-1.5 rounded-full mr-2", moodColors[project.clientMood])} />
                        Mood: {project.clientMood}
                    </Badge>
                    <Badge variant="outline" className="border-white/10 text-[10px] py-1 px-3 rounded-full">
                        {project.status}
                    </Badge>
                </div>
            </div>

            {/* Main Info */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-card/40 p-8 rounded-3xl border border-white/5 glass-panel">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl gradient-blue flex items-center justify-center shadow-lg">
                            <span className="text-white font-black text-xl">{project.projectTitle[0]}</span>
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tighter">{project.projectTitle}</h1>
                            <p className="text-muted-foreground text-sm font-medium">with {project.client.businessName}</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 pt-1">
                        <div className="flex items-center gap-2">
                            <div className="w-full h-2 w-32 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full gradient-blue animate-pulse-slow" style={{ width: `${project.progressPercent}%` }} />
                            </div>
                            <span className="text-xs font-bold text-primary">{project.progressPercent}% DONE</span>
                        </div>
                        {project.tags?.map(tag => (
                            <Badge key={tag} variant="secondary" className="bg-primary/5 text-primary border-none text-[9px] font-black uppercase tracking-widest px-2 h-5">
                                {tag}
                            </Badge>
                        ))}
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 lg:gap-3">
                    <Button
                        variant="gradient"
                        className="rounded-xl font-bold px-5 h-12 shadow-lg"
                        onClick={() => setIsUpdateModalOpen(true)}
                    >
                        <Send size={18} className="mr-2" /> Prompt a Mail Update
                    </Button>
                    <Button
                        variant="secondary"
                        className="rounded-xl font-bold px-5 h-12 bg-white/5 border border-white/5 hover:bg-white/10 shadow-sm"
                        onClick={() => setIsChangeModalOpen(true)}
                    >
                        <MessageSquare size={18} className="mr-2 text-primary" /> Request
                    </Button>
                </div>
            </div>

            <ChangeRequestModal
                isOpen={isChangeModalOpen}
                onClose={() => setIsChangeModalOpen(false)}
                project={project}
                onSubmit={(payload) => postUpdate(project.id, payload)}
            />

            <SendUpdateModal
                isOpen={isUpdateModalOpen}
                onClose={() => setIsUpdateModalOpen(false)}
                project={project}
                onSubmit={(payload) => postUpdate(project.id, payload)}
            />
        </div>
    );
}
