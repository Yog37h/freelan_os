
import * as React from 'react';
import { NewProjectWizard } from '@/components/new-project/NewProjectWizard';
import { useAppNavigate } from '@/lib/navigation';
import { useSearch, useLocation } from '@tanstack/react-router';

function NewProjectContent() {
    const router = useAppNavigate();
    const location = useLocation();

    // Reactively parse search params from TanStack Router's location
    const searchParams = new URLSearchParams(location.search);
    const step = parseInt(searchParams.get('step') || '1');
    const projectId = searchParams.get('projectId') || undefined;

    React.useEffect(() => {
        if (!searchParams.get('step')) {
            router.replace('/projects/new?step=1');
        }
    }, []);

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <NewProjectWizard currentStep={step} existingProjectId={projectId} />
        </div>
    );
}

export default function NewProjectPage() {
    return (
        <React.Suspense fallback={<div className="p-8 text-center text-muted-foreground animate-pulse">Loading...</div>}>
            <NewProjectContent />
        </React.Suspense>
    );
}
