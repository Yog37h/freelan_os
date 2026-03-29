import * as React from 'react';
import { cn } from '@/lib/cn';

const Card = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { glass?: boolean }
>(({ className, glass, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            'rounded-2xl border border-border bg-card text-card-foreground p-6 shadow-sm',
            glass && 'glass-panel border-white/5',
            className
        )}
        {...props}
    />
));
Card.displayName = 'Card';

export { Card };
