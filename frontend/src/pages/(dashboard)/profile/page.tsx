

import * as React from 'react';
import { ChevronLeft, X } from 'lucide-react';
import { Link } from '@/components/router/Link';
import { cn } from '@/lib/cn';
import { getMyProfile, updateMyProfile } from '@/lib/api/profileApi';
import { ProfileForm } from '@/components/profile/ProfileForm';

export default function ProfilePage() {
    const [profile, setProfile] = React.useState<any>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isSaving, setIsSaving] = React.useState(false);
    const [notification, setNotification] = React.useState<{ type: 'success' | 'error', message: string } | null>(null);

    const showNotification = (type: 'success' | 'error', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 5000);
    };

    const loadProfile = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const { data, error } = await getMyProfile();
            if (error) {
                console.error('Error fetching profile:', error);
            } else {
                setProfile(data);
            }
        } catch (err) {
            console.error('Failed to load profile:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    React.useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    const handleSave = async (updatedData: any) => {
        setIsSaving(true);
        try {
            const { data, error } = await updateMyProfile(updatedData);
            if (error) {
                showNotification('error', error.message || 'Failed to update profile');
            } else {
                setProfile(data);
                showNotification('success', 'Profile updated successfully');
            }
        } catch (err) {
            showNotification('error', 'An unexpected error occurred');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-8 animate-pulse">
                <div className="flex items-center gap-4 h-10 w-48 bg-muted/20 rounded-xl" />
                <div className="h-[600px] bg-muted/20 rounded-[2rem]" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
                <Link href="/dashboard" className="inline-flex items-center text-sm font-bold text-muted-foreground hover:text-primary transition-colors group">
                    <ChevronLeft size={18} className="mr-1 group-hover:-translate-x-1 transition-transform" />
                    BACK TO DASHBOARD
                </Link>
                <h1 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground/50">User Profile Settings</h1>
            </div>

            {notification && (
                <div className={cn(
                    "p-4 rounded-2xl border flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300",
                    notification.type === 'success' ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                )}>
                    <p className="text-xs font-bold uppercase tracking-widest">{notification.message}</p>
                    <X size={16} className="cursor-pointer" onClick={() => setNotification(null)} />
                </div>
            )}

            <div className="glass-panel rounded-[2rem] border-white/5 shadow-2xl overflow-hidden">
                <div className="p-8 md:p-12">
                    <div className="flex items-start justify-between mb-12">
                        <div>
                            <h2 className="text-4xl font-black uppercase tracking-tighter mb-2 italic gradient-blue bg-clip-text text-transparent">Profile</h2>
                            <p className="text-muted-foreground">Manage your personal and professional identity.</p>
                        </div>
                    </div>

                    <ProfileForm
                        initialData={profile}
                        onSave={handleSave}
                        isSaving={isSaving}
                        onCancel={loadProfile}
                    />
                </div>
            </div>
        </div>
    );
}
