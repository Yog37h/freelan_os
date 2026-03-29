

import * as React from 'react';
import { ProjectDraft, RecurringFrequency } from '@/types';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Step1LivePreviewCard } from './Step1LivePreviewCard';
import { Calendar, IndianRupee, Clock, RefreshCcw, Info } from 'lucide-react';
import { useAppNavigate } from '@/lib/navigation';

interface Step1DetailsFormProps {
    draft: ProjectDraft;
    onUpdate: (updates: Partial<ProjectDraft>) => void;
    onNext: () => void;
}

export function Step1DetailsForm({ draft, onUpdate, onNext }: Step1DetailsFormProps) {
    const router = useAppNavigate();
    const [whatsappError, setWhatsappError] = React.useState('');

    const updateClient = (updates: Partial<NonNullable<ProjectDraft['client']>>) => {
        onUpdate({
            client: {
                ...draft.client,
                ...updates,
            } as NonNullable<ProjectDraft['client']>,
        });
    };

    const parseNumberInput = (value: string) => {
        if (!value.trim()) {
            return 0;
        }

        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    };

    const calculateDuration = () => {
        if (!draft.projectStartDate || !draft.projectDeadline) return null;
        const start = new Date(draft.projectStartDate);
        const end = new Date(draft.projectDeadline);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays >= 30) {
            const months = Math.floor(diffDays / 30);
            return `${months} ${months === 1 ? 'Month' : 'Months'}`;
        }
        if (diffDays >= 7) {
            const weeks = Math.floor(diffDays / 7);
            return `${weeks} ${weeks === 1 ? 'Week' : 'Weeks'}`;
        }
        return `${diffDays} Days`;
    };

    const handleNext = () => {
        let hasError = false;
        if (!draft.client?.whatsapp) {
            setWhatsappError('WhatsApp number is required');
            hasError = true;
        } else {
            setWhatsappError('');
        }

        if (hasError) return;
        onNext();
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-10">
                {/* Client Details */}
                <section className="space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                        <span className="w-6 h-6 flex items-center justify-center rounded-lg bg-primary/10 text-[10px]">1</span>
                        Client Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Client Name</label>
                            <Input
                                placeholder="e.g. Rahul Sharma"
                                value={draft.clientName || ''}
                                onChange={(e) => {
                                    const name = e.target.value;
                                    onUpdate({
                                        clientName: name,
                                        client: {
                                            ...draft.client,
                                            name,
                                        } as NonNullable<ProjectDraft['client']>,
                                    });
                                }}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Business Name</label>
                            <Input
                                placeholder="e.g. Acme Studio"
                                value={draft.client?.businessName || ''}
                                onChange={(e) => updateClient({ businessName: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Email</label>
                            <Input
                                type="email"
                                placeholder="client@example.com"
                                value={draft.client?.email || ''}
                                onChange={(e) => updateClient({ email: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">WhatsApp*</label>
                            <Input
                                placeholder="+91 98765-43210"
                                value={draft.client?.whatsapp || ''}
                                className={whatsappError ? "border-rose-500/50" : ""}
                                onChange={(e) => updateClient({ whatsapp: e.target.value })}
                            />
                            {whatsappError && <p className="text-[10px] text-rose-500 ml-1">{whatsappError}</p>}
                        </div>
                    </div>
                </section>

                {/* Project Details */}
                <section className="space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                        <span className="w-6 h-6 flex items-center justify-center rounded-lg bg-primary/10 text-[10px]">2</span>
                        Project Details
                    </h3>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Project Title</label>
                            <Input
                                placeholder="e.g. SaaS Branding & Web Design"
                                value={draft.projectTitle || ''}
                                onChange={(e) => onUpdate({ projectTitle: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Description</label>
                            <textarea
                                className="w-full h-24 bg-card p-4 rounded-xl border border-white/5 text-sm focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                                placeholder="Describe the project goal..."
                                value={draft.projectDescription || ''}
                                onChange={(e) => onUpdate({ projectDescription: e.target.value })}
                            />
                        </div>
                    </div>
                </section>

                {/* Timeline & Maintenance */}
                <section className="space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                        <span className="w-6 h-6 flex items-center justify-center rounded-lg bg-primary/10 text-[10px]">3</span>
                        Timeline & Buffer
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Start Date</label>
                            <div className="relative">
                                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    type="date"
                                    className="pl-10"
                                    value={draft.projectStartDate || ''}
                                    onChange={(e) => onUpdate({ projectStartDate: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Deadline Date</label>
                            <div className="relative">
                                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    type="date"
                                    className="pl-10"
                                    value={draft.projectDeadline || ''}
                                    onChange={(e) => onUpdate({ projectDeadline: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Buffer Time (Days)</label>
                            <Input
                                type="number"
                                value={draft.bufferDays || 0}
                                onChange={(e) => onUpdate({ bufferDays: parseNumberInput(e.target.value) })}
                            />
                            <p className="text-[9px] text-muted-foreground italic flex items-center gap-1">
                                <Info size={10} /> Extra days for unforeseen delays
                            </p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Recurring Project?</label>
                            <select
                                className="w-full h-11 bg-card px-4 rounded-xl border border-white/5 text-sm focus:ring-1 focus:ring-primary focus:outline-none appearance-none"
                                value={draft.recurringMaintenance || 'No'}
                                onChange={(e) => onUpdate({ recurringMaintenance: e.target.value as RecurringFrequency })}
                            >
                                <option value="No">Not Recurring</option>
                                <option value="Biweekly">Biweekly</option>
                                <option value="Monthly">Monthly</option>
                                <option value="Quarterly">Quarterly</option>
                                <option value="Ad-hoc">Ad-hoc</option>
                            </select>
                        </div>
                    </div>
                </section>

                {/* Commercials */}
                <section className="space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                        <span className="w-6 h-6 flex items-center justify-center rounded-lg bg-primary/10 text-[10px]">4</span>
                        Commercials
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Project Cost (INR)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">₹</span>
                                <Input
                                    type="number"
                                    className="pl-10"
                                    placeholder="0"
                                    value={draft.projectCost || ''}
                                    onChange={(e) => onUpdate({ projectCost: parseNumberInput(e.target.value) })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Total Revisions</label>
                            <Input
                                type="number"
                                value={draft.revisions || 0}
                                onChange={(e) => onUpdate({ revisions: parseNumberInput(e.target.value) })}
                            />
                        </div>
                    </div>
                </section>

                <div className="pt-10 border-t border-white/5 space-y-4">
                    <p className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        New project creation completes only after the Project PRD content and timeline creation
                    </p>
                    <div className="flex gap-4">
                        <Button
                            variant="outline"
                            className="flex-1 rounded-2xl h-14 font-bold border-white/10 hover:bg-white/5"
                            onClick={() => router.navigate({ to: '/projects' })}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="gradient"
                            className="flex-[2] rounded-2xl h-14 font-black uppercase tracking-widest shadow-xl glow-blue"
                            onClick={handleNext}
                        >
                            Save & Proceed
                        </Button>
                    </div>
                </div>
            </div>

            {/* Live Preview Sidebar */}
            <div className="hidden lg:block">
                <div className="sticky top-8">
                    <Step1LivePreviewCard draft={draft} duration={calculateDuration()} />
                </div>
            </div>
        </div>
    );
}
