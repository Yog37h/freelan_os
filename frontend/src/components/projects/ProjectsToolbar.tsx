'use client';

import * as React from 'react';
import { Search, Plus, Filter } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { cn } from '@/lib/cn';

interface ProjectsToolbarProps {
    onSearch: (q: string) => void;
    onFilterChange: (status: string) => void;
    activeFilter: string;
    onAddClick: () => void;
}

export function ProjectsToolbar({
    onSearch,
    onFilterChange,
    activeFilter,
    onAddClick
}: ProjectsToolbarProps) {
    const filters = [
        { label: 'All', value: 'all' },
        { label: 'Active', value: 'active' },
        { label: 'Completed', value: 'completed' },
        { label: 'Dropped', value: 'dropped' },
        { label: 'Delayed', value: 'delayed' },
        { label: 'Recurring', value: 'recurring' },
    ];

    return (
        <div className="flex flex-col gap-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Projects</h1>
                    <p className="text-muted-foreground text-sm">Managing {filters.find(f => f.value === activeFilter)?.label.toLowerCase()} initiatives</p>
                </div>
                <Button variant="gradient" className="rounded-xl font-bold px-6 shadow-xl glow-blue" onClick={onAddClick}>
                    <Plus size={18} className="mr-2" /> Add New Project
                </Button>
            </div>

            <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                    <Input
                        placeholder="Search clients or projects..."
                        className="pl-10 bg-card/50 border-white/5 focus-visible:ring-primary/50 transition-all rounded-xl w-full h-11"
                        onChange={(e) => onSearch(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    {filters.map((filter) => (
                        <button
                            key={filter.value}
                            onClick={() => onFilterChange(filter.value)}
                            className={cn(
                                "px-4 h-11 rounded-xl text-sm font-bold transition-all whitespace-nowrap border",
                                activeFilter === filter.value
                                    ? "bg-primary/10 text-primary border-primary/20"
                                    : "bg-card/50 text-muted-foreground border-white/5 hover:bg-muted/50"
                            )}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
