

import * as React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { PaymentScheduleItem } from '@/types';
import { formatCurrencyINR, daysUntil, daysOverdue } from '@/lib/format';
import { Calendar, CreditCard, AlertCircle, TrendingUp, Send } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Link } from '@/components/router/Link';
import { PaymentReminderModal } from './PaymentReminderModal';

interface SummaryCardsProps {
    upcoming: PaymentScheduleItem[];
    due: PaymentScheduleItem[];
    totalCredited: number;
}

export function PaymentsSummaryCards({ upcoming, due, totalCredited }: SummaryCardsProps) {
    const [reminderItem, setReminderItem] = React.useState<PaymentScheduleItem | null>(null);

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Next Payments */}
                <Card className="p-6 border-white/5 bg-card/40 glass-panel">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <Calendar size={20} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Next payments</h3>
                            <p className="text-[10px] font-bold text-primary uppercase">{upcoming.length} Scheduled</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {upcoming.slice(0, 3).map((item) => {
                            const daysLeft = daysUntil(item.dueDate);
                            return (
                                <Link
                                    key={item.scheduleId}
                                    href={`/projects/${item.projectId}`}
                                    className="block group"
                                >
                                    <div className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-all">
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold truncate group-hover:text-primary transition-colors">{item.projectTitle}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase font-black">
                                                {daysLeft === 0 ? 'Today' : `${daysLeft} days remaining`}
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-sm font-black">{formatCurrencyINR(item.amount)}</p>
                                            <Badge variant="secondary" className="h-4 text-[8px] px-1.5 opacity-50 bg-white/5 border-none">SCHED</Badge>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                        {upcoming.length === 0 && (
                            <p className="text-xs text-muted-foreground italic py-2">No upcoming payments</p>
                        )}
                    </div>
                </Card>

                {/* Due Payments */}
                <Card className="p-6 border-rose-500/10 bg-card/40 glass-panel">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                            <AlertCircle size={20} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Due payments</h3>
                            <p className="text-[10px] font-bold text-rose-500 uppercase">{due.length} Action Items</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {due.slice(0, 3).map((item) => {
                            const overdue = daysOverdue(item.dueDate);
                            return (
                                <div key={item.scheduleId} className="flex items-center justify-between p-2 rounded-xl bg-rose-500/5 border border-rose-500/5">
                                    <Link to={`/projects/${item.projectId}`}
                                        className="min-w-0 group"
                                    >
                                        <p className="text-xs font-bold truncate group-hover:text-rose-500 transition-colors">{item.projectTitle}</p>
                                        <p className="text-[10px] text-rose-500 uppercase font-black">
                                            {overdue === 0 ? 'Due today' : `${overdue}d overdue`}
                                        </p>
                                    </Link>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right shrink-0">
                                            <p className="text-sm font-black text-rose-500">{formatCurrencyINR(item.amount)}</p>
                                        </div>
                                        <button
                                            onClick={() => setReminderItem(item)}
                                            className="p-1.5 rounded-lg bg-card border border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-95"
                                        >
                                            <Send size={12} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                        {due.length === 0 && (
                            <p className="text-xs text-emerald-500 font-bold py-2">All payments clear! 🎉</p>
                        )}
                    </div>
                </Card>

                {/* Total Credited */}
                <Card className="p-6 border-emerald-500/10 bg-card/40 glass-panel relative overflow-hidden">
                    <div className="relative z-10 h-full flex flex-col">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                <TrendingUp size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Total credited</h3>
                                <p className="text-[10px] font-bold text-emerald-500 uppercase">Last 30 days</p>
                            </div>
                        </div>

                        <div className="mt-auto">
                            <h4 className="text-4xl font-black tracking-tighter text-emerald-500 mb-1">
                                {formatCurrencyINR(totalCredited)}
                            </h4>
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground">
                                <span className="text-emerald-500">+12%</span> vs last month
                            </div>
                        </div>
                    </div>
                    <CreditCard className="absolute bottom-[-30px] right-[-30px] opacity-[0.03] text-emerald-500" size={180} />
                </Card>
            </div>

            <PaymentReminderModal
                item={reminderItem}
                isOpen={!!reminderItem}
                onClose={() => setReminderItem(null)}
            />
        </>
    );
}
