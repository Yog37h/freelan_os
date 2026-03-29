'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';

const TabsContext = React.createContext<{
    value: string;
    onValueChange: (value: string) => void;
}>({ value: '', onValueChange: () => { } });

export function Tabs({
    defaultValue,
    value: controlledValue,
    onValueChange,
    children,
    className
}: {
    defaultValue?: string;
    value?: string;
    onValueChange?: (value: string) => void;
    children: React.ReactNode;
    className?: string;
}) {
    const [value, setValue] = React.useState(controlledValue || defaultValue || '');

    React.useEffect(() => {
        if (controlledValue !== undefined) {
            setValue(controlledValue);
        }
    }, [controlledValue]);

    const handleValueChange = (v: string) => {
        if (controlledValue === undefined) {
            setValue(v);
        }
        onValueChange?.(v);
    };

    return (
        <TabsContext.Provider value={{ value, onValueChange: handleValueChange }}>
            <div className={cn('w-full', className)}>{children}</div>
        </TabsContext.Provider>
    );
}

export function TabsList({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <div className={cn('inline-flex items-center justify-center rounded-xl bg-muted/30 p-1 text-muted-foreground', className)}>
            {children}
        </div>
    );
}

export function TabsTrigger({ value, children, className }: { value: string, children: React.ReactNode, className?: string }) {
    const { value: activeValue, onValueChange } = React.useContext(TabsContext);
    const isActive = activeValue === value;

    return (
        <button
            onClick={() => onValueChange(value)}
            className={cn(
                'inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
                isActive ? 'bg-card text-foreground shadow-sm' : 'hover:bg-muted/50 hover:text-foreground',
                className
            )}
        >
            {children}
        </button>
    );
}

export function TabsContent({ value, children, className }: { value: string, children: React.ReactNode, className?: string }) {
    const { value: activeValue } = React.useContext(TabsContext);
    if (activeValue !== value) return null;

    return (
        <div className={cn('mt-4 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2', className)}>
            {children}
        </div>
    );
}
