'use client';

import * as React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';

interface TimelineCalendarProps {
    selectedDate: Date;
    setSelectedDate: (date: Date) => void;
    taskDates: string[]; // Set of YYYY-MM-DD strings
}

export function TimelineCalendar({ selectedDate, setSelectedDate, taskDates }: TimelineCalendarProps) {
    const [viewDate, setViewDate] = React.useState(new Date(selectedDate));

    React.useEffect(() => {
        setViewDate(new Date(selectedDate));
    }, [selectedDate]);

    const monthName = viewDate.toLocaleString('default', { month: 'long' });
    const year = viewDate.getFullYear();

    const prevMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    };

    const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();

    const days: React.ReactNode[] = [];
    // Fill leading empty days
    for (let i = 0; i < firstDayOfMonth; i++) {
        days.push(<div key={`empty-${i}`} className="h-10" />);
    }

    for (let d = 1; d <= daysInMonth; d++) {
        const currentDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), d);
        const dateStr = toDateKey(currentDay);
        const isSelected = selectedDate.toDateString() === currentDay.toDateString();
        const hasTasks = taskDates.includes(dateStr);
        const isToday = new Date().toDateString() === currentDay.toDateString();

        days.push(
            <button
                key={d}
                onClick={() => setSelectedDate(currentDay)}
                className={cn(
                    "h-10 w-10 rounded-xl text-xs font-bold transition-all relative flex items-center justify-center",
                    isSelected ? "bg-primary text-white shadow-lg glow-blue" : "hover:bg-white/5",
                    isToday && !isSelected && "border border-primary/30 text-primary"
                )}
            >
                {d}
                {hasTasks && !isSelected && (
                    <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                )}
            </button>
        );
    }

    return (
        <Card className="p-6 border-white/5 glass-panel">
            <div className="flex items-center justify-between mb-8">
                <h3 className="font-extrabold text-sm tracking-widest uppercase">{monthName} {year}</h3>
                <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={prevMonth}>
                        <ChevronLeft size={16} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={nextMonth}>
                        <ChevronRight size={16} />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                    <div key={`${day}-${i}`} className="h-8 w-10 flex items-center justify-center text-[10px] font-black text-muted-foreground uppercase">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {days}
            </div>

            <div className="mt-8 pt-6 border-t border-white/5">
                <Button
                    variant="outline"
                    className="w-full rounded-xl text-[10px] font-black uppercase tracking-widest h-9 border-white/5"
                    onClick={() => {
                        setSelectedDate(new Date());
                        setViewDate(new Date());
                    }}
                >
                    Jump to Today
                </Button>
            </div>
        </Card>
    );
}

function toDateKey(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
