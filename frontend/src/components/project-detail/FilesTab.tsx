// ✅ VERIFIED: Files tab keeps the grouped milestone view but now renders manual placeholder deliverable links with no Google banners or Drive dependency. Manual test: confirm a plan, open Files tab, and verify each deliverable shows a share-ready Open Link action.
'use client';

import * as React from 'react';
import { DeliverableFolderItem, ProjectFilesBucketGroup, ProjectFilesView } from '@/types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ExternalLink, FolderTree, Link as LinkIcon, Loader2, Search } from 'lucide-react';
import { Input } from '../ui/Input';
import { fetchFiles } from '@/lib/api/filesApi';

interface FilesTabProps {
    projectId: string;
}

export function FilesTab({ projectId }: FilesTabProps) {
    const [view, setView] = React.useState<ProjectFilesView | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [search, setSearch] = React.useState('');

    React.useEffect(() => {
        setIsLoading(true);
        fetchFiles(projectId)
            .then((data) => setView(data))
            .catch((error) => {
                console.error('Failed to load files:', error);
                setView(null);
            })
            .finally(() => setIsLoading(false));
    }, [projectId]);

    const normalizedSearch = search.trim().toLowerCase();
    const filteredBuckets = React.useMemo(
        () =>
            (view?.buckets || [])
                .map((bucket) => ({
                    ...bucket,
                    deliverables: bucket.deliverables.filter((deliverable) =>
                        matchesSearch(bucket, deliverable, normalizedSearch),
                    ),
                }))
                .filter(
                    (bucket) =>
                        bucket.deliverables.length > 0 ||
                        bucket.bucketTitle.toLowerCase().includes(normalizedSearch),
                ),
        [normalizedSearch, view?.buckets],
    );

    const filteredUnassignedItems = React.useMemo(
        () =>
            (view?.unassignedItems || []).filter((item) =>
                item.name.toLowerCase().includes(normalizedSearch),
            ),
        [normalizedSearch, view?.unassignedItems],
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-24 text-muted-foreground">
                <Loader2 className="mr-3 animate-spin" size={20} />
                <span className="text-sm font-bold uppercase tracking-widest">
                    Loading Vault...
                </span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 rounded-[2rem] border border-white/5 bg-card/40 p-6 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                    <h3 className="text-xl font-black uppercase tracking-tighter">
                        Deliverable Vault
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Deliverable links stay grouped by milestone and remain ready for client sharing.
                    </p>
                </div>

                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <Input placeholder="Search deliverables..." className="h-10 rounded-xl border-white/5 bg-muted/30 pl-9 text-xs" value={search} onChange={(event) => setSearch(event.target.value)} />
                </div>
            </div>

            {filteredBuckets.length === 0 && filteredUnassignedItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-12 text-center">
                    <p className="text-xs font-black uppercase text-muted-foreground">
                        {search ? 'No deliverables match your search.' : 'No deliverable links are available yet.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-5">
                    {filteredBuckets.map((bucket) => (
                        <Card key={bucket.bucketId} className="border-white/5 p-5">
                            <div className="mb-4 flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-primary">
                                        Milestone
                                    </p>
                                    <h4 className="text-lg font-black tracking-tight">{bucket.bucketTitle}</h4>
                                </div>
                                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                    <FolderTree size={12} />
                                    {bucket.deliverables.length} links
                                </div>
                            </div>

                            <div className="grid gap-4 lg:grid-cols-2">
                                {bucket.deliverables.map((deliverable) => (
                                    <DeliverableFolderCard key={deliverable.id || `${bucket.bucketId}-${deliverable.deliverableId}`} deliverable={deliverable} />
                                ))}
                            </div>
                        </Card>
                    ))}

                    {filteredUnassignedItems.length > 0 && (
                        <Card className="border-white/5 p-5">
                            <div className="mb-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-primary">
                                    Other Files
                                </p>
                                <h4 className="text-lg font-black tracking-tight">Unassigned Items</h4>
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                                {filteredUnassignedItems.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.03] p-4">
                                        <div>
                                            <p className="text-sm font-bold">{item.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {item.itemType || item.type || 'file'}
                                            </p>
                                        </div>
                                        {item.webViewLink && (
                                            <a href={item.webViewLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-primary">
                                                Open <ExternalLink size={12} />
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
}

function DeliverableFolderCard({ deliverable }: { deliverable: DeliverableFolderItem }) {
    return (
        <div className="rounded-[1.5rem] border border-white/6 bg-white/[0.03] p-4">
            <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                        Deliverable Link
                    </p>
                    <h5 className="text-base font-black tracking-tight">
                        {deliverable.deliverableTitle || deliverable.name}
                    </h5>
                    <p className="text-xs text-muted-foreground">
                        Share-ready placeholder link for client delivery.
                    </p>
                </div>

                <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-400">
                    Share ready
                </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/5 pt-4">
                <div className="text-xs text-muted-foreground">{deliverable.bucketTitle}</div>
                {deliverable.webViewLink ? (
                    <a href={deliverable.webViewLink} target="_blank" rel="noreferrer">
                        <Button variant="secondary" className="rounded-xl border border-white/10 bg-white/5 text-xs font-black uppercase tracking-widest">
                            <LinkIcon size={12} className="mr-2" />
                            Open Link
                            <ExternalLink size={12} className="ml-2" />
                        </Button>
                    </a>
                ) : (
                    <Button variant="secondary" className="rounded-xl text-xs font-black uppercase tracking-widest" disabled>
                        Link unavailable
                    </Button>
                )}
            </div>
        </div>
    );
}

function matchesSearch(
    bucket: ProjectFilesBucketGroup,
    deliverable: DeliverableFolderItem,
    search: string,
) {
    if (!search) {
        return true;
    }

    return (
        bucket.bucketTitle.toLowerCase().includes(search) ||
        (deliverable.deliverableTitle || deliverable.name).toLowerCase().includes(search)
    );
}
