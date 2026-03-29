'use client';

import * as React from 'react';
import { getUpdateCenterItems, getProjectUpdates } from '@/lib/data';
import { UpdateCenterItem, ProjectUpdate } from '@/types';
import { ProjectList } from '@/components/updates/ProjectList';
import { UpdatePanel } from '@/components/updates/UpdatePanel';
import { Button } from '@/components/ui/Button';
import { MessageSquare, Settings } from 'lucide-react';

export default function ClientUpdatesPage() {
    const [items, setItems] = React.useState<UpdateCenterItem[]>([]);
    const [selectedId, setSelectedId] = React.useState<string | null>(null);
    const [history, setHistory] = React.useState<ProjectUpdate[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        async function fetchData() {
            setIsLoading(true);
            const data = await getUpdateCenterItems();
            setItems(data);
            if (data.length > 0) {
                setSelectedId(data[0].updateId);
            }
            setIsLoading(false);
        }
        fetchData();
    }, []);

    React.useEffect(() => {
        async function fetchHistory() {
            if (!selectedId) return;
            const selectedItem = items.find(i => i.updateId === selectedId);
            if (selectedItem) {
                const h = await getProjectUpdates(selectedItem.projectId);
                setHistory(h);
            }
        }
        fetchHistory();
    }, [selectedId, items]);

    const selectedItem = items.find(i => i.updateId === selectedId);

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-8">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter">Client Update Center</h1>
                    <p className="text-muted-foreground text-sm font-medium">Manage and automate project communications</p>
                </div>

                <Button variant="outline" className="rounded-xl font-bold h-11 border-white/5 bg-card/40 hover:bg-muted">
                    <Settings size={18} className="mr-2" /> Global Settings
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[600px]">
                {/* Left: Project List */}
                <div className="lg:col-span-4 xl:col-span-3">
                    <ProjectList
                        items={items}
                        selectedId={selectedId}
                        onSelect={setSelectedId}
                    />
                </div>

                {/* Right: Panel */}
                <div className="lg:col-span-8 xl:col-span-9">
                    {isLoading ? (
                        <div className="h-full bg-muted/10 rounded-[2.5rem] animate-pulse flex items-center justify-center">
                            <MessageSquare size={48} className="text-muted-foreground/20" />
                        </div>
                    ) : selectedItem ? (
                        <UpdatePanel item={selectedItem} history={history} />
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center py-20 bg-card/30 rounded-[2.5rem] border border-dashed border-white/10">
                            <MessageSquare className="text-muted-foreground/20 mb-6" size={64} />
                            <h3 className="text-xl font-black uppercase tracking-tighter mb-2">No Channel Selected</h3>
                            <p className="text-muted-foreground text-sm">Pick a project from the left to manage messaging.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
