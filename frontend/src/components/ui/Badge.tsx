import * as React from 'react';
import { cn } from '@/lib/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'destructive' | 'gradient';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
    const variants = {
        default: 'bg-primary text-primary-foreground',
        secondary: 'bg-muted text-muted-foreground',
        outline: 'border border-border text-foreground',
        success: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20',
        warning: 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
        destructive: 'bg-rose-500/10 text-rose-500 border border-rose-500/20',
        gradient: 'gradient-blue text-white',
    };

    return (
        <div
            className={cn(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
                variants[variant],
                className
            )}
            {...props}
        />
    );
}

export { Badge };
