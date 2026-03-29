

import * as React from 'react';
import { Suspense } from 'react';
import { fetchProjectOverview } from '@/lib/api/overviewApi';
import { Project } from '@/types';
import { ProjectDetailHeader } from '@/components/project-detail/ProjectDetailHeader';
import { ProjectDetailTabs } from '@/components/project-detail/ProjectDetailTabs';
import { Button } from '@/components/ui/Button';
import { LayoutGrid, ChevronLeft } from 'lucide-react';
import { Link } from '@/components/router/Link';

/**
 * Project Detail Page
 * 
 * Only fetches the overview (project meta) on load.
 * Each tab component fetches its own data lazily when the tab becomes active.
 * This avoids loading all 6 sections on every page visit.
 */
export default function ProjectDetailPage() {
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const projectId = pathParts[pathParts.indexOf('projects') + 1] || '';
    const searchParams = new URLSearchParams(window.location.search);
    const initialTab = searchParams.get('tab') || 'overview';

    const [project, setProject] = React.useState<Project | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState(false);

    React.useEffect(() => {
        if (!projectId) return;

        setIsLoading(true);
        fetchProjectOverview(projectId)
            .then((p) => {
                if (!p) { setError(true); return; }
                const client = p.client || {};
                setProject({
                    id: p.id,
                    clientId: p.clientId || p.client_id,
                    client: {
                        id: client.id,
                        name: client.name || '',
                        businessName: client.businessName || client.business_name || '',
                        email: client.email || '',
                        whatsapp: client.whatsapp || '',
                        verifiedEmail: client.verifiedEmail ?? client.verified_email ?? false,
                        verifiedWhatsapp: client.verifiedWhatsapp ?? client.verified_whatsapp ?? false,
                    },
                    projectTitle: p.title,
                    projectDescription: p.description,
                    projectStartDate: p.startDate || p.start_date,
                    projectDeadline: p.deadline,
                    projectType: p.type,
                    projectCost: Number(p.cost),
                    currency: p.currency,
                    paymentTerms: p.paymentTerms || p.payment_terms,
                    progressPercent: p.progressPercent ?? p.progress_percent ?? 0,
                    status: p.status,
                    clientMood: p.clientMood || p.client_mood,
                    revisions: p.revisions,
                    bufferDays: p.bufferDays ?? p.buffer_days,
                    recurringMaintenance: p.recurringMaintenance || p.recurring_maintenance,
                    prdContent: p.prdContent || p.prd_content,
                    styleContext: p.styleContext || p.style_context,
                    nextDeadlineDate: p.nextDeadlineDate || p.next_deadline_date || p.deadline,
                    nextMilestoneName: p.nextMilestoneName || p.next_milestone_name || 'Project Deadline',
                    onTimeCompletionRate: p.onTimeCompletionRate ?? p.on_time_completion_rate ?? null,
                    scheduleState: p.scheduleState || p.schedule_state,
                    scheduleLabel: p.scheduleLabel || p.schedule_label,
                    projectStarted: p.projectStarted ?? p.project_started ?? false,
                    hasGetStartedConfirmation:
                        p.hasGetStartedConfirmation ?? p.has_get_started_confirmation ?? false,
                    completedTaskCount: p.completedTaskCount ?? p.completed_task_count ?? 0,
                    totalTaskCount: p.totalTaskCount ?? p.total_task_count ?? 0,
                    completedMilestoneCount:
                        p.completedMilestoneCount ?? p.completed_milestone_count ?? 0,
                    totalMilestoneCount: p.totalMilestoneCount ?? p.total_milestone_count ?? 0,
                });
            })
            .catch(() => setError(true))
            .finally(() => setIsLoading(false));
    }, [projectId]);

    if (isLoading) {
        return (
            <div className="space-y-10 animate-pulse">
                <div className="flex justify-between items-center h-10 bg-muted/20 rounded-xl" />
                <div className="h-48 bg-muted/20 rounded-[2rem]" />
                <div className="h-12 w-64 bg-muted/20 rounded-xl" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="h-96 bg-muted/20 rounded-[2rem]" />
                    <div className="h-96 bg-muted/20 rounded-[2rem]" />
                </div>
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center">
                <LayoutGrid className="text-muted-foreground/20 mb-6" size={80} />
                <h2 className="text-2xl font-black uppercase tracking-tighter mb-4">Project Not Found</h2>
                <p className="text-muted-foreground mb-8 max-w-sm">
                    The project ID may be invalid, or you do not have access to it.
                </p>
                <Link href="/projects">
                    <Button variant="gradient" className="rounded-xl px-8 font-bold">
                        <ChevronLeft size={18} className="mr-2" /> Back to Projects
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-1000">
            <ProjectDetailHeader project={project} />
            {/* Each tab fetches its own data — no props passed down for tab content */}
            <Suspense fallback={<div>Loading tabs...</div>}>
                <ProjectDetailTabs project={project} projectId={projectId} initialTab={initialTab} />
            </Suspense>
        </div>
    );
}
