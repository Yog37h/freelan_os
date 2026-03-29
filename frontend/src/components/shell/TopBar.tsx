

import * as React from 'react';
import { Link } from '@/components/router/Link';
import { Search, Bell, Plus, Settings, LogOut, CreditCard, User as UserIcon } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import {
    mockNotifications
} from '@/mock/notifications';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/cn';
import { api } from '@/lib/axios';

export function TopBar() {
    const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
    const [isProfileOpen, setIsProfileOpen] = React.useState(false);
    const pathname = window.location.pathname;

    const { user, clearAuth } = useAuthStore();

    const handleLogout = async () => {
        try {
            await api.post('/api/auth/logout');
            clearAuth();
            window.location.href = '/login';
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const getPageTitle = () => {
        switch (pathname) {
            case '/': return 'Home';
            case '/dashboard': return 'Home';
            case '/projects': return 'Projects';
            case '/timeline': return 'Timeline';
            case '/client-calls': return 'Client Calls';
            case '/clients': return 'Client Updates';
            case '/client-updates': return 'Client Updates';
            case '/approvals': return 'Approvals';
            case '/payments': return 'Payments';
            case '/wrapped': return 'SaaS Wrapped';
            case '/settings': return 'Settings';
            case '/profile': return 'Profile';
            default: return 'Dashboard';
        }
    };

    const displayName = user?.name || user?.email?.split('@')[0] || 'User';
    const initials = displayName.charAt(0) || 'U';

    return (
        <header className="h-20 border-b border-white/5 bg-background/50 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-40">
            <div className="flex flex-col">
                <h1 className="text-xl font-black tracking-tighter uppercase italic gradient-blue bg-clip-text text-transparent">{getPageTitle()}</h1>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Command Center</p>
            </div>

            <div className="flex-1 max-w-md mx-8 hidden md:block">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                    <Input
                        placeholder="Search workspace..."
                        className="pl-10 bg-white/5 border-none group-focus-within:bg-white/10 transition-all rounded-xl w-full"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                {/* Notifications */}
                <div className="relative">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full relative border border-white/5 bg-white/5 hover:bg-white/10"
                        onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                    >
                        <Bell size={18} />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full ring-2 ring-background animate-pulse" />
                    </Button>

                    {isNotificationsOpen && (
                        <div className="absolute right-0 mt-4 w-80 glass-panel rounded-2xl p-4 shadow-2xl z-50 animate-in fade-in zoom-in duration-200 border border-white/10">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-sm">Notifications</h3>
                                <button className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline">Mark all read</button>
                            </div>
                            <div className="space-y-4">
                                {mockNotifications.map(notification => (
                                    <div key={notification.id} className="flex gap-3 items-start pb-3 border-b border-white/5 last:border-0">
                                        <div className={cn(
                                            "w-1.5 h-1.5 rounded-full mt-2 shrink-0",
                                            notification.isRead ? "bg-transparent" : "bg-primary"
                                        )} />
                                        <div>
                                            <p className="text-xs font-bold leading-tight">{notification.title}</p>
                                            <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{notification.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Profile Dropdown */}
                <div className="relative">
                    <button
                        className="flex items-center gap-3 p-1 rounded-full hover:bg-white/5 transition-all text-left"
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                    >
                        <Avatar initials={initials.toUpperCase()} className="w-9 h-9 border-2 border-primary/20" />
                        <div className="hidden lg:block pr-2">
                            <p className="text-sm font-bold leading-tight">{displayName}</p>
                            <p className="text-[9px] text-muted-foreground uppercase tracking-[0.2em] font-black leading-tight">Pro</p>
                        </div>
                    </button>

                    {isProfileOpen && (
                        <div className="absolute right-0 mt-4 w-64 glass-panel rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in zoom-in duration-200 border border-white/10">
                            <div className="p-4 border-b border-white/5">
                                <p className="text-sm font-black uppercase tracking-tighter truncate">{displayName}</p>
                                <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
                            </div>
                            <div className="py-2">
                                <Link href="/profile" onClick={() => setIsProfileOpen(false)}>
                                    <button className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-white/5 rounded-xl transition-colors">
                                        <UserIcon size={16} className="text-primary" /> Profile
                                    </button>
                                </Link>
                                <button className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-white/5 rounded-xl transition-colors">
                                    <CreditCard size={16} /> Billing
                                </button>
                                <Link href="/settings" onClick={() => setIsProfileOpen(false)}>
                                    <button className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-white/5 rounded-xl transition-colors">
                                        <Settings size={16} /> Settings
                                    </button>
                                </Link>
                            </div>
                            <div className="pt-2 border-t border-white/5">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-black uppercase tracking-[0.2em] text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors"
                                >
                                    <LogOut size={16} /> Logout
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <Link href="/projects/new?step=1">
                    <Button variant="gradient" size="sm" className="hidden sm:flex rounded-xl font-bold ml-2 h-10 px-6 uppercase tracking-widest text-[10px]">
                        <Plus size={18} className="mr-2" /> New Project
                    </Button>
                </Link>
            </div>
        </header>
    );
}

