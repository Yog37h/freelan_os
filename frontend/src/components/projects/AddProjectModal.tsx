'use client';

import * as React from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Calendar, CreditCard, User, Briefcase, FileText } from 'lucide-react';

export function AddProjectModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [formData, setFormData] = React.useState({
        clientName: '',
        business: '',
        email: '',
        whatsapp: '',
        title: '',
        description: '',
        startDate: '',
        deadline: '',
        type: 'Fixed',
        cost: '',
        paymentTerms: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Simulate creation
        onClose();
        // In a real app, we'd call an API here
    };

    return (
        <Dialog isOpen={isOpen} onClose={onClose} title="Initialize New Project">
            <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 no-scrollbar">
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-primary">
                        <User size={16} />
                        <span className="text-xs font-bold uppercase tracking-widest">Client Identity</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            placeholder="Primary Contact Name"
                            className="bg-white/5 border-white/5"
                            value={formData.clientName}
                            onChange={e => setFormData({ ...formData, clientName: e.target.value })}
                        />
                        <Input
                            placeholder="Business Name"
                            className="bg-white/5 border-white/5"
                            value={formData.business}
                            onChange={e => setFormData({ ...formData, business: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            placeholder="Email (e.g. client@biz.com)"
                            className="bg-white/5 border-white/5"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                        <Input
                            placeholder="WhatsApp (+91...)"
                            className="bg-white/5 border-white/5"
                            value={formData.whatsapp}
                            onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                        />
                    </div>
                </div>

                <div className="space-y-4 pt-2 border-t border-white/5">
                    <div className="flex items-center gap-2 text-primary">
                        <Briefcase size={16} />
                        <span className="text-xs font-bold uppercase tracking-widest">Project Specs</span>
                    </div>
                    <Input
                        placeholder="Project Title (e.g. Website Overhaul)"
                        className="bg-white/5 border-white/5"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                    />
                    <textarea
                        placeholder="Brief Description..."
                        className="w-full h-24 bg-white/5 border border-white/5 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Start Date</label>
                            <Input
                                type="date"
                                className="bg-white/5 border-white/5 text-xs h-9"
                                value={formData.startDate}
                                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Deadline</label>
                            <Input
                                type="date"
                                className="bg-white/5 border-white/5 text-xs h-9"
                                value={formData.deadline}
                                onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-4 pt-2 border-t border-white/5">
                    <div className="flex items-center gap-2 text-primary">
                        <CreditCard size={16} />
                        <span className="text-xs font-bold uppercase tracking-widest">Financials</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <select
                            className="bg-white/5 border border-white/5 rounded-xl px-3 text-sm h-10 focus:outline-none focus:ring-2 focus:ring-primary/50"
                            value={formData.type}
                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                        >
                            <option value="Fixed">Fixed Price</option>
                            <option value="Recurring">Recurring / Monthly</option>
                        </select>
                        <Input
                            placeholder="Total Quote (INR)"
                            type="number"
                            className="bg-white/5 border-white/5 h-10"
                            value={formData.cost}
                            onChange={e => setFormData({ ...formData, cost: e.target.value })}
                        />
                    </div>
                    <Input
                        placeholder="Payment Terms (e.g. 50% upfront)"
                        className="bg-white/5 border-white/5 h-10"
                        value={formData.paymentTerms}
                        onChange={e => setFormData({ ...formData, paymentTerms: e.target.value })}
                    />
                </div>

                <div className="pt-6 flex gap-3">
                    <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={onClose}>Discard</Button>
                    <Button type="submit" variant="gradient" className="flex-1 rounded-xl font-bold">Launch Project</Button>
                </div>
            </form>
        </Dialog>
    );
}
