

import * as React from 'react';
import { PaymentTransaction } from '@/types';
import { formatCurrencyINR, formatDateTimeCompact } from '@/lib/format';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { CheckCircle2, Clock, AlertCircle, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Link } from '@/components/router/Link';

export function PaymentHistoryItem({ txn }: { txn: PaymentTransaction }) {
    const statusConfig = {
        success: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        pending: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
        failed: { icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    };

    const { icon: StatusIcon, color, bg } = statusConfig[txn.status];

    return (
        <Link to={`/projects/${txn.projectId}`}>
            <div className="group flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all duration-300">
                <div className="flex items-center gap-4 min-w-0">
                    <Avatar
                        initials={txn.clientName.split(' ').map(n => n[0]).join('')}
                        className="w-12 h-12 bg-white/5 border-white/5 group-hover:bg-primary/10 transition-colors"
                    />
                    <div className="min-w-0">
                        <h4 className="text-sm font-bold truncate group-hover:text-primary transition-colors">{txn.clientName}</h4>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-muted-foreground uppercase font-black truncate max-w-[150px]">{txn.projectTitle}</span>
                            <Badge variant="secondary" className="h-4 text-[8px] py-0 border-none bg-muted/20 opacity-70 uppercase">
                                {txn.type}
                            </Badge>
                        </div>
                    </div>
                </div>

                <div className="text-right flex items-center gap-6">
                    <div className="hidden sm:block">
                        <p className="text-[10px] text-muted-foreground uppercase font-black">{formatDateTimeCompact(txn.paidAt)}</p>
                        {txn.reference && <p className="text-[9px] text-muted-foreground/40 font-mono tracking-tighter truncate max-w-[100px]">{txn.reference}</p>}
                    </div>

                    <div className="w-32 flex flex-col items-end">
                        <p className={cn("text-md font-black flex items-center gap-1", txn.status === 'success' ? 'text-primary' : 'text-foreground/60')}>
                            {formatCurrencyINR(txn.amount)}
                        </p>
                        <div className={cn("flex items-center gap-1.5 mt-1", color)}>
                            <StatusIcon size={12} />
                            <span className="text-[10px] font-black uppercase tracking-widest">{txn.status}</span>
                        </div>
                    </div>

                    <ArrowUpRight size={16} className="text-muted-foreground/20 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
            </div>
        </Link>
    );
}
