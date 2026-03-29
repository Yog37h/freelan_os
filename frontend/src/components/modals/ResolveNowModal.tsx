'use client';

import * as React from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { TodayTask } from '@/types';
import { Flame, Clock, CircleDollarSign, Send, ArrowRight } from 'lucide-react';

const iconMap = {
    deliverable: Flame,
    approval: Clock,
    invoice: CircleDollarSign,
    update: Send,
};

export function ResolveNowModal({
    isOpen,
    onClose,
    tasks
}: {
    isOpen: boolean;
    onClose: () => void;
    tasks: TodayTask[];
}) {
    // Sort tasks by priority
    const sortedTasks = [...tasks].sort((a, b) => {
        const priority = { high: 0, medium: 1, low: 2 };
        return priority[a.severity] - priority[b.severity];
    });

    return (
        <Dialog isOpen={isOpen} onClose={onClose} title="Command Center: Pending Actions">
            <div className="space-y-3 mt-4">
                {sortedTasks.map((task) => {
                    const Icon = iconMap[task.type];
                    return (
                        <div
                            key={task.id}
                            className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group"
                        >
                            <div className="w-10 h-10 rounded-xl gradient-blue flex items-center justify-center shrink-0">
                                <Icon size={20} className="text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-sm font-bold truncate">{task.title}</span>
                                    <Badge variant={task.severity === 'high' ? 'destructive' : 'secondary'} className="text-[10px] scale-75 origin-left h-4">
                                        {task.severity.toUpperCase()}
                                    </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground truncate">{task.context}</p>
                            </div>
                            <Button size="icon" variant="ghost" className="rounded-full group-hover:bg-primary group-hover:text-white transition-all">
                                <ArrowRight size={18} />
                            </Button>
                        </div>
                    );
                })}
            </div>
            <div className="pt-6 flex justify-end">
                <Button variant="outline" onClick={onClose} className="rounded-xl">Dismiss All</Button>
            </div>
        </Dialog>
    );
}
