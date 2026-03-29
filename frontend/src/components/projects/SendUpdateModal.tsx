'use client';

import * as React from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Project } from '@/types';
import { Send, Copy, Check, Loader2 } from 'lucide-react';

export function SendUpdateModal({
    isOpen,
    onClose,
    project,
    onSubmit,
}: {
    isOpen: boolean;
    onClose: () => void;
    project: Project | null;
    onSubmit?: (payload: { type: 'weekly' | 'deliverable' | 'buffer' | 'approval'; summary: string; channel: 'WhatsApp' | 'Email' }) => Promise<void>;
}) {
    const [copied, setCopied] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    if (!project) return null;

    const prompt = `Send the status of the project "${project.projectTitle}" in a professional way. Include the current milestone (${project.nextMilestoneName}), current progress (${project.progressPercent}%), any blockers or buffer if needed, and the next immediate action expected from the client.`;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(prompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSend = async () => {
        if (!onSubmit) {
            onClose();
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit({ type: 'weekly', summary: prompt, channel: 'Email' });
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog isOpen={isOpen} onClose={onClose} title="Prompt a Mail Update">
            <div className="space-y-6">
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5">
                    <div className="w-10 h-10 rounded-full gradient-blue flex items-center justify-center font-bold">
                        {project.client.name[0]}
                    </div>
                    <div>
                        <p className="text-sm font-bold">{project.client.name}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{project.client.businessName}</p>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Mail Prompt</span>
                        <button onClick={copyToClipboard} className="text-primary hover:underline text-[10px] font-bold flex items-center gap-1">
                            {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy Text</>}
                        </button>
                    </div>
                    <div className="w-full h-32 bg-card p-4 rounded-2xl border border-white/5 text-sm font-medium leading-relaxed overflow-y-auto">
                        {prompt}
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <Button
                        variant="gradient"
                        className="w-full rounded-xl font-bold gap-2 py-6"
                        onClick={handleSend}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        {isSubmitting ? 'Saving...' : 'Send as Email'}
                    </Button>
                </div>

                <p className="text-[10px] text-center text-muted-foreground">
                    Note: this prompt asks for the project status to be sent in a professional way.
                </p>
            </div>
        </Dialog>
    );
}
