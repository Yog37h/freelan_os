'use client';

import * as React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Loader2, Calendar, Activity } from 'lucide-react';
import { formatDate } from '@/lib/format';
import { fetchUpdates } from '@/lib/api/updatesApi';
import { fetchPlanTimeline } from '@/lib/api/planApi';
import { fetchProjectOverview } from '@/lib/api/overviewApi';
import { cn } from '@/lib/cn';
import { getWhatsAppMessages } from '@/lib/whatsappApi';

interface UpdatesTabProps {
    projectId: string;
}

type ActivityEntry = {
    id: string;
    date: string;
    label: string;
    summary: string;
    category: 'system' | 'message' | 'request';
};

export function UpdatesTab({ projectId }: UpdatesTabProps) {
    const [activityItems, setActivityItems] = React.useState<ActivityEntry[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [filter, setFilter] = React.useState<'All' | 'System' | 'Messages' | 'Requests'>('All');

    React.useEffect(() => {
        setIsLoading(true);
        Promise.all([
            fetchProjectOverview(projectId),
            fetchPlanTimeline(projectId),
            fetchUpdates(projectId),
            getWhatsAppMessages(projectId),
        ])
            .then(([overview, timeline, updates, messages]) => {
                const overviewClient = overview?.client || {};
                const firstTask = (timeline?.buckets || [])
                    .flatMap((bucket: any) => bucket.tasks || [])
                    .sort((a: any, b: any) => String(a.dueDate || a.due_date).localeCompare(String(b.dueDate || b.due_date)))[0];

                const baseItems: ActivityEntry[] = [
                    {
                        id: 'client-onboarded',
                        date: String(overviewClient.createdAt || overviewClient.created_at || overview?.createdAt || new Date().toISOString()),
                        label: 'Client Onboarded',
                        summary: `${overviewClient.name || 'Client'} was added to this project workspace.`,
                        category: 'system',
                    },
                    {
                        id: 'project-started',
                        date: String(firstTask?.dueDate || firstTask?.due_date || overview?.startDate || overview?.start_date || new Date().toISOString()),
                        label: 'Project Started',
                        summary: firstTask
                            ? `The first task "${firstTask.title}" is scheduled to start the project.`
                            : 'The project timeline has been initialized.',
                        category: 'system',
                    },
                ];

                const updateItems: ActivityEntry[] = (updates || []).map((update: any) => ({
                    id: update.id,
                    date: String(update.sentAt || update.sent_at || new Date().toISOString()),
                    label: toLabel(update.type),
                    summary: String(update.summary || ''),
                    category: update.type === 'buffer' || update.type === 'approval' ? 'request' : 'message',
                }));

                const messageItems: ActivityEntry[] = (messages || []).map((message: any) => ({
                    id: `wa-${message.id}`,
                    date: String(message.createdAt || message.created_at || new Date().toISOString()),
                    label: message.direction === 'incoming' ? 'Client Message' : 'WhatsApp Update',
                    summary: describeActivityMessage(message),
                    category: 'message',
                }));

                setActivityItems(
                    [...baseItems, ...updateItems, ...messageItems]
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
                );
            })
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, [projectId]);

    const filteredItems = activityItems.filter((item) => {
        if (filter === 'All') return true;
        if (filter === 'System') return item.category === 'system';
        if (filter === 'Messages') return item.category === 'message';
        return item.category === 'request';
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-24 text-muted-foreground">
                <Loader2 className="animate-spin mr-3" size={20} />
                <span className="text-sm font-bold uppercase tracking-widest">Loading Activity...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h3 className="text-xl font-black tracking-tighter uppercase">Project Activity</h3>
                <div className="flex bg-muted/30 p-1 rounded-xl border border-white/5">
                    {(['All', 'System', 'Messages', 'Requests'] as const).map((value) => (
                        <button
                            key={value}
                            onClick={() => setFilter(value)}
                            className={cn(
                                'px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all',
                                filter === value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                            )}
                        >
                            {value}
                        </button>
                    ))}
                </div>
            </div>

            {filteredItems.length === 0 ? (
                <div className="p-12 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                    <p className="text-xs text-muted-foreground uppercase font-black">No activity recorded yet.</p>
                </div>
            ) : (
                <div className="relative pl-8 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-white/5">
                    {filteredItems.map((item) => (
                        <div key={item.id} className="relative">
                            <div className="absolute left-[-28px] top-1 w-6 h-6 rounded-lg gradient-blue flex items-center justify-center text-white z-10 shadow-lg">
                                {item.category === 'request' ? <Activity size={12} /> : <Calendar size={12} />}
                            </div>

                            <Card className="p-5 border-white/5 shadow-xl glass-panel group hover:border-primary/30 transition-all">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-black uppercase tracking-widest text-primary">{item.label}</span>
                                        <span className="text-[10px] text-muted-foreground">• {formatDate(item.date)}</span>
                                    </div>
                                    <Badge variant="outline" className="text-[8px] h-4 bg-white/5 border-none">
                                        {item.category}
                                    </Badge>
                                </div>
                                <p className="text-sm font-medium leading-relaxed">{item.summary}</p>
                            </Card>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function toLabel(type: string) {
    switch (type) {
        case 'weekly':
            return 'Mail Update';
        case 'deliverable':
            return 'Deliverable Update';
        case 'buffer':
            return 'Buffer Request';
        case 'approval':
            return 'Scope Request';
        default:
            return 'Activity';
    }
}

function describeActivityMessage(message: {
    direction: string;
    messageType: string;
    content: string;
}) {
    if (message.direction === 'incoming' && message.messageType === 'button_response') {
        return message.content || 'Client sent a quick reply';
    }

    if (message.direction === 'incoming') {
        return `Client sent: ${message.content}`;
    }

    return `Sent to client: ${message.content}`;
}
