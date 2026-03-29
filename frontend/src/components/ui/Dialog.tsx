'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

interface DialogProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
}

export function Dialog({ isOpen, onClose, title, children }: DialogProps) {
    React.useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="glass-panel relative z-50 w-full max-w-lg rounded-2xl p-6 shadow-2xl border-white/10"
                    >
                        <div className="flex items-center justify-between mb-4">
                            {title && <h2 className="text-xl font-bold">{title}</h2>}
                            <button
                                onClick={onClose}
                                className="rounded-full p-2 hover:bg-muted text-muted-foreground transition-colors"
                                aria-label="Close"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-4">{children}</div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
