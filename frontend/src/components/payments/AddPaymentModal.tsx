'use client';

import * as React from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Project } from '@/types';
import { getProjects } from '@/lib/data';
import { Send, Save } from 'lucide-react';
import { createPaymentRequest } from '@/lib/api/paymentsApi';

interface AddPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId?: string;
    projectLabel?: string;
    onSuccess?: () => Promise<void> | void;
}

export function AddPaymentModal({
    isOpen,
    onClose,
    projectId,
    projectLabel,
    onSuccess,
}: AddPaymentModalProps) {
    const [projects, setProjects] = React.useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = React.useState(projectId || '');
    const [amount, setAmount] = React.useState('');
    const [type, setType] = React.useState('milestone');
    const [dueDate, setDueDate] = React.useState('');
    const [note, setNote] = React.useState('');
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    React.useEffect(() => {
        setSelectedProjectId(projectId || '');
    }, [projectId, isOpen]);

    React.useEffect(() => {
        if (projectId) {
            return;
        }

        async function fetchProjects() {
            const data = await getProjects();
            setProjects(data);
        }

        fetchProjects();
    }, [projectId]);

    const resetForm = () => {
        setSelectedProjectId(projectId || '');
        setAmount('');
        setType('milestone');
        setDueDate('');
        setNote('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await createPaymentRequest({
                projectId: selectedProjectId,
                type: type as 'upfront' | 'milestone' | 'monthly' | 'weekly' | 'one-time' | 'custom',
                amount: Number(amount),
                dueDate,
                note,
                channel: 'whatsapp',
            });
            await onSuccess?.();
            resetForm();
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog isOpen={isOpen} onClose={onClose} title="Request Payment">
            <form onSubmit={handleSubmit} className="space-y-6">
                {projectId ? (
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Project</label>
                        <div className="w-full h-11 rounded-xl bg-card border border-white/10 px-4 text-sm font-medium flex items-center">
                            {projectLabel || 'Selected project'}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Select Project</label>
                        <select
                            className="w-full h-11 rounded-xl bg-card border border-white/10 px-4 text-sm font-medium focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                            value={selectedProjectId}
                            onChange={(e) => setSelectedProjectId(e.target.value)}
                            required
                        >
                            <option value="" disabled>Choose a project...</option>
                            {projects.map((project) => (
                                <option key={project.id} value={project.id}>{project.client.name} - {project.projectTitle}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Payment Type</label>
                        <select
                            className="w-full h-11 rounded-xl bg-card border border-white/10 px-4 text-sm font-medium focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                        >
                            <option value="upfront">Upfront</option>
                            <option value="milestone">Milestone</option>
                            <option value="monthly">Monthly</option>
                            <option value="weekly">Weekly</option>
                            <option value="one-time">One-time</option>
                            <option value="custom">Custom</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Amount (INR)</label>
                        <Input
                            type="number"
                            placeholder="e.g. 25000"
                            className="h-11 border-white/10"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Due Date</label>
                    <Input
                        type="date"
                        className="h-11 border-white/10"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Note for Client</label>
                    <textarea
                        className="w-full rounded-xl bg-card border border-white/10 p-4 text-sm font-medium focus:ring-2 focus:ring-primary focus:outline-none transition-all min-h-[100px]"
                        placeholder="Add a message about this payment..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-3 pt-2">
                    <Button type="button" variant="outline" className="flex-1 h-11 rounded-xl font-bold border-white/10" onClick={onClose} disabled={isSubmitting}>
                        <Save size={18} className="mr-2 opacity-50" /> Cancel
                    </Button>
                    <Button type="submit" variant="gradient" className="flex-[2] h-11 rounded-xl font-bold shadow-xl" disabled={isSubmitting}>
                        <Send size={18} className="mr-2" /> {isSubmitting ? 'Sending...' : 'Send to client (WhatsApp)'}
                    </Button>
                </div>
            </form>
        </Dialog>
    );
}
