'use client';

import * as React from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { TodayTask } from '@/types';

export function ActionDetailModal({
    isOpen,
    onClose,
    task
}: {
    isOpen: boolean;
    onClose: () => void;
    task: TodayTask | null;
}) {
    if (!task) return null;

    return (
        <Dialog isOpen={isOpen} onClose={onClose} title={task.title}>
            <div className="space-y-4">
                {task.type === 'invoice' && (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">WhatsApp Reminder Template Preview:</p>
                        <textarea
                            readOnly
                            className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-sm font-mono"
                            value={`Hi! Just a friendly reminder about the invoice ${task.context}. Hope everything is going well! Let me know if you need anything else.`}
                        />
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={onClose}>Cancel</Button>
                            <Button variant="gradient">Send Now</Button>
                        </div>
                    </div>
                )}

                {task.type === 'update' && (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">Scheduled Update Content:</p>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                            <p className="text-sm font-bold text-primary mb-1">Scheduled for 6:00 PM</p>
                            <p className="text-sm">Today's Progress: Finished landing page wireframes and started QA for the auth module.</p>
                        </div>
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={onClose}>Edit Message</Button>
                            <Button variant="gradient">Post Successfully</Button>
                        </div>
                    </div>
                )}

                {(task.type === 'deliverable' || task.type === 'approval') && (
                    <div className="space-y-4 text-center py-4">
                        <p className="text-muted-foreground">Redirecting to project dashboard for high-resolution review...</p>
                        <Button variant="gradient" onClick={onClose}>Continue to Project</Button>
                    </div>
                )}
            </div>
        </Dialog>
    );
}
