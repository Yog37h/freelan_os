'use client';

import * as React from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { PaymentScheduleItem } from '@/types';
import { formatCurrencyINR, formatDateShort } from '@/lib/format';
import { MessageSquare, Send, X } from 'lucide-react';

interface PaymentReminderModalProps {
    item: PaymentScheduleItem | null;
    isOpen: boolean;
    onClose: () => void;
}

export function PaymentReminderModal({ item, isOpen, onClose }: PaymentReminderModalProps) {
    if (!item) return null;

    const messageTemplate = `Hi ${item.clientName}! Friendly reminder regarding the ${item.status === 'overdue' ? 'overdue' : 'upcoming'} payment of ${formatCurrencyINR(item.amount)} for "${item.projectTitle}". It was due on ${formatDateShort(item.dueDate)}. Please let me know if you need any details!`;

    const handleSend = () => {
        // TODO: Trigger actual WhatsApp send
        alert('Payment reminder queued to WhatsApp! (UI only)');
        onClose();
    };

    return (
        <Dialog isOpen={isOpen} onClose={onClose} title="Send Payment Reminder">
            <div className="space-y-6">
                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h4 className="text-sm font-bold">{item.clientName}</h4>
                            <p className="text-[10px] text-muted-foreground uppercase font-black">{item.projectTitle}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-black text-primary">{formatCurrencyINR(item.amount)}</p>
                            <p className="text-[10px] text-rose-500 uppercase font-black">Due {formatDateShort(item.dueDate)}</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Message Preview (WhatsApp)</label>
                    <div className="w-full rounded-xl bg-card border border-white/10 p-4 text-xs leading-relaxed font-medium italic text-muted-foreground min-h-[100px]">
                        "{messageTemplate}"
                    </div>
                </div>

                <div className="flex gap-3 pt-2">
                    <Button variant="outline" className="flex-1 h-11 rounded-xl font-bold border-white/10" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button variant="gradient" className="flex-[2] h-11 rounded-xl font-bold shadow-xl" onClick={handleSend}>
                        <MessageSquare size={18} className="mr-2" /> Send Reminder
                    </Button>
                </div>
            </div>
        </Dialog>
    );
}
