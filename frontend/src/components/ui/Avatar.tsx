import * as React from 'react';
import { cn } from '@/lib/cn';

export function Avatar({ className, initials }: { className?: string; initials: string }) {
    return (
        <div
            className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted font-semibold text-muted-foreground border border-border',
                className
            )}
        >
            {initials}
        </div>
    );
}
