'use client';

import * as React from 'react';
import { ProjectDraft } from '@/types';
import { Button } from '../ui/Button';
import { Info, Lightbulb, FileText, Sparkles, ChevronLeft, LayoutGrid, Calendar } from 'lucide-react';

interface Step2PRDFormProps {
    draft: ProjectDraft;
    onUpdate: (updates: Partial<ProjectDraft>) => void;
    onNext: () => void;
    onBack: () => void;
}

export function Step2PRDForm({ draft, onUpdate, onNext, onBack }: Step2PRDFormProps) {
    const prdTemplate = `### Goals\n- List key objectives...\n\n### Scope\n- What's included...\n\n### Deliverables\n- List tangible outcomes...\n\n### Exclusions\n- What's NOT included...\n\n### Acceptance Criteria\n- How is success measured...`;

    // Default update mode
    const [updateMode, setUpdateMode] = React.useState<'milestone' | 'weekly'>(
        (draft as any).updateMode || 'milestone'
    );
    const [inclusionsText, setInclusionsText] = React.useState((draft.scopeInclusions || []).join('\n'));
    const [exclusionsText, setExclusionsText] = React.useState((draft.scopeExclusions || []).join('\n'));

    React.useEffect(() => {
        if (!draft.prdContent) {
            onUpdate({ prdContent: prdTemplate });
        }
    }, [draft.prdContent, onUpdate]);

    React.useEffect(() => {
        setInclusionsText((draft.scopeInclusions || []).join('\n'));
    }, [draft.scopeInclusions]);

    React.useEffect(() => {
        setExclusionsText((draft.scopeExclusions || []).join('\n'));
    }, [draft.scopeExclusions]);

    const handleModeChange = (mode: 'milestone' | 'weekly') => {
        setUpdateMode(mode);
        onUpdate({ updateMode: mode } as any);
    };

    const normalizeLines = (value: string) =>
        value
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
            <div className="lg:col-span-3 space-y-8">
                <div className="space-y-4">
                    <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
                        <FileText className="text-primary" size={20} />
                        Project PRD Content
                    </h3>
                    <p className="text-sm text-muted-foreground">Define the scope, goals, and boundaries of your project. This will be used to generate the timeline and tasks.</p>
                    <textarea
                        className="w-full h-80 bg-card p-6 rounded-[2rem] border border-white/5 text-sm font-medium leading-relaxed focus:ring-1 focus:ring-primary focus:outline-none transition-all shadow-inner"
                        placeholder="Write your PRD here..."
                        value={draft.prdContent || ''}
                        onChange={(e) => onUpdate({ prdContent: e.target.value })}
                    />
                </div>

                <div className="space-y-4">
                    <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
                        <Sparkles className="text-primary" size={20} />
                        Freelancer Work Style / Roadmap Context
                    </h3>
                    <p className="text-sm text-muted-foreground">Optional: Add context about your working style or specific constraints to guide the AI timeline generator.</p>
                    <textarea
                        className="w-full h-32 bg-card p-6 rounded-[2rem] border border-white/5 text-sm font-medium leading-relaxed focus:ring-1 focus:ring-primary focus:outline-none transition-all shadow-inner"
                        placeholder="e.g. I prefer front-loading the research phase. I work only on weekdays..."
                        value={draft.styleContext || ''}
                        onChange={(e) => onUpdate({ styleContext: e.target.value })}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
                            <Info className="text-primary" size={20} />
                            Inclusions
                        </h3>
                        <p className="text-sm text-muted-foreground">Add one included scope item per line. These will be saved into the scope matrix.</p>
                        <textarea
                            className="w-full h-40 bg-card p-6 rounded-[2rem] border border-white/5 text-sm font-medium leading-relaxed focus:ring-1 focus:ring-primary focus:outline-none transition-all shadow-inner"
                            placeholder={`UI design\nResponsive development\nBasic QA`}
                            value={inclusionsText}
                            onChange={(e) => {
                                const value = e.target.value;
                                setInclusionsText(value);
                                onUpdate({ scopeInclusions: normalizeLines(value) });
                            }}
                        />
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
                            <Info className="text-primary" size={20} />
                            Exclusions
                        </h3>
                        <p className="text-sm text-muted-foreground">Add one excluded scope item per line. These will also appear in the scope matrix.</p>
                        <textarea
                            className="w-full h-40 bg-card p-6 rounded-[2rem] border border-white/5 text-sm font-medium leading-relaxed focus:ring-1 focus:ring-primary focus:outline-none transition-all shadow-inner"
                            placeholder={`Custom illustrations\nCopywriting\nPaid ad setup`}
                            value={exclusionsText}
                            onChange={(e) => {
                                const value = e.target.value;
                                setExclusionsText(value);
                                onUpdate({ scopeExclusions: normalizeLines(value) });
                            }}
                        />
                    </div>
                </div>

                {/* Update Mode Radio */}
                <div className="space-y-4">
                    <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
                        <LayoutGrid className="text-primary" size={20} />
                        Update Frequency
                    </h3>
                    <p className="text-sm text-muted-foreground">Choose how you want your timeline structured. This affects how the AI groups your deliverables and tasks.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                            type="button"
                            onClick={() => handleModeChange('milestone')}
                            className={`p-5 rounded-2xl border text-left transition-all ${updateMode === 'milestone'
                                    ? 'border-primary/50 bg-primary/5 shadow-lg shadow-primary/5'
                                    : 'border-white/5 bg-white/5 hover:bg-white/10'
                                }`}
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${updateMode === 'milestone' ? 'bg-primary/20 text-primary' : 'bg-white/10 text-muted-foreground'
                                    }`}>
                                    <LayoutGrid size={16} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold">Milestone-based</p>
                                    <p className="text-[10px] text-muted-foreground font-medium">Group by project phases</p>
                                </div>
                                <div className={`ml-auto w-4 h-4 rounded-full border-2 flex items-center justify-center ${updateMode === 'milestone' ? 'border-primary' : 'border-white/20'
                                    }`}>
                                    {updateMode === 'milestone' && <div className="w-2 h-2 rounded-full bg-primary" />}
                                </div>
                            </div>
                            <p className="text-[10px] text-muted-foreground">Best for projects with clear phases: Design → Development → Testing → Launch</p>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleModeChange('weekly')}
                            className={`p-5 rounded-2xl border text-left transition-all ${updateMode === 'weekly'
                                    ? 'border-primary/50 bg-primary/5 shadow-lg shadow-primary/5'
                                    : 'border-white/5 bg-white/5 hover:bg-white/10'
                                }`}
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${updateMode === 'weekly' ? 'bg-primary/20 text-primary' : 'bg-white/10 text-muted-foreground'
                                    }`}>
                                    <Calendar size={16} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold">Weekly-based</p>
                                    <p className="text-[10px] text-muted-foreground font-medium">Group by calendar weeks</p>
                                </div>
                                <div className={`ml-auto w-4 h-4 rounded-full border-2 flex items-center justify-center ${updateMode === 'weekly' ? 'border-primary' : 'border-white/20'
                                    }`}>
                                    {updateMode === 'weekly' && <div className="w-2 h-2 rounded-full bg-primary" />}
                                </div>
                            </div>
                            <p className="text-[10px] text-muted-foreground">Best for ongoing or time-boxed work: Week 1 → Week 2 → Week 3...</p>
                        </button>
                    </div>
                </div>

                <div className="pt-8 border-t border-white/5 flex gap-4">
                    <Button
                        variant="ghost"
                        className="flex-1 rounded-2xl h-14 font-bold text-muted-foreground hover:text-foreground"
                        onClick={onBack}
                    >
                        <ChevronLeft size={18} className="mr-2" /> Back
                    </Button>
                    <Button
                        variant="gradient"
                        className="flex-[3] rounded-2xl h-14 font-black uppercase tracking-widest shadow-xl glow-blue"
                        onClick={onNext}
                    >
                        Continue to Timeline
                    </Button>
                </div>
            </div>

            <aside className="space-y-6">
                <div className="p-6 rounded-3xl bg-primary/5 border border-primary/10 space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                        <Lightbulb size={14} />
                        Pro Tips
                    </h4>
                    <ul className="space-y-4 text-[11px] text-muted-foreground font-medium leading-relaxed">
                        <li className="flex gap-2">
                            <div className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
                            Be specific about **exclusions** to avoid scope creep later.
                        </li>
                        <li className="flex gap-2">
                            <div className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
                            Define clear **acceptance criteria** for Each Milestone.
                        </li>
                        <li className="flex gap-2">
                            <div className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
                            AI performs better when goals are **measurable**.
                        </li>
                    </ul>
                </div>

                <div className="p-6 rounded-3xl bg-card border border-white/5 space-y-4 shadow-xl">
                    <h4 className="text-xs font-black uppercase tracking-widest text-foreground">Sample Blocks</h4>
                    <div className="space-y-2">
                        {['Goals & Vision', 'Technical Scope', 'Timeline Constraints', 'Specific Tools'].map((chip) => (
                            <button key={chip} className="w-full text-left px-3 py-2 rounded-xl bg-white/5 border border-white/5 text-[10px] font-bold hover:bg-white/10 transition-colors">
                                + Add {chip}
                            </button>
                        ))}
                    </div>
                </div>
            </aside>
        </div>
    );
}
