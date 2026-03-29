'use client';

import * as React from 'react';
import {
  getUpcomingPayments,
  getDuePayments,
  getPaymentTransactions,
  getTotalPaidAmount
} from '@/lib/data';
import { PaymentScheduleItem, PaymentTransaction } from '@/types';
import { Button } from '@/components/ui/Button';
import { PaymentsSummaryCards } from '@/components/payments/PaymentsSummaryCards';
import { PaymentHistoryList } from '@/components/payments/PaymentHistoryList';
import { AddPaymentModal } from '@/components/payments/AddPaymentModal';
import { Plus, CreditCard, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function PaymentsPage() {
  const [upcoming, setUpcoming] = React.useState<PaymentScheduleItem[]>([]);
  const [due, setDue] = React.useState<PaymentScheduleItem[]>([]);
  const [transactions, setTransactions] = React.useState<PaymentTransaction[]>([]);
  const [totalCredited, setTotalCredited] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);

  React.useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [u, d, t, total] = await Promise.all([
          getUpcomingPayments(),
          getDuePayments(),
          getPaymentTransactions(),
          getTotalPaidAmount()
        ]);
        setUpcoming(u);
        setDue(d);
        setTransactions(t);
        setTotalCredited(total);
      } catch (error) {
        console.error('Failed to fetch payment data:', error);
      }
      setIsLoading(false);
    }
    fetchData();
  }, []);

  const overdueCount = due.filter(p => p.status === 'overdue').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-8">
        <div>
          <h1 className="text-4xl font-black tracking-tighter">Payments</h1>
          <p className="text-muted-foreground text-sm font-medium">Request, track and remind clients—without chasing.</p>
        </div>

        <Button
          variant="gradient"
          className="rounded-xl font-bold h-11 px-6 shadow-glow-blue"
          onClick={() => setIsAddModalOpen(true)}
        >
          <Plus size={20} className="mr-2" /> Add Payment
        </Button>
      </div>

      {/* Chasing Risk Banner */}
      {overdueCount >= 2 && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-500">
              <AlertTriangle size={20} />
            </div>
            <div>
              <p className="text-sm font-black text-rose-500 uppercase tracking-tight">Chasing Risk Detected</p>
              <p className="text-xs font-medium text-muted-foreground">You have {overdueCount} overdue payments—send reminders in 1 click.</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="rounded-xl font-bold border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white transition-all h-9">
            Send All Reminders
          </Button>
        </div>
      )}

      {/* Main Content Sections */}
      {isLoading ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array(3).fill(0).map((_, i) => <div key={i} className="h-48 bg-muted/10 rounded-2xl animate-pulse" />)}
          </div>
          <div className="h-96 bg-muted/10 rounded-2xl animate-pulse" />
        </div>
      ) : (
        <div className="space-y-10">
          <PaymentsSummaryCards
            upcoming={upcoming}
            due={due}
            totalCredited={totalCredited}
          />

          <PaymentHistoryList transactions={transactions} />

          {/* Trust Footer */}
          <div className="flex items-center justify-center gap-2 py-8 opacity-20">
            <ShieldCheck size={16} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">FreelanceOS Secured • Bank-grade UPI Verification</span>
          </div>
        </div>
      )}

      {/* Modals */}
      <AddPaymentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
}
