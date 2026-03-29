'use client';

import * as React from 'react';

interface DateRangeEditorProps {
    startDate: string;
    endDate: string;
    onSave: (start: string, end: string) => void;
    className?: string;
}

export function DateRangeEditor({ startDate, endDate, onSave, className = '' }: DateRangeEditorProps) {
    const [isEditing, setIsEditing] = React.useState(false);
    const [start, setStart] = React.useState(startDate);
    const [end, setEnd] = React.useState(endDate);

    React.useEffect(() => {
        setStart(startDate);
        setEnd(endDate);
    }, [startDate, endDate]);

    const handleSave = () => {
        setIsEditing(false);
        if (start !== startDate || end !== endDate) {
            onSave(start, end);
        }
    };

    if (isEditing) {
        return (
            <div className={`flex items-center gap-2 ${className}`}>
                <input
                    type="date"
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                    className="bg-white/5 border border-primary/30 rounded-lg px-2 py-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <span className="text-muted-foreground text-[10px]">→</span>
                <input
                    type="date"
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                    className="bg-white/5 border border-primary/30 rounded-lg px-2 py-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                    onClick={handleSave}
                    className="text-[9px] font-black uppercase tracking-widest text-primary hover:text-primary/80"
                >
                    Save
                </button>
                <button
                    onClick={() => { setStart(startDate); setEnd(endDate); setIsEditing(false); }}
                    className="text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground"
                >
                    Cancel
                </button>
            </div>
        );
    }

    return (
        <span
            className={`text-[10px] text-muted-foreground font-black uppercase tracking-widest cursor-pointer hover:text-primary transition-colors ${className}`}
            onClick={() => setIsEditing(true)}
            title="Click to edit dates"
        >
            {formatShortDate(startDate)} → {formatShortDate(endDate)}
        </span>
    );
}

function formatShortDate(dateStr: string): string {
    if (!dateStr) return '---';
    try {
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
        return dateStr;
    }
}
