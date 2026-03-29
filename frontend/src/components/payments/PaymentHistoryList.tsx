'use client';

import * as React from 'react';
import { PaymentTransaction } from '@/types';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { PaymentHistoryItem } from './PaymentHistoryItem';
import { Search, Filter, History } from 'lucide-react';
import { cn } from '@/lib/cn';

interface PaymentHistoryListProps {
    transactions: PaymentTransaction[];
}

export function PaymentHistoryList({ transactions }: PaymentHistoryListProps) {
    const [search, setSearch] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState<'all' | 'success' | 'pending' | 'failed'>('all');

    const filtered = transactions.filter(t => {
        const matchesSearch = t.clientName.toLowerCase().includes(search.toLowerCase()) ||
            t.projectTitle.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const filterOptions = [
        { id: 'all', label: 'All' },
        { id: 'success', label: 'Success' },
        { id: 'pending', label: 'Pending' },
        { id: 'failed', label: 'Failed' },
    ];

    return (
        <Card className="p-8 border-white/5 bg-card/40 glass-panel">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-3">
                    <History className="text-primary" size={24} />
                    <h3 className="text-xl font-black tracking-tight uppercase">Payment history</h3>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                        <Input
                            placeholder="Search history..."
                            className="pl-10 h-10 rounded-xl bg-card border-white/5"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex p-1 bg-white/5 rounded-xl border border-white/5 overflow-x-auto no-scrollbar">
                        {filterOptions.map((opt) => (
                            <button
                                key={opt.id}
                                onClick={() => setStatusFilter(opt.id as any)}
                                className={cn(
                                    "px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all whitespace-nowrap",
                                    statusFilter === opt.id ? "bg-primary text-white shadow-lg glow-blue" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                {filtered.length > 0 ? (
                    filtered.map((txn) => (
                        <PaymentHistoryItem key={txn.txnId} txn={txn} />
                    ))
                ) : (
                    <div className="py-20 flex flex-col items-center justify-center text-center opacity-40">
                        <Search size={40} className="mb-4" />
                        <p className="text-sm font-bold">No matching transactions found</p>
                    </div>
                )}
            </div>
        </Card>
    );
}
