'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';
import { Check } from 'lucide-react';

export function StepIndicator({ currentStep }: { currentStep: number }) {
    const steps = [
        { label: 'Details', number: 1 },
        { label: 'Content (PRD)', number: 2 },
        { label: 'AI Timeline', number: 3 },
    ];

    return (
        <div className="relative flex justify-between items-center max-w-2xl mx-auto px-4">
            {/* Background Line */}
            <div className="absolute left-8 right-8 top-1/2 h-0.5 bg-white/5 -translate-y-1/2 -z-10" />

            {/* Active Progress Line */}
            <div
                className="absolute left-8 top-1/2 h-0.5 gradient-blue -translate-y-1/2 -z-10 transition-all duration-500 ease-out shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`, maxWidth: 'calc(100% - 4rem)' }}
            />

            {steps.map((step) => {
                const isCompleted = currentStep > step.number;
                const isActive = currentStep === step.number;

                return (
                    <div key={step.number} className="flex flex-col items-center gap-3">
                        <div
                            className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 border-2",
                                isCompleted
                                    ? "bg-primary border-primary text-white"
                                    : isActive
                                        ? "bg-background border-primary text-primary shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                                        : "bg-background border-white/10 text-muted-foreground"
                            )}
                        >
                            {isCompleted ? <Check size={18} /> : step.number}
                        </div>
                        <span className={cn(
                            "text-[10px] font-black uppercase tracking-widest transition-colors",
                            isActive ? "text-primary" : "text-muted-foreground"
                        )}>
                            {step.label}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
