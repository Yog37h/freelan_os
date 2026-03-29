'use client';

import * as React from 'react';
import { BucketCard, BucketData, BucketTask } from './BucketCard';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ArrowUpDown, Loader2 } from 'lucide-react';

interface TimelineBucketListProps {
    buckets: BucketData[];
    mode: 'milestone' | 'weekly';
    editable?: boolean;
    onBucketsChange?: (buckets: BucketData[]) => void;
    onReorderConfirm?: (order: string[], autoShift: boolean) => void;
    /** For persisted timeline: callbacks hit API */
    onBucketUpdate?: (bucketId: string, updates: Partial<BucketData>) => void;
    onAddDeliverable?: (bucketId: string, title: string) => void;
    onRemoveDeliverable?: (bucketId: string, deliverableIndex: number) => void;
    onUpdateDeliverable?: (bucketId: string, deliverableIndex: number, title: string) => void;
    onAddTask?: (
        bucketId: string,
        title: string,
        dueDate: string,
        deliverableId?: string | null,
    ) => void;
    onRemoveTask?: (bucketId: string, taskIndex: number) => void;
    onUpdateTask?: (bucketId: string, taskIndex: number, updates: Partial<BucketTask>) => void;
}

export function TimelineBucketList({
    buckets,
    mode,
    editable = true,
    onBucketsChange,
    onReorderConfirm,
    onBucketUpdate,
    onAddDeliverable,
    onRemoveDeliverable,
    onUpdateDeliverable,
    onAddTask,
    onRemoveTask,
    onUpdateTask,
}: TimelineBucketListProps) {
    const [localBuckets, setLocalBuckets] = React.useState<BucketData[]>(buckets);
    const [dragIndex, setDragIndex] = React.useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null);
    const [hasReordered, setHasReordered] = React.useState(false);
    const [autoShift, setAutoShift] = React.useState(true);
    const [isReordering, setIsReordering] = React.useState(false);

    React.useEffect(() => {
        setLocalBuckets(buckets);
    }, [buckets]);

    // Local edit (for preview mode before confirm)
    const updateLocalBucket = (index: number, updates: Partial<BucketData>) => {
        const updated = [...localBuckets];
        updated[index] = { ...updated[index], ...updates };
        setLocalBuckets(updated);
        onBucketsChange?.(updated);
    };

    const addLocalDeliverable = (index: number, title: string) => {
        const updated = [...localBuckets];
        updated[index] = {
            ...updated[index],
            deliverables: [...updated[index].deliverables, { temp_id: `d-new-${Date.now()}`, title, acceptance_criteria: [] }],
        };
        setLocalBuckets(updated);
        onBucketsChange?.(updated);
    };

    const removeLocalDeliverable = (bucketIndex: number, deliverableIndex: number) => {
        const updated = [...localBuckets];
        updated[bucketIndex] = {
            ...updated[bucketIndex],
            deliverables: updated[bucketIndex].deliverables.filter((_, i) => i !== deliverableIndex),
        };
        setLocalBuckets(updated);
        onBucketsChange?.(updated);
    };

    const updateLocalDeliverable = (bucketIndex: number, deliverableIndex: number, title: string) => {
        const updated = [...localBuckets];
        const delivs = [...updated[bucketIndex].deliverables];
        delivs[deliverableIndex] = { ...delivs[deliverableIndex], title };
        updated[bucketIndex] = { ...updated[bucketIndex], deliverables: delivs };
        setLocalBuckets(updated);
        onBucketsChange?.(updated);
    };

    const addLocalTask = (
        index: number,
        title: string,
        dueDate: string,
        deliverableId?: string | null,
    ) => {
        const updated = [...localBuckets];
        updated[index] = {
            ...updated[index],
            tasks: [
                ...updated[index].tasks,
                {
                    temp_id: `t-new-${Date.now()}`,
                    title,
                    due_date: dueDate,
                    deliverable_id: deliverableId ?? null,
                },
            ],
        };
        setLocalBuckets(updated);
        onBucketsChange?.(updated);
    };

    const removeLocalTask = (bucketIndex: number, taskIndex: number) => {
        const updated = [...localBuckets];
        updated[bucketIndex] = {
            ...updated[bucketIndex],
            tasks: updated[bucketIndex].tasks.filter((_, i) => i !== taskIndex),
        };
        setLocalBuckets(updated);
        onBucketsChange?.(updated);
    };

    const updateLocalTask = (bucketIndex: number, taskIndex: number, updates: Partial<BucketTask>) => {
        const updated = [...localBuckets];
        const tasks = [...updated[bucketIndex].tasks];
        tasks[taskIndex] = { ...tasks[taskIndex], ...updates };
        updated[bucketIndex] = { ...updated[bucketIndex], tasks };
        setLocalBuckets(updated);
        onBucketsChange?.(updated);
    };

    // Drag and drop
    const handleDragStart = (index: number) => {
        setDragIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        setDragOverIndex(index);
    };

    const handleDrop = (dropIndex: number) => {
        if (dragIndex === null || dragIndex === dropIndex) {
            setDragIndex(null);
            setDragOverIndex(null);
            return;
        }

        const updated = [...localBuckets];
        const [moved] = updated.splice(dragIndex, 1);
        updated.splice(dropIndex, 0, moved);
        setLocalBuckets(updated);
        onBucketsChange?.(updated);
        setHasReordered(true);
        setDragIndex(null);
        setDragOverIndex(null);
    };

    const handleConfirmReorder = async () => {
        if (!onReorderConfirm) return;
        setIsReordering(true);
        try {
            const order = localBuckets.map(b => b.id!).filter(Boolean);
            await onReorderConfirm(order, autoShift);
            setHasReordered(false);
        } finally {
            setIsReordering(false);
        }
    };

    return (
        <div className="space-y-3">
            {/* Mode badge */}
            <div className="flex items-center justify-between">
                <Badge variant="gradient" className="text-[9px] font-black uppercase tracking-widest px-3 py-1">
                    {mode === 'milestone' ? '🎯 Milestone Mode' : '📅 Weekly Mode'}
                </Badge>
                <span className="text-[10px] text-muted-foreground font-bold">
                    {localBuckets.length} {mode === 'milestone' ? 'milestones' : 'weeks'}
                </span>
            </div>

            {/* Reorder confirmation bar */}
            {hasReordered && editable && (
                <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/10 rounded-xl animate-in slide-in-from-top-2 duration-200">
                    <ArrowUpDown size={14} className="text-primary" />
                    <span className="text-xs font-bold flex-1">Buckets reordered</span>
                    <label className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground cursor-pointer">
                        <input
                            type="checkbox"
                            checked={autoShift}
                            onChange={(e) => setAutoShift(e.target.checked)}
                            className="rounded"
                        />
                        Auto-shift dates
                    </label>
                    <Button
                        variant="gradient"
                        size="sm"
                        className="h-7 px-3 text-[9px] font-black uppercase rounded-lg"
                        onClick={handleConfirmReorder}
                        disabled={isReordering}
                    >
                        {isReordering ? <Loader2 size={12} className="animate-spin" /> : 'Save Order'}
                    </Button>
                </div>
            )}

            {/* Bucket cards */}
            {localBuckets.map((bucket, i) => {
                const bucketKey = bucket.id || bucket.temp_id || `bucket-${i}`;
                const isApiPersisted = !!bucket.id;

                return (
                    <div
                        key={bucketKey}
                        draggable={editable}
                        onDragStart={() => handleDragStart(i)}
                        onDragOver={(e) => handleDragOver(e, i)}
                        onDrop={() => handleDrop(i)}
                        onDragEnd={() => { setDragIndex(null); setDragOverIndex(null); }}
                        className={`transition-all duration-200 ${dragOverIndex === i ? 'border-t-2 border-primary/50 pt-1' : ''
                            } ${dragIndex === i ? 'opacity-50 scale-[0.98]' : ''}`}
                    >
                        <BucketCard
                            bucket={bucket}
                            index={i}
                            mode={mode}
                            editable={editable}
                            onUpdate={(updates) => {
                                if (isApiPersisted && onBucketUpdate) {
                                    onBucketUpdate(bucket.id!, updates);
                                    return;
                                }
                                updateLocalBucket(i, updates);
                            }}
                            onAddDeliverable={(title) => {
                                if (isApiPersisted && onAddDeliverable) {
                                    onAddDeliverable(bucket.id!, title);
                                    return;
                                }
                                addLocalDeliverable(i, title);
                            }}
                            onRemoveDeliverable={(di) => {
                                if (isApiPersisted && onRemoveDeliverable) {
                                    onRemoveDeliverable(bucket.id!, di);
                                    return;
                                }
                                removeLocalDeliverable(i, di);
                            }}
                            onUpdateDeliverable={(di, title) => {
                                if (isApiPersisted && onUpdateDeliverable) {
                                    onUpdateDeliverable(bucket.id!, di, title);
                                    return;
                                }
                                updateLocalDeliverable(i, di, title);
                            }}
                            onAddTask={(title, dueDate, deliverableId) => {
                                if (isApiPersisted && onAddTask) {
                                    onAddTask(bucket.id!, title, dueDate, deliverableId);
                                    return;
                                }
                                addLocalTask(i, title, dueDate, deliverableId);
                            }}
                            onRemoveTask={(ti) => {
                                if (isApiPersisted && onRemoveTask) {
                                    onRemoveTask(bucket.id!, ti);
                                    return;
                                }
                                removeLocalTask(i, ti);
                            }}
                            onUpdateTask={(ti, updates) => {
                                if (isApiPersisted && onUpdateTask) {
                                    onUpdateTask(bucket.id!, ti, updates);
                                    return;
                                }
                                updateLocalTask(i, ti, updates);
                            }}
                            dragHandleProps={editable ? {
                                onMouseDown: (e: React.MouseEvent) => e.stopPropagation(),
                            } : undefined}
                        />
                    </div>
                );
            })}

            {localBuckets.length === 0 && (
                <div className="p-12 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                    <p className="text-xs text-muted-foreground uppercase font-black">
                        No timeline data yet.
                    </p>
                </div>
            )}
        </div>
    );
}
