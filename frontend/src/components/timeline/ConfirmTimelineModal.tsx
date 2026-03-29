'use client';

import * as React from 'react';
import { Button } from '../ui/Button';
import { CheckCircle2, X, Calendar, Loader2 } from 'lucide-react';

interface ConfirmTimelineModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isConfirming: boolean;
    bucketCount: number;
    taskCount: number;
}

export function ConfirmTimelineModal({
    isOpen,
    onClose,
    onConfirm,
    isConfirming,
    bucketCount,
    taskCount,
}: ConfirmTimelineModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-card border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 fade-in duration-300">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
                >
                    <X size={18} />
                </button>

                <div className="text-center space-y-6">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                        <CheckCircle2 className="text-primary" size={32} />
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-xl font-black uppercase tracking-tighter">Confirm Timeline</h3>
                        <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                            Once confirmed, this timeline will be saved and tasks will be scheduled for calendar sync.
                        </p>
                    </div>

                    <div className="flex items-center justify-center gap-6 p-4 bg-white/5 rounded-2xl">
                        <div className="text-center">
                            <p className="text-2xl font-black text-primary">{bucketCount}</p>
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Buckets</p>
                        </div>
                        <div className="w-px h-10 bg-white/10" />
                        <div className="text-center">
                            <p className="text-2xl font-black text-primary">{taskCount}</p>
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Tasks</p>
                        </div>
                        <div className="w-px h-10 bg-white/10" />
                        <div className="text-center">
                            <Calendar size={20} className="text-primary mx-auto" />
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mt-1">Calendar</p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            variant="ghost"
                            className="flex-1 h-12 rounded-xl font-bold"
                            onClick={onClose}
                            disabled={isConfirming}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="gradient"
                            className="flex-[2] h-12 rounded-xl font-black uppercase tracking-widest shadow-xl glow-blue"
                            onClick={onConfirm}
                            disabled={isConfirming}
                        >
                            {isConfirming ? (
                                <><Loader2 className="mr-2 animate-spin" size={16} /> Saving...</>
                            ) : (
                                <><CheckCircle2 className="mr-2" size={16} /> Confirm & Save</>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
