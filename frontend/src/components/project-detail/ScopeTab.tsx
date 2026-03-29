'use client';

import * as React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { CheckSquare, XSquare, RefreshCw, Loader2, AlertTriangle, Lightbulb } from 'lucide-react';
import { fetchScope } from '@/lib/api/scopeApi';
import { fetchPlanTimeline } from '@/lib/api/planApi';

interface ScopeTabProps {
    projectId: string;
}

type ScopeGroup = { id: string; label: string; note?: string };

export function ScopeTab({ projectId }: ScopeTabProps) {
    const [inScope, setInScope] = React.useState<ScopeGroup[]>([]);
    const [outOfScope, setOutOfScope] = React.useState<ScopeGroup[]>([]);
    const [changes, setChanges] = React.useState<ScopeGroup[]>([]);
    const [assumptions, setAssumptions] = React.useState<ScopeGroup[]>([]);
    const [risks, setRisks] = React.useState<ScopeGroup[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    // Lazy fetch via /api/projects/:id/scope
    React.useEffect(() => {
        setIsLoading(true);
        Promise.all([fetchScope(projectId), fetchPlanTimeline(projectId)])
            .then(([scopeData, timelineData]) => {
                setInScope(scopeData.inScope);
                setOutOfScope(scopeData.outOfScope);
                setChanges(scopeData.changes);

                const noteRows = (timelineData.buckets || []).flatMap((bucket: any) =>
                    (bucket.notes || []).map((note: any) => ({
                        id: note.id,
                        label: note.text,
                        note: bucket.title,
                        type: note.noteType || note.note_type,
                    })),
                );

                setAssumptions(noteRows.filter((item) => item.type === 'assumption'));
                setRisks(noteRows.filter((item) => item.type === 'risk'));
            })
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, [projectId]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-24 text-muted-foreground">
                <Loader2 className="animate-spin mr-3" size={20} />
                <span className="text-sm font-bold uppercase tracking-widest">Loading Scope Matrix...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-black tracking-tighter uppercase">Scope Matrix</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* In Scope */}
                <ScopeColumn
                    title="In Scope"
                    icon={<CheckSquare size={16} className="text-emerald-500" />}
                    items={inScope}
                    badgeColor="bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                    emptyLabel="No inclusions defined"
                />

                {/* Out of Scope */}
                <ScopeColumn
                    title="Out of Scope"
                    icon={<XSquare size={16} className="text-rose-500" />}
                    items={outOfScope}
                    badgeColor="bg-rose-500/10 text-rose-500 border-rose-500/20"
                    emptyLabel="No exclusions defined"
                />

                {/* Change Requests */}
                <ScopeColumn
                    title="Change Requests"
                    icon={<RefreshCw size={16} className="text-amber-500" />}
                    items={changes}
                    badgeColor="bg-amber-500/10 text-amber-500 border-amber-500/20"
                    emptyLabel="No change requests"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ScopeColumn
                    title="Assumptions"
                    icon={<Lightbulb size={16} className="text-amber-500" />}
                    items={assumptions}
                    badgeColor="bg-amber-500/10 text-amber-500 border-amber-500/20"
                    emptyLabel="No assumptions captured"
                />
                <ScopeColumn
                    title="Risks"
                    icon={<AlertTriangle size={16} className="text-rose-500" />}
                    items={risks}
                    badgeColor="bg-rose-500/10 text-rose-500 border-rose-500/20"
                    emptyLabel="No risks captured"
                />
            </div>
        </div>
    );
}

function ScopeColumn({
    title,
    icon,
    items,
    badgeColor,
    emptyLabel,
}: {
    title: string;
    icon: React.ReactNode;
    items: ScopeGroup[];
    badgeColor: string;
    emptyLabel: string;
}) {
    return (
        <Card className="p-5 border-white/5 space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {icon}
                    <h4 className="text-xs font-black uppercase tracking-widest">{title}</h4>
                </div>
                <Badge className={`text-[9px] h-5 border ${badgeColor}`}>{items.length}</Badge>
            </div>

            {items.length === 0 ? (
                <p className="text-[10px] text-muted-foreground uppercase font-black text-center py-4 italic">
                    {emptyLabel}
                </p>
            ) : (
                <div className="space-y-2">
                    {items.map((item) => (
                        <div key={item.id} className="p-3 rounded-xl bg-white/5 border border-white/5 group hover:border-white/10 transition-colors">
                            <p className="text-sm font-semibold leading-tight">{item.label}</p>
                            {item.note && (
                                <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">{item.note}</p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
}
