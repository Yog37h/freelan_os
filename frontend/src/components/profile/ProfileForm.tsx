'use client';

import * as React from 'react';
import {
    User,
    Briefcase,
    ShieldCheck,
    Plus,
    X,
    Upload,
    Linkedin,
    Github,
    Instagram,
    Facebook,
    Globe,
    Smartphone,
    Mail,
    Calendar,
    Save,
    RotateCcw
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/cn';

interface ProfileFormProps {
    initialData: any;
    onSave: (data: any) => Promise<void>;
    isSaving: boolean;
    onCancel: () => void;
}

export function ProfileForm({ initialData, onSave, isSaving, onCancel }: ProfileFormProps) {
    const [formData, setFormData] = React.useState(initialData || {});
    const [newSkill, setNewSkill] = React.useState('');

    React.useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleSocialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({
            ...prev,
            social_links: {
                ...(prev.social_links || {}),
                [name]: value
            }
        }));
    };

    const addSkill = () => {
        if (newSkill && !(formData.skills || []).includes(newSkill)) {
            setFormData((prev: any) => ({
                ...prev,
                skills: [...(prev.skills || []), newSkill]
            }));
            setNewSkill('');
        }
    };

    const removeSkill = (skill: string) => {
        setFormData((prev: any) => ({
            ...prev,
            skills: (prev.skills || []).filter((s: string) => s !== skill)
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    const handleDateChange = (date: Date | null) => {
        setFormData((prev: any) => ({
            ...prev,
            date_of_birth: date ? date.toISOString().split('T')[0] : null
        }));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-12">
            {/* Section 1: Essentials */}
            <section className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center border border-blue-600/20">
                        <User className="text-blue-600" size={20} />
                    </div>
                    <h3 className="text-xl font-bold uppercase tracking-tight">Essentials</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-6 p-6 rounded-2xl bg-white/5 border border-white/10 group hover:border-white/20 transition-all">
                            <div className="w-20 h-20 rounded-2xl bg-zinc-800 flex items-center justify-center border border-white/10 overflow-hidden relative group cursor-pointer">
                                {formData.avatar_url ? (
                                    <img src={formData.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <Upload className="w-6 h-6 text-zinc-500 group-hover:text-primary transition-all" />
                                )}
                                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" />
                            </div>
                            <div>
                                <h4 className="font-bold">Profile Photo</h4>
                                <p className="text-xs text-muted-foreground mt-1">Recommended: Square JPEG/PNG, min 400x400px.</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Full Name</label>
                            <Input
                                name="full_name"
                                value={formData.full_name || ''}
                                onChange={handleChange}
                                placeholder="e.g. John Doe"
                                className="bg-white/5 border-white/10 h-12 rounded-xl"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Public Username</label>
                            <Input
                                name="username"
                                value={formData.username || ''}
                                onChange={handleChange}
                                placeholder="johndoe_pro"
                                className="bg-white/5 border-white/10 h-12 rounded-xl"
                            />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Professional Headline</label>
                            <Input
                                name="headline"
                                value={formData.headline || ''}
                                onChange={handleChange}
                                placeholder="e.g. Senior Product Designer"
                                className="bg-white/5 border-white/10 h-12 rounded-xl"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Bio / Story</label>
                            <textarea
                                name="bio"
                                value={formData.bio || ''}
                                onChange={handleChange}
                                placeholder="Share your journey..."
                                className="w-full min-h-[160px] bg-white/5 border border-white/10 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Section 2: Skills & Credibility */}
            <section className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-purple-600/10 flex items-center justify-center border border-purple-600/20">
                        <Briefcase className="text-purple-600" size={20} />
                    </div>
                    <h3 className="text-xl font-bold uppercase tracking-tight">Skills & Credibility</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Skills & Tools</label>
                            <div className="flex gap-2">
                                <Input
                                    value={newSkill}
                                    onChange={(e) => setNewSkill(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                                    placeholder="Add skill..."
                                    className="bg-white/5 border-white/10 h-12 rounded-xl"
                                />
                                <Button type="button" onClick={addSkill} className="h-12 w-12 rounded-xl bg-white/5 border-white/10 hover:bg-white/10">
                                    <Plus size={20} />
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {(formData.skills || []).map((skill: string) => (
                                    <span key={skill} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                                        {skill}
                                        <X size={14} className="cursor-pointer hover:text-white" onClick={() => removeSkill(skill)} />
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Experience Level</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['Entry', 'Intermediate', 'Expert'].map((level) => (
                                    <button
                                        key={level}
                                        type="button"
                                        onClick={() => setFormData((prev: any) => ({ ...prev, experience_level: level }))}
                                        className={cn(
                                            "h-12 rounded-xl border-2 text-xs font-black uppercase tracking-widest transition-all",
                                            formData.experience_level === level
                                                ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                                                : "bg-white/5 border-white/5 text-muted-foreground hover:border-white/20"
                                        )}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                            <h4 className="font-bold text-amber-200 mb-2">Education & Certifications</h4>
                            <p className="text-xs text-amber-200/50 leading-relaxed mb-4">
                                Add your academic background and professional certifications to build more trust with clients.
                            </p>
                            <Button type="button" variant="outline" size="sm" className="w-full text-[10px] font-black uppercase tracking-widest border-amber-500/20 text-amber-200/80">
                                Managed in Extended Profile
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Section 3: Verification & Social */}
            <section className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-green-600/10 flex items-center justify-center border border-green-600/20">
                        <ShieldCheck className="text-green-600" size={20} />
                    </div>
                    <h3 className="text-xl font-bold uppercase tracking-tight">Verification & Social</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Date of Birth</label>
                                <div className="relative">
                                    <DatePicker
                                        selected={formData.date_of_birth ? new Date(formData.date_of_birth) : null}
                                        onChange={handleDateChange}
                                        maxDate={new Date()}
                                        showYearDropdown
                                        placeholderText="YYYY-MM-DD"
                                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                    />
                                    <Calendar size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Phone Number</label>
                                <Input
                                    name="phone_number"
                                    value={formData.phone_number || ''}
                                    onChange={handleChange}
                                    placeholder="+1 (555) 000-0000"
                                    className="bg-white/5 border-white/10 h-12 rounded-xl"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email (Readonly)</label>
                            <div className="relative">
                                <Input
                                    value={formData.email || ''}
                                    readOnly
                                    className="bg-white/5 border-white/5 text-muted-foreground/50 h-12 rounded-xl cursor-not-allowed pl-10"
                                />
                                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/30" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Social Presence</label>
                        <div className="space-y-3">
                            {[
                                { name: 'linkedin', icon: Linkedin, placeholder: 'LinkedIn URL' },
                                { name: 'github', icon: Github, placeholder: 'GitHub URL' },
                                { name: 'instagram', icon: Instagram, placeholder: 'Instagram URL' },
                                { name: 'facebook', icon: Facebook, placeholder: 'Facebook URL' }
                            ].map((social) => (
                                <div key={social.name} className="relative">
                                    <social.icon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        name={social.name}
                                        value={(formData.social_links || {})[social.name] || ''}
                                        onChange={handleSocialChange}
                                        placeholder={social.placeholder}
                                        className="bg-white/5 border-white/10 h-12 rounded-xl pl-12"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-8 border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center text-center gap-4 bg-white/[0.02]">
                    <div className="p-3 bg-white/5 rounded-full ring-8 ring-white/[0.01]">
                        <Globe className="w-6 h-6 text-muted-foreground/30" />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm">Identity Verification (KYC)</h4>
                        <p className="text-xs text-muted-foreground max-w-sm mt-1">Verification is currently automatic via your authenticated email. Document upload will be required for large payouts.</p>
                    </div>
                </div>
            </section>

            {/* Actions */}
            <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row gap-4 justify-end">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    className="rounded-xl h-14 px-8 font-bold text-xs uppercase tracking-widest"
                >
                    <RotateCcw size={18} className="mr-2" /> Revert Changes
                </Button>
                <Button
                    type="submit"
                    variant="gradient"
                    disabled={isSaving}
                    className="rounded-xl h-14 px-12 font-black text-xs uppercase tracking-widest shadow-2xl shadow-primary/20"
                >
                    {isSaving ? 'Processing...' : (
                        <>
                            <Save size={18} className="mr-2" /> Save Profile
                        </>
                    )}
                </Button>
            </div>

            <style>{`
                .react-datepicker-wrapper { width: 100%; }
                .react-datepicker {
                    background-color: #0f0f0f !important;
                    border: 1px solid rgba(255, 255, 255, 0.1) !important;
                    border-radius: 1rem !important;
                    color: white !important;
                    font-family: inherit !important;
                    padding: 0.5rem !important;
                }
                .react-datepicker__header {
                    background-color: transparent !important;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
                }
                .react-datepicker__current-month, .react-datepicker__day-name {
                    color: rgba(255, 255, 255, 0.5) !important;
                    font-size: 0.7rem !important;
                    text-transform: uppercase !important;
                    font-weight: 800 !important;
                    letter-spacing: 0.05em !important;
                }
                .react-datepicker__day {
                    color: white !important;
                    border-radius: 0.5rem !important;
                }
                .react-datepicker__day:hover {
                    background-color: rgba(255, 255, 255, 0.1) !important;
                }
                .react-datepicker__day--selected {
                    background-color: #2563eb !important;
                    font-weight: 800 !important;
                }
            `}</style>
        </form>
    );
}
