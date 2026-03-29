'use client';

import * as React from 'react';
import { Project } from '@/types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
    CheckCircle2,
    Circle,
    Lock,
    Unlock,
    AlertTriangle,
    FileCheck,
    CreditCard,
    MessageSquare,
    Archive,
    Loader2
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { fetchClosure, saveClosureChecklist, closeProject } from '@/lib/api/closureApi';

interface ClosureTabProps {
    project: Project;
    projectId: string;
}

interface ChecklistItem {
    id: string;
    label: string;
    icon: React.ReactNode;
    description: string;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
    { id: 'deliverables', label: 'All deliverables handed off', icon: <FileCheck size={18} />, description: 'Final files, source assets, and documentation delivered to client.' },
    { id: 'payment', label: 'Final payment received', icon: <CreditCard size={18} />, description: 'All invoices paid and payment cleared in ledger.' },
    { id: 'feedback', label: 'Client feedback collected', icon: <MessageSquare size={18} />, description: 'Testimonial, review, or feedback form completed.' },
    { id: 'archive', label: 'Project files archived', icon: <Archive size={18} />, description: 'Project folder organized and backed up to cloud.' },
];

export function ClosureTab({ project, projectId }: ClosureTabProps) {
    const [checked, setChecked] = React.useState<Record<string, boolean>>({});
    const [isClosing, setIsClosing] = React.useState(false);
    const [closed, setClosed] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(true);

    // Lazy fetch — load persisted checklist state
    React.useEffect(() => {
        setIsLoading(true);
        fetchClosure(projectId)
            .then((data) => {
                if (data?.checklist_state) setChecked(data.checklist_state);
                if (data?.closed_at) setClosed(true);
            })
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, [projectId]);

    const allChecked = CHECKLIST_ITEMS.every(item => checked[item.id]);

    /** Toggle a checklist item and persist to backend */
    const handleToggle = async (id: string) => {
        const updated = { ...checked, [id]: !checked[id] };
        setChecked(updated);
        try {
            await saveClosureChecklist(projectId, updated);
        } catch {
            // Revert on failure
            setChecked(checked);
        }
    };

    /** Close the project — POSTs to /closure/close */
    const handleCloseProject = async () => {
        if (!allChecked || isClosing) return;
        setIsClosing(true);
        try {
            await closeProject(projectId);
            setClosed(true);
        } catch (err) {
            console.error('Failed to close project:', err);
            alert('Failed to close project — please try again.');
        } finally {
            setIsClosing(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-24 text-muted-foreground">
                <Loader2 className="animate-spin mr-3" size={20} />
                <span className="text-sm font-bold uppercase tracking-widest">Loading Closure State...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-black tracking-tighter uppercase">Project Closure</h3>
                    <p className="text-xs text-muted-foreground mt-1">Complete all items before permanently closing this project.</p>
                </div>
                {closed && <Badge variant="success" className="text-xs">CLOSED</Badge>}
            </div>

            {/* Closure Banner (if already closed) */}
            {closed && (
                <Card className="p-6 bg-emerald-500/5 border-emerald-500/20 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                        <CheckCircle2 size={24} className="text-emerald-500" />
                    </div>
                    <div>
                        <p className="font-black text-emerald-400">Project Successfully Closed</p>
                        <p className="text-xs text-muted-foreground mt-0.5">This project has been archived and marked as completed.</p>
                    </div>
                </Card>
            )}

            {/* Checklist */}
            <Card className="p-6 border-white/5 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Closure Checklist</h4>
                {CHECKLIST_ITEMS.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => !closed && handleToggle(item.id)}
                        disabled={closed}
                        className={cn(
                            "w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left",
                            checked[item.id]
                                ? "bg-emerald-500/5 border-emerald-500/20"
                                : "bg-white/5 border-white/5 hover:border-white/10",
                            closed && "cursor-default opacity-80"
                        )}
                    >
                        <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                            checked[item.id] ? "bg-emerald-500/20 text-emerald-500" : "bg-white/5 text-muted-foreground"
                        )}>
                            {item.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className={cn("text-sm font-bold", checked[item.id] && "line-through text-muted-foreground")}>{item.label}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{item.description}</p>
                        </div>
                        <div className="shrink-0">
                            {checked[item.id] ? (
                                <CheckCircle2 size={20} className="text-emerald-500" />
                            ) : (
                                <Circle size={20} className="text-muted-foreground/30" />
                            )}
                        </div>
                    </button>
                ))}
            </Card>

            {/* Progress */}
            <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                        className="h-full gradient-blue transition-all duration-500"
                        style={{ width: `${(Object.values(checked).filter(Boolean).length / CHECKLIST_ITEMS.length) * 100}%` }}
                    />
                </div>
                <span className="text-xs font-black text-muted-foreground shrink-0">
                    {Object.values(checked).filter(Boolean).length}/{CHECKLIST_ITEMS.length} Complete
                </span>
            </div>

            {/* Close Button */}
            {!closed && (
                <div className="pt-2">
                    {!allChecked && (
                        <p className="flex items-center gap-2 text-[10px] text-amber-500 font-bold uppercase tracking-widest mb-4">
                            <AlertTriangle size={12} /> Complete all checklist items to unlock closure
                        </p>
                    )}
                    <Button
                        onClick={handleCloseProject}
                        disabled={!allChecked || isClosing}
                        className={cn(
                            "w-full h-12 font-black uppercase tracking-widest text-sm rounded-2xl transition-all",
                            allChecked
                                ? "gradient-blue text-white shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:shadow-[0_0_40px_rgba(6,182,212,0.6)]"
                                : "bg-muted/30 text-muted-foreground cursor-not-allowed"
                        )}
                    >
                        {isClosing ? (
                            <><Loader2 size={16} className="animate-spin mr-2 inline" />Closing Project...</>
                        ) : allChecked ? (
                            <><Unlock size={16} className="mr-2 inline" />Close &amp; Archive Project</>
                        ) : (
                            <><Lock size={16} className="mr-2 inline" />Locked — Checklist Incomplete</>
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}
