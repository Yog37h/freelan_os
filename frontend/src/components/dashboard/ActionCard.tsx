

import * as React from 'react';
import {
    Flame,
    Clock,
    CircleDollarSign,
    Send,
    MoreVertical
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { TodayTask } from '@/types';
import { cn } from '@/lib/cn';
import { Link } from '@/components/router/Link';
import { useAppNavigate } from '@/lib/navigation';

const iconMap = {
    deliverable: Flame,
    approval: Clock,
    invoice: CircleDollarSign,
    update: Send,
};

export function ActionCard({
    task,
    isLoading = false,
    onClick
}: {
    task: TodayTask;
    isLoading?: boolean;
    onClick?: (task: TodayTask) => void;
}) {
    const router = useAppNavigate();
    const Icon = iconMap[task.type];

    if (isLoading) {
        return (
            <Card className="p-5 flex flex-col h-full bg-card/40 border-dashed animate-pulse">
                <div className="w-10 h-10 rounded-lg bg-muted mb-4" />
                <div className="h-4 w-3/4 bg-muted rounded mb-2" />
                <div className="h-3 w-1/2 bg-muted rounded mb-4" />
                <div className="mt-auto h-9 w-full bg-muted rounded-xl" />
            </Card>
        );
    }

    return (
        <Card className="p-5 flex flex-col h-full hover:border-primary/50 transition-all group">
            <div className="flex justify-between items-start mb-4">
                <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    task.type === 'deliverable' && "bg-rose-500/10 text-rose-500",
                    task.type === 'approval' && "bg-amber-500/10 text-amber-500",
                    task.type === 'invoice' && "bg-emerald-500/10 text-emerald-500",
                    task.type === 'update' && "bg-primary/10 text-primary",
                )}>
                    <Icon size={22} />
                </div>
                <Badge variant={task.severity === 'high' ? 'destructive' : 'secondary'} className="text-[10px]">
                    {task.severity.toUpperCase()}
                </Badge>
            </div>

            <h3 className="font-bold text-sm mb-1 group-hover:text-primary transition-colors">{task.title}</h3>
            <p className="text-xs text-muted-foreground mb-5 line-clamp-1">{task.context}</p>

            <div className="mt-auto">
                <Button
                    variant="secondary"
                    size="sm"
                    className="w-full h-9 rounded-xl text-xs hover:bg-primary hover:text-white transition-all font-bold"
                    onClick={() => onClick ? onClick(task) : router.navigate(task.route)}
                >
                    {task.actionLabel}
                </Button>
            </div>
        </Card>
    );
}
