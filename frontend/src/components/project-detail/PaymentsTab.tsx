'use client';

import * as React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { AddPaymentModal } from '../payments/AddPaymentModal';
import { fetchProjectPayments } from '@/lib/api/paymentsApi';
import { formatCurrency, formatDate } from '@/lib/format';
import { CalendarDays, CreditCard, Loader2, MessageSquarePlus } from 'lucide-react';

interface PaymentsTabProps {
    projectId: string;
    projectTitle: string;
    clientName: string;
}

type ProjectPayment = {
    id: string;
    type: string;
    amount: number;
    currency: string;
    dueDate: string;
    status: string;
    note?: string | null;
    createdAt?: string;
};

const STATUS_STYLES: Record<string, string> = {
    paid: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    due: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    overdue: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    scheduled: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
};

function normalizePayment(row: any): ProjectPayment {
    return {
        id: row.id,
        type: row.type,
        amount: Number(row.amount || 0),
        currency: row.currency || 'INR',
        dueDate: row.dueDate || row.due_date,
        status: row.status || 'scheduled',
        note: row.note,
        createdAt: row.createdAt || row.created_at,
    };
}

export function PaymentsTab({ projectId, projectTitle, clientName }: PaymentsTabProps) {
    const [payments, setPayments] = React.useState<ProjectPayment[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);

    const loadPayments = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await fetchProjectPayments(projectId);
            setPayments(data.map(normalizePayment));
        } catch (error) {
            console.error('Failed to load project payments:', error);
            setPayments([]);
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    React.useEffect(() => {
        loadPayments();
    }, [loadPayments]);

    return (
        <>
            <div className="space-y-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h3 className="text-xl font-black tracking-tighter uppercase">Payments</h3>
                        <p className="text-sm text-muted-foreground font-medium">
                            Track payment requests for this project and send the next collection ask to the client.
                        </p>
                    </div>
                    <Button
                        variant="gradient"
                        className="rounded-xl font-bold h-11 px-6 shadow-glow-blue"
                        onClick={() => setIsAddModalOpen(true)}
                    >
                        <MessageSquarePlus size={18} className="mr-2" />
                        Add Payment
                    </Button>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-24 text-muted-foreground">
                        <Loader2 className="animate-spin mr-3" size={20} />
                        <span className="text-sm font-bold uppercase tracking-widest">Loading Payments...</span>
                    </div>
                ) : payments.length === 0 ? (
                    <Card className="p-10 border-white/5 text-center space-y-4">
                        <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 border border-primary/15 flex items-center justify-center text-primary">
                            <CreditCard size={24} />
                        </div>
                        <div className="space-y-2">
                            <h4 className="text-lg font-black tracking-tight">No payment requests yet</h4>
                            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
                                Send a payment required message for this project and keep the request status tracked here.
                            </p>
                        </div>
                        <div className="flex justify-center">
                            <Button
                                variant="gradient"
                                className="rounded-xl font-bold h-11 px-6 shadow-glow-blue"
                                onClick={() => setIsAddModalOpen(true)}
                            >
                                <MessageSquarePlus size={18} className="mr-2" />
                                Request Payment
                            </Button>
                        </div>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        {payments.map((payment) => (
                            <Card key={payment.id} className="p-5 border-white/5 bg-card/40">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="space-y-2 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h4 className="text-base font-black tracking-tight uppercase">
                                                {payment.type} payment
                                            </h4>
                                            <Badge
                                                className={`h-5 text-[9px] uppercase border ${
                                                    STATUS_STYLES[payment.status] || 'bg-white/10 text-white border-white/10'
                                                }`}
                                            >
                                                {payment.status}
                                            </Badge>
                                        </div>
                                        <p className="text-2xl font-black tracking-tight">
                                            {formatCurrency(payment.amount, payment.currency)}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold">
                                            <CalendarDays size={14} />
                                            <span>Due {formatDate(payment.dueDate)}</span>
                                        </div>
                                    </div>
                                    <div className="text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                        {payment.createdAt ? `Requested ${formatDate(payment.createdAt)}` : 'Payment request'}
                                    </div>
                                </div>

                                {payment.note ? (
                                    <div className="mt-4 rounded-2xl border border-white/5 bg-white/5 p-4">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                                            Client Note
                                        </p>
                                        <p className="text-sm leading-relaxed text-foreground/85">{payment.note}</p>
                                    </div>
                                ) : null}
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <AddPaymentModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                projectId={projectId}
                projectLabel={`${clientName} - ${projectTitle}`}
                onSuccess={loadPayments}
            />
        </>
    );
}
