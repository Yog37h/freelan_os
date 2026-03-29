// ✅ VERIFIED: New project generation no longer depends on Google connection and continues through the normal create-and-plan flow. Manual test: create a project with no Google setup and confirm timeline generation still proceeds.
'use client';

import * as React from 'react';
import axios from 'axios';
import { ProjectDraft } from '@/types';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { TimelineBucketList } from '../timeline/TimelineBucketList';
import { ConfirmTimelineModal } from '../timeline/ConfirmTimelineModal';
import { generatePlanClientSide, confirmPlan } from '@/lib/api/planApi';
import { BucketData } from '../timeline/BucketCard';
import {
    Zap, ChevronLeft, Calendar, User, IndianRupee, LayoutGrid,
    CheckCircle2, AlertCircle, Loader2, RefreshCw
} from 'lucide-react';
import { formatDate } from '@/lib/format';
import { createProject } from '@/lib/api/projectsApi';

interface Step3TimelineUIProps {
    draft: ProjectDraft;
    onUpdate: (updates: Partial<ProjectDraft>) => void;
    onFinish: (projectId: string) => void;
    onBack: () => void;
}

export function Step3TimelineUI({ draft, onUpdate, onFinish, onBack }: Step3TimelineUIProps) {
    const [isGenerating, setIsGenerating] = React.useState(false);
    const [hasGenerated, setHasGenerated] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [planId, setPlanId] = React.useState<string | null>(null);
    const [previewData, setPreviewData] = React.useState<any>(null);
    const [editedBuckets, setEditedBuckets] = React.useState<BucketData[]>([]);
    const [showConfirmModal, setShowConfirmModal] = React.useState(false);
    const [isConfirming, setIsConfirming] = React.useState(false);
    const [showWhatsAppModal, setShowWhatsAppModal] = React.useState(false);
    const [whatsappStatus, setWhatsappStatus] = React.useState<{ triggered: boolean; reason?: string } | null>(null);
    const [confirmedProjectId, setConfirmedProjectId] = React.useState<string | null>(null);

    const updateMode = ((draft as any).updateMode as 'milestone' | 'weekly') || 'milestone';
    const projectId = draft.id || (draft as any).projectId as string | undefined;

    const getErrorMessage = (err: unknown, fallback: string): string => {
        if (axios.isAxiosError(err)) {
            const apiError = err.response?.data?.error;
            if (apiError && typeof apiError === 'object' && 'message' in apiError) {
                return String((apiError as { message: string }).message);
            }
            if (typeof apiError === 'string') return apiError;
            return err.response?.data?.message || err.message || fallback;
        }

        return err instanceof Error ? err.message : fallback;
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        setError(null);

        let currentProjectId = projectId;

        try {
            if (!currentProjectId) {
                const newProject = await createProject({
                    client: {
                        name: draft.clientName || draft.client?.name || 'Unknown Client',
                        businessName: draft.client?.businessName || '',
                        email: draft.client?.email || '',
                        whatsapp: draft.client?.whatsapp || '',
                    },
                    title: draft.projectTitle || 'Untitled Project',
                    description: draft.projectDescription || '',
                    startDate: draft.projectStartDate || new Date().toISOString().split('T')[0],
                    deadline: draft.projectDeadline || new Date().toISOString().split('T')[0],
                    type: draft.projectType || 'Fixed',
                    cost: Number(draft.projectCost) || 0,
                    currency: draft.currency || 'INR',
                    paymentTerms: draft.paymentTerms || 'Milestones',
                    revisions: Number(draft.revisions) || 0,
                    bufferDays: Number(draft.bufferDays) || 0,
                    recurringMaintenance: draft.recurringMaintenance || 'No',
                    prdContent: draft.prdContent || '',
                    styleContext: draft.styleContext || '',
                    scopeInclusions: draft.scopeInclusions || [],
                    scopeExclusions: draft.scopeExclusions || [],
                });

                currentProjectId = newProject.id;
                onUpdate({ id: currentProjectId } as any);
            }

            const result = await generatePlanClientSide({
                projectId: currentProjectId!,
                projectTitle: draft.projectTitle || 'Untitled Project',
                projectDescription: draft.projectDescription || '',
                prdContent: draft.prdContent || '',
                freelancerContext: draft.styleContext || '',
                startDate: draft.projectStartDate || new Date().toISOString().split('T')[0],
                deadline: draft.projectDeadline || new Date().toISOString().split('T')[0],
                bufferDays: Number(draft.bufferDays) || 0,
                revisions: Number(draft.revisions) || 0,
                cost: Number(draft.projectCost) || 0,
                currency: draft.currency || 'INR',
                updateMode: updateMode,
            });

            setPlanId(result.plan_id);
            setPreviewData(result.preview);

            const buckets: BucketData[] = result.preview.mode === 'milestone'
                ? result.preview.milestones
                : result.preview.weeks;
            setEditedBuckets(buckets);
            setHasGenerated(true);
        } catch (err) {
            setError(getErrorMessage(err, 'Failed to generate timeline'));
        } finally {
            setIsGenerating(false);
        }
    };

    const handleBucketsChange = (buckets: BucketData[]) => {
        setEditedBuckets(buckets);
    };

    const handleConfirm = async () => {
        if (!planId || !projectId || !previewData) return;

        setIsConfirming(true);
        try {
            const editedPreview = { ...previewData };
            if (editedPreview.mode === 'milestone') {
                editedPreview.milestones = editedBuckets;
            } else {
                editedPreview.weeks = editedBuckets;
            }

            const result = await confirmPlan(projectId, {
                plan_id: planId,
                edited_preview_json: editedPreview,
            });

            setShowConfirmModal(false);

            if (result?.whatsapp) {
                setWhatsappStatus(result.whatsapp);
                setConfirmedProjectId(projectId);
                setShowWhatsAppModal(true);
            } else {
                onFinish(projectId);
            }
        } catch (err) {
            setError(getErrorMessage(err, 'Failed to confirm timeline'));
        } finally {
            setIsConfirming(false);
        }
    };

    const totalTasks = editedBuckets.reduce((sum, b) => sum + (b.tasks?.length || 0), 0);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="space-y-8">
                <div className="space-y-6">
                    <h3 className="text-xl font-black uppercase tracking-tighter">Project Summary</h3>

                    <div className="space-y-4 p-6 rounded-3xl bg-white/5 border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <User size={16} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">Client</p>
                                <p className="text-sm font-bold truncate">{draft.client?.businessName || draft.clientName || '---'}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <Calendar size={16} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">Timeline</p>
                                <p className="text-sm font-bold truncate">
                                    {draft.projectStartDate ? formatDate(draft.projectStartDate) : '---'} {'->'} {draft.projectDeadline ? formatDate(draft.projectDeadline) : '---'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <IndianRupee size={16} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">Budget</p>
                                <p className="text-sm font-bold truncate">₹{(draft.projectCost || 0).toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <LayoutGrid size={16} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">Mode</p>
                                <p className="text-sm font-bold truncate capitalize">{updateMode}</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Button
                            variant="gradient"
                            className="w-full h-14 rounded-2xl font-black uppercase tracking-widest shadow-xl glow-blue"
                            onClick={handleGenerate}
                            disabled={isGenerating || hasGenerated}
                        >
                            {isGenerating ? (
                                <><Loader2 className="mr-2 animate-spin" size={18} /> Generating...</>
                            ) : hasGenerated ? (
                                <><CheckCircle2 className="mr-2" size={18} /> Timeline Ready</>
                            ) : (
                                <><Zap className="mr-2" size={18} /> Generate AI Timeline</>
                            )}
                        </Button>

                        {hasGenerated && (
                            <Button
                                variant="ghost"
                                className="w-full h-10 rounded-xl font-bold text-xs text-muted-foreground"
                                onClick={() => { setHasGenerated(false); setPlanId(null); setPreviewData(null); setEditedBuckets([]); }}
                            >
                                <RefreshCw size={14} className="mr-2" /> Regenerate
                            </Button>
                        )}

                        <p className="text-[10px] text-center text-muted-foreground italic">
                            Timeline will be generated from your PRD + style context using AI.
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3 animate-in slide-in-from-left-4 duration-300">
                        <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-xs font-bold text-rose-500">Generation Error</p>
                            <p className="text-[10px] text-rose-500/80 mt-1">{error}</p>
                        </div>
                    </div>
                )}

                <div className="flex gap-4">
                    <Button
                        variant="ghost"
                        className="flex-1 rounded-2xl h-14 font-bold text-muted-foreground hover:text-foreground border border-white/5"
                        onClick={onBack}
                    >
                        <ChevronLeft size={18} className="mr-2" /> Back
                    </Button>
                    <Button
                        variant="gradient"
                        className="flex-[2] rounded-2xl h-14 font-black uppercase tracking-widest shadow-xl glow-blue"
                        onClick={() => setShowConfirmModal(true)}
                        disabled={!hasGenerated || editedBuckets.length === 0}
                    >
                        Confirm Timeline
                    </Button>
                </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black uppercase tracking-tighter">Timeline Preview</h3>
                    {hasGenerated && (
                        <Badge variant="success" className="bg-emerald-500/10 text-emerald-500 border-none px-3 font-black text-[9px] uppercase tracking-widest">
                            AI GENERATED
                        </Badge>
                    )}
                </div>

                <div className="min-h-[400px] border border-white/5 bg-white/5 rounded-[2rem] p-6">
                    {!hasGenerated && !isGenerating ? (
                        <div className="flex flex-col items-center justify-center h-full min-h-[350px] text-center">
                            <div className="max-w-xs space-y-4 animate-in fade-in zoom-in-95 duration-700">
                                <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-muted-foreground/30">
                                    <LayoutGrid size={32} />
                                </div>
                                <div className="space-y-2">
                                    <h4 className="font-bold text-foreground">No Timeline Yet</h4>
                                    <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                                        Refine your PRD and click "Generate AI Timeline" to create a detailed project roadmap.
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : isGenerating ? (
                        <div className="space-y-6 py-8">
                            <div className="text-center space-y-3">
                                <Loader2 size={32} className="animate-spin text-primary mx-auto" />
                                <p className="text-sm font-bold">AI is analyzing your project...</p>
                                <p className="text-[10px] text-muted-foreground">This usually takes 10-30 seconds</p>
                            </div>
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="flex gap-4 animate-pulse">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 shrink-0" />
                                    <div className="flex-1 space-y-3 pt-2">
                                        <div className="h-4 w-1/3 bg-white/5 rounded" />
                                        <div className="h-2 w-full bg-white/5 rounded" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-right-10 duration-700">
                            <TimelineBucketList
                                buckets={editedBuckets}
                                mode={updateMode}
                                editable={true}
                                onBucketsChange={handleBucketsChange}
                            />
                        </div>
                    )}
                </div>
            </div>

            <ConfirmTimelineModal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={handleConfirm}
                isConfirming={isConfirming}
                bucketCount={editedBuckets.length}
                taskCount={totalTasks}
            />

            {showWhatsAppModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-card border border-white/10 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
                        <div className="text-center space-y-5">
                            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                                <svg viewBox="0 0 24 24" className="w-8 h-8 text-emerald-500" fill="currentColor">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                </svg>
                            </div>

                            <div>
                                <h3 className="text-lg font-black tracking-tight">Client Onboarding Started!</h3>
                                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                                    {whatsappStatus?.triggered
                                        ? 'WhatsApp onboarding messages are being sent to your client. They will receive the project welcome flow now, and the milestone start message will wait for the timeline start and client confirmation.'
                                        : `WhatsApp onboarding was not triggered: ${whatsappStatus?.reason || 'Unknown reason'}`
                                    }
                                </p>
                            </div>

                            {whatsappStatus?.triggered && (
                                <div className="space-y-3 text-left">
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                                            <CheckCircle2 size={14} />
                                        </div>
                                        <span className="text-xs font-bold">Welcome message</span>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                                            <CheckCircle2 size={14} />
                                        </div>
                                        <span className="text-xs font-bold">Project summary</span>
                                    </div>
                                </div>
                            )}

                            <Button
                                variant="gradient"
                                className="w-full h-12 rounded-xl font-black uppercase tracking-widest shadow-xl"
                                onClick={() => {
                                    setShowWhatsAppModal(false);
                                    if (confirmedProjectId) onFinish(confirmedProjectId);
                                }}
                            >
                                Continue to Project
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
