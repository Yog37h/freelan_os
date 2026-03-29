'use client';

import * as React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/Tabs';
import { OverviewTab } from './OverviewTab';
import { TimelineTab } from './TimelineTab';
import { UpdatesTab } from './UpdatesTab';
import { FilesTab } from './FilesTab';
import { ScopeTab } from './ScopeTab';
import { PaymentsTab } from './PaymentsTab';
import { ClosureTab } from './ClosureTab';
import { Project } from '@/types';

interface ProjectDetailTabsProps {
    project: Project;
    projectId: string;
    initialTab?: string;
}

export function ProjectDetailTabs({ project, projectId, initialTab = 'overview' }: ProjectDetailTabsProps) {
    return (
        <Tabs defaultValue={initialTab} className="space-y-10">
            <div className="flex justify-center md:justify-start">
                <TabsList className="p-1.5 bg-card/50 border border-white/5 shadow-2xl overflow-x-auto no-scrollbar max-w-full">
                    <TabsTrigger value="overview" className="px-6 font-black uppercase tracking-widest text-[10px]">Overview</TabsTrigger>
                    <TabsTrigger value="timeline" className="px-6 font-black uppercase tracking-widest text-[10px]">Timeline</TabsTrigger>
                    <TabsTrigger value="updates" className="px-6 font-black uppercase tracking-widest text-[10px]">Activity</TabsTrigger>
                    <TabsTrigger value="files" className="px-6 font-black uppercase tracking-widest text-[10px]">Files</TabsTrigger>
                    <TabsTrigger value="scope" className="px-6 font-black uppercase tracking-widest text-[10px]">Scope</TabsTrigger>
                    <TabsTrigger value="payments" className="px-6 font-black uppercase tracking-widest text-[10px]">Payments</TabsTrigger>
                    <TabsTrigger value="closure" className="px-6 font-black uppercase tracking-widest text-[10px]">Closure</TabsTrigger>
                </TabsList>
            </div>

            {/* Each tab is self-fetching — uses its own dedicated API endpoint */}
            <TabsContent value="overview">
                <OverviewTab project={project} projectId={projectId} />
            </TabsContent>

            <TabsContent value="timeline">
                <TimelineTab project={project} projectId={projectId} />
            </TabsContent>

            <TabsContent value="updates">
                <UpdatesTab projectId={projectId} />
            </TabsContent>

            <TabsContent value="files">
                <FilesTab projectId={projectId} />
            </TabsContent>

            <TabsContent value="scope">
                <ScopeTab projectId={projectId} />
            </TabsContent>

            <TabsContent value="payments">
                <PaymentsTab
                    projectId={projectId}
                    projectTitle={project.projectTitle}
                    clientName={project.client.name}
                />
            </TabsContent>

            <TabsContent value="closure">
                <ClosureTab project={project} projectId={projectId} />
            </TabsContent>
        </Tabs>
    );
}
