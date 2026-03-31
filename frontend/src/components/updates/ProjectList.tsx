'use client';

import * as React from 'react';
import { UpdateCenterItem } from '@/types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { cn } from '@/lib/cn';
import { MessageSquare, Zap } from 'lucide-react';

interface ProjectListProps {
    items: UpdateCenterItem[];
    selectedId: string | null;
    onSelect: (id: string) => void;
}

export function ProjectList({ items, selectedId, onSelect }: ProjectListProps) {
    return (
        <div className="space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2 mb-4">Active Channels</h3>
            {items.length > 0 ? items.map((item) => (
                <button
                    key={item.updateId}
                    onClick={() => onSelect(item.updateId)}
                    className={cn(
                        "w-full text-left p-4 rounded-2xl transition-all border group",
                        selectedId === item.updateId
                            ? "bg-primary/10 border-primary/30 shadow-[0_0_30px_rgba(59,130,246,0.1)]"
                            : "bg-card/40 border-white/5 hover:bg-muted/50 hover:border-white/10"
                    )}
                >
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-black uppercase tracking-widest text-primary truncate max-w-[120px]">{item.clientName}</span>
                        {item.autoMode && (
                            <Badge variant="success" className="h-4 text-[8px] font-black uppercase px-1.5 animate-pulse bg-emerald-500/20 text-emerald-500 border-none">
                                <Zap size={8} className="mr-1" /> Auto
                            </Badge>
                        )}
                    </div>
                    <h4 className="text-sm font-bold truncate mb-1 group-hover:text-primary transition-colors">{item.projectTitle}</h4>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1.5 uppercase font-medium">
                        <MessageSquare size={10} /> Last: {new Date(item.sentAt).toLocaleDateString()}
                    </p>
                </button>
            )) : (
                <Card className="p-6 border border-dashed border-white/10 bg-card/20 text-center">
                    <MessageSquare size={28} className="mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-sm font-bold">No active channels yet</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Create your first project to start client updates.
                    </p>
                </Card>
            )}
        </div>
    );
}
