

import * as React from 'react';
import { StepIndicator } from './StepIndicator';
import { Step1DetailsForm } from './Step1DetailsForm';
import { Step2PRDForm } from './Step2PRDForm';
import { Step3TimelineUI } from './Step3TimelineUI';
import { getProjectDraft, saveProjectDraft, clearProjectDraft } from '@/lib/projectDraft';
import { ProjectDraft } from '@/types';
import { useAppNavigate } from '@/lib/navigation';

export function NewProjectWizard({
    currentStep,
    existingProjectId,
}: {
    currentStep: number;
    existingProjectId?: string;
}) {
    const router = useAppNavigate();
    const [draft, setDraft] = React.useState<ProjectDraft>({ step: 1 });
    const [isLoaded, setIsLoaded] = React.useState(false);

    React.useEffect(() => {
        const savedDraft = getProjectDraft();
        const nextDraft = savedDraft || { step: 1 };
        const hydratedDraft = {
            ...nextDraft,
            step: currentStep,
            ...(existingProjectId ? { id: existingProjectId } : {}),
        } satisfies ProjectDraft;

        setDraft(hydratedDraft);
        saveProjectDraft(hydratedDraft);
        setIsLoaded(true);
    }, [currentStep, existingProjectId]);

    const handleUpdateDraft = (updates: Partial<ProjectDraft>) => {
        setDraft((current) => {
            const updated = { ...current, ...updates };
            saveProjectDraft(updated);
            return updated;
        });
    };

    const handleNext = async (nextStep: number) => {
        handleUpdateDraft({ step: nextStep });
        router.navigate({ to: `/projects/new?step=${nextStep}` });
    };

    const handleBack = (prevStep: number) => {
        handleUpdateDraft({ step: prevStep });
        router.navigate({ to: `/projects/new?step=${prevStep}` });
    };

    const handleFinish = (projectId: string) => {
        clearProjectDraft();
        router.navigate({ to: `/projects/${projectId}?tab=timeline` });
    };

    if (!isLoaded) return null;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2 text-center md:text-left">
                <h1 className="text-3xl font-black tracking-tighter uppercase">Create New Project</h1>
                <p className="text-muted-foreground">Follow the steps to set up your project workspace.</p>
            </div>

            <StepIndicator currentStep={currentStep} />

            <div className="bg-card/40 border border-white/5 rounded-[2rem] p-6 md:p-10 glass-panel min-h-[500px]">
                {currentStep === 1 && (
                    <Step1DetailsForm
                        draft={draft}
                        onUpdate={handleUpdateDraft}
                        onNext={() => handleNext(2)}
                    />
                )}
                {currentStep === 2 && (
                    <Step2PRDForm
                        draft={draft}
                        onUpdate={handleUpdateDraft}
                        onNext={() => handleNext(3)}
                        onBack={() => handleBack(1)}
                    />
                )}
                {currentStep === 3 && (
                    <Step3TimelineUI
                        draft={draft}
                        onUpdate={handleUpdateDraft}
                        onFinish={handleFinish}
                        onBack={() => handleBack(2)}
                    />
                )}
            </div>
        </div>
    );
}
