

import * as React from 'react';
import { Link } from '@/components/router/Link';
import {
    Home,
    Layers,
    Calendar,
    PhoneCall,
    MessageSquare,
    CheckCircle2,
    CreditCard,
    Sparkles,
    Settings,
    ChevronLeft,
    ChevronRight,
    TrendingUp,
    PanelLeftClose,
    PanelLeftOpen
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

const navItems = [
    { icon: Home, label: 'Home', href: '/dashboard' },
    { icon: Layers, label: 'Projects', href: '/projects' },
    { icon: Calendar, label: 'Timeline', href: '/timeline' },
    { icon: PhoneCall, label: 'Client Calls', href: '/client-calls' },
    { icon: MessageSquare, label: 'Client Updates', href: '/client-updates' },
    { icon: CheckCircle2, label: 'Approvals', href: '/approvals' },
    { icon: CreditCard, label: 'Payments', href: '/payments' },
    { icon: Sparkles, label: 'Wrapped Card', href: '/wrapped' },
    { icon: Settings, label: 'Settings', href: '/settings' },
];

export function SidebarNav() {
    const [isCollapsed, setIsCollapsed] = React.useState(false);
    const pathname = window.location.pathname;

    return (
        <aside
            className={cn(
                'relative bg-card border-r border-border transition-all duration-300 flex flex-col',
                isCollapsed ? 'w-20' : 'w-64'
            )}
        >
            {/* Branding */}
            <div className="h-16 flex items-center px-6 gap-3 pt-4 mb-8">
                <div className="w-8 h-8 rounded-lg gradient-blue flex items-center justify-center shrink-0">
                    <Layers className="text-white" size={20} />
                </div>
                {!isCollapsed && (
                    <span className="font-bold text-lg tracking-tight gradient-blue-text">
                        FreelanceOS
                    </span>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'group flex items-center h-11 px-3 rounded-xl transition-all relative overflow-hidden',
                                isActive
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                            )}
                        >
                            {isActive && (
                                <div className="absolute left-0 top-3 bottom-3 w-1.5 gradient-blue rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                            )}
                            <item.icon
                                size={20}
                                className={cn(
                                    'shrink-0',
                                    isActive ? 'text-primary' : 'group-hover:text-foreground transition-colors'
                                )}
                            />
                            {!isCollapsed && (
                                <span className="ml-3 font-medium">{item.label}</span>
                            )}
                            {isCollapsed && isActive && (
                                <div className="absolute right-2 w-1 h-1 rounded-full bg-primary" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Upgrade Card */}
            <div className="p-4">
                <div className={cn(
                    'p-4 rounded-2xl bg-muted/40 border border-border relative overflow-hidden',
                    isCollapsed ? 'items-center justify-center text-center' : ''
                )}>
                    {!isCollapsed && (
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                                <Badge variant="secondary" className="bg-muted text-[10px] h-4">FREE</Badge>
                                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Current Plan</span>
                            </div>
                            <p className="text-sm font-semibold mb-3">Professionalize Your OS</p>
                            <Button size="sm" variant="gradient" className="w-full text-xs h-8">
                                Upgrade <TrendingUp className="ml-2" size={12} />
                            </Button>
                        </div>
                    )}
                    {isCollapsed && (
                        <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/10">
                            <TrendingUp size={20} />
                        </Button>
                    )}
                    <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-primary/5 blur-2xl rounded-full" />
                </div>
            </div>

            {/* Toggle Button */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -right-4 top-20 bg-card border border-border rounded-full p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-all z-20 shadow-md md:flex hidden"
            >
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
        </aside>
    );
}
