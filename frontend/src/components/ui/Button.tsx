import * as React from 'react';
import { cn } from '@/lib/cn';

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient';
    size?: 'sm' | 'md' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
        const variants = {
            primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
            secondary: 'bg-muted text-foreground hover:bg-muted/80',
            outline: 'border border-border bg-transparent hover:bg-muted text-foreground',
            ghost: 'bg-transparent hover:bg-muted text-foreground',
            gradient: 'gradient-blue text-white hover:opacity-90 shadow-lg glow-blue',
        };

        const sizes = {
            sm: 'h-8 px-3 text-xs',
            md: 'h-10 px-4 py-2',
            lg: 'h-12 px-8 text-lg',
            icon: 'h-10 w-10 p-0 flex items-center justify-center',
        };

        return (
            <button
                className={cn(
                    'inline-flex items-center justify-center rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-95',
                    variants[variant],
                    sizes[size],
                    className
                )}
                ref={ref}
                {...props}
            />
        );
    }
);
Button.displayName = 'Button';

export { Button };
