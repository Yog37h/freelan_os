'use client';

import * as React from 'react';
import {
    getDashboardSummary,
    getGreeting,
    getProjects,
    getUser
} from '@/lib/data';
import { ActionCard } from './ActionCard';
import { OngoingProjectsCarousel } from './OngoingProjectsCarousel';
import { QuickActionDock } from './QuickActionDock';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Calendar, CheckCircle2 } from 'lucide-react';
import { DashboardSummaryCard, Project, User } from '@/types';
import { cn } from '@/lib/cn';

const DASHBOARD_REFRESH_MS = 15000;

export function HomeDashboard() {
    const [cards, setCards] = React.useState<DashboardSummaryCard[]>([]);
    const [projects, setProjects] = React.useState<Project[]>([]);
    const [user, setUser] = React.useState<User | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);

    const loadDashboard = React.useCallback(async () => {
        const [summary, activeProjects, profile] = await Promise.all([
            getDashboardSummary(),
            getProjects({ status: 'active' }),
            getUser()
        ]);

        setCards(summary);
        setProjects(activeProjects);
        setUser(profile);
        setIsLoading(false);
    }, []);

    React.useEffect(() => {
        let isMounted = true;

        const safeLoad = async () => {
            if (!isMounted) return;
            await loadDashboard();
        };

        safeLoad();

        const intervalId = window.setInterval(safeLoad, DASHBOARD_REFRESH_MS);
        const handleFocus = () => {
            safeLoad();
        };

        window.addEventListener('focus', handleFocus);

        return () => {
            isMounted = false;
            window.clearInterval(intervalId);
            window.removeEventListener('focus', handleFocus);
        };
    }, [loadDashboard]);

    const handleTaskClick = React.useCallback((task: DashboardSummaryCard) => {
        window.location.href = task.route;
    }, []);

    const greeting = getGreeting();
    const activeProjectsCount = projects.length;

    return (
        <div className="space-y-10 pb-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    {isLoading ? (
                        <div className="space-y-2 animate-pulse">
                            <div className="h-8 w-48 bg-muted rounded" />
                            <div className="h-4 w-32 bg-muted rounded" />
                        </div>
                    ) : (
                        <>
                            <h1 className="text-3xl font-extrabold tracking-tight">
                                {greeting}, {user?.name || 'there'} 👋
                            </h1>
                            <div className="flex items-center gap-3 mt-2">
                                <p className="text-muted-foreground">
                                    You&apos;re running {activeProjectsCount} active projects
                                </p>
                                <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px] font-bold">
                                    <div className="w-1.5 h-1.5 rounded-full gradient-blue mr-1.5 animate-pulse" />
                                    FOCUS TODAY
                                </Badge>
                            </div>
                        </>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card border border-border text-xs font-medium">
                        <Calendar size={14} className="text-primary" />
                        {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-9 px-4 rounded-xl text-xs"
                        onClick={() => {
                            window.location.href = '/timeline';
                        }}
                    >
                        View Week
                    </Button>
                </div>
            </div>

            <section className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {isLoading ? (
                        Array(4).fill(0).map((_, index) => <ActionCard key={index} task={{} as DashboardSummaryCard} isLoading />)
                    ) : cards.length > 0 ? (
                        cards.map((task) => (
                            <ActionCard key={task.id} task={task} onClick={handleTaskClick} />
                        ))
                    ) : (
                        <DashboardSectionContainer className="col-span-full p-8 flex flex-col items-center justify-center text-center bg-emerald-500/5 border-emerald-500/10">
                            <CheckCircle2 className="text-emerald-500 mb-2" size={32} />
                            <h3 className="font-bold">You&apos;re clear today</h3>
                            <p className="text-xs text-muted-foreground">Nothing needs your attention right now.</p>
                        </DashboardSectionContainer>
                    )}
                </div>
                {!isLoading && cards.length > 0 && (
                    <div className="flex justify-center pt-2">
                        <Button
                            variant="gradient"
                            className="px-10 rounded-2xl font-bold shadow-xl glow-blue"
                            onClick={() => {
                                window.location.href = '/timeline';
                            }}
                        >
                            What&apos;s today?
                        </Button>
                    </div>
                )}
            </section>

            <OngoingProjectsCarousel projects={projects} isLoading={isLoading} />

            <QuickActionDock />
        </div>
    );
}

function DashboardSectionContainer({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <div className={cn('p-6 rounded-2xl border border-border bg-card', className)}>
            {children}
        </div>
    );
}
