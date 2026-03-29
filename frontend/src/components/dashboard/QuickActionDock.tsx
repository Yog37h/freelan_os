'use client';

import * as React from 'react';
import {
    Plus,
    Send,
    FileText,
    Sparkles,
    Zap
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { motion, AnimatePresence } from 'framer-motion';

const actions = [
    { icon: Plus, label: 'New Project', color: 'bg-primary' },
    { icon: Send, label: 'Send Update', color: 'bg-cyan-500' },
    { icon: FileText, label: 'Create Agreement', color: 'bg-emerald-500' },
    { icon: Sparkles, label: 'Generate Wrapped', color: 'bg-indigo-500' },
];

export function QuickActionDock() {
    const [isOpen, setIsOpen] = React.useState(false);

    return (
        <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end gap-3 group">
            <AnimatePresence>
                {isOpen && (
                    <div className="flex flex-col-reverse items-end gap-2 mb-2">
                        {actions.map((action, i) => (
                            <motion.button
                                key={action.label}
                                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                transition={{ delay: i * 0.05 }}
                                className="flex items-center gap-3 p-2 group/item"
                            >
                                <span className="bg-card glass-panel border border-white/10 px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-xl opacity-0 group-hover/item:opacity-100 transition-opacity">
                                    {action.label}
                                </span>
                                <div className={cn(
                                    "w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-black/20 hover:scale-110 transition-transform",
                                    action.color
                                )}>
                                    <action.icon size={20} />
                                </div>
                            </motion.button>
                        ))}
                    </div>
                )}
            </AnimatePresence>

            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-16 h-16 gradient-blue rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-primary/20 transition-all duration-300",
                    isOpen ? "rotate-45" : "hover:scale-110"
                )}
            >
                <Plus size={32} />
            </button>

            {/* Overlay toggle logic: usually handled by a wrapper, but kept simple here */}
        </div>
    );
}
