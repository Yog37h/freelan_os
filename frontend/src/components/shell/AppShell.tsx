'use client';

import * as React from 'react';
import { SidebarNav } from './SidebarNav';
import { TopBar } from './TopBar';

export function AppShell({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen bg-background text-foreground overflow-hidden">
            {/* Sidebar */}
            <SidebarNav />

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* Decorative background glow */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none translate-y-1/2 -translate-x-1/2" />

                <TopBar />
                <main className="flex-1 overflow-y-auto overflow-x-hidden p-8 relative z-10 scrollbar-thin scrollbar-thumb-muted-foreground/20">
                    <div className="max-w-7xl mx-auto space-y-10">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
