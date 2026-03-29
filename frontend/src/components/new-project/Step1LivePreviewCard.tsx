'use client';

import * as React from 'react';
import { ProjectDraft } from '@/types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Calendar, User, IndianRupee, Clock, Zap } from 'lucide-react';
import { formatDate } from '@/lib/format';

export function Step1LivePreviewCard({ draft, duration }: { draft: ProjectDraft; duration: string | null }) {
    return (
        <Card className="p-8 border-white/10 bg-card/60 glass-panel shadow-2xl space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Live Preview</p>
                <h3 className="text-xl font-black truncate">{draft.projectTitle || 'Project Title'}</h3>
            </div>

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-primary">
                        <User size={18} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Client</p>
                        <p className="text-sm font-bold truncate max-w-[150px]">{draft.client?.businessName || draft.clientName || '---'}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-primary">
                        <Calendar size={18} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Timeline</p>
                        <p className="text-sm font-bold">
                            {draft.projectStartDate ? formatDate(draft.projectStartDate) : 'Start'}
                            <span className="mx-2 text-muted-foreground">→</span>
                            {draft.projectDeadline ? formatDate(draft.projectDeadline) : 'End'}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-3xl bg-white/5 border border-white/5">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Cost</p>
                        <p className="text-lg font-black text-primary">₹{(draft.projectCost || 0).toLocaleString()}</p>
                    </div>
                    <div className="p-4 rounded-3xl bg-white/5 border border-white/5">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Duration</p>
                        <p className="text-lg font-black text-foreground">{duration || '---'}</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                    {draft.recurringMaintenance !== 'No' && draft.recurringMaintenance && (
                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border-none px-3 py-1 font-black text-[9px] uppercase tracking-widest">
                            {draft.recurringMaintenance} RECURRING
                        </Badge>
                    )}
                    <Badge variant="outline" className="border-white/10 px-3 py-1 font-black text-[9px] uppercase tracking-widest">
                        {draft.revisions || 0} REVISIONS
                    </Badge>
                    <Badge variant="outline" className="border-white/10 px-3 py-1 font-black text-[9px] uppercase tracking-widest">
                        {draft.bufferDays || 0}D BUFFER
                    </Badge>
                </div>
            </div>

            <div className="pt-6 border-t border-white/5">
                <div className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground italic">
                    <Clock size={12} />
                    Draft saved automatically
                </div>
            </div>
        </Card>
    );
}
