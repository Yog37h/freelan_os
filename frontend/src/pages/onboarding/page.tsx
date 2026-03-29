// ✅ VERIFIED: Restored onboarding to a normal profile flow with no Google requirement and a PATCH-based save. Manual test: sign up, complete onboarding, and confirm the profile saves with onboarding_completed=true before reaching the dashboard.
import * as React from 'react';
import { useAuthStore } from '../../store/auth.store';
import { api } from '@/lib/axios';
import { useAppNavigate } from '@/lib/navigation';
import { ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';

const steps = ['Essentials', 'Professional', 'Verification'] as const;

export default function OnboardingPage() {
  const router = useAppNavigate();
  const { user } = useAuthStore();
  const [currentStep, setCurrentStep] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    full_name: '',
    username: '',
    headline: '',
    bio: '',
    experience_level: 'Entry',
    phone_number: '',
    skills: [] as string[],
    skillInput: '',
  });

  React.useEffect(() => {
    if (!user) {
      router.navigate({ to: '/login' });
      return;
    }

    setFormData((current) => ({
      ...current,
      full_name: current.full_name || user.name || '',
      username: current.username || user.name || '',
    }));
  }, [router, user]);

  const addSkill = () => {
    const nextSkill = formData.skillInput.trim();
    if (!nextSkill || formData.skills.includes(nextSkill)) {
      return;
    }

    setFormData((current) => ({
      ...current,
      skills: [...current.skills, nextSkill],
      skillInput: '',
    }));
  };

  const removeSkill = (skill: string) => {
    setFormData((current) => ({
      ...current,
      skills: current.skills.filter((entry) => entry !== skill),
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.patch('/api/profile', {
        full_name: formData.full_name,
        username: formData.username,
        headline: formData.headline,
        bio: formData.bio,
        experience_level: formData.experience_level,
        phone_number: formData.phone_number,
        skills: formData.skills,
        onboarding_completed: true,
      });

      router.navigate({ to: '/dashboard' });
    } catch (error: any) {
      console.error('Error saving profile:', error);
      alert(
        error.response?.data?.error?.message ||
          error.message ||
          'Error saving profile. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6 text-white md:p-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-12 flex justify-between gap-3">
          {steps.map((step, index) => (
            <div key={step} className="flex-1">
              <div className={`mb-2 h-1 rounded-full ${currentStep >= index + 1 ? 'bg-blue-500' : 'bg-white/10'}`} />
              <p className={`text-xs font-black uppercase tracking-widest ${currentStep >= index + 1 ? 'text-blue-400' : 'text-zinc-600'}`}>
                Step 0{index + 1}
              </p>
              <p className="text-sm font-bold">{step}</p>
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-white/5 bg-zinc-900/40 p-8 shadow-2xl backdrop-blur-2xl md:p-12">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold">The Essentials</h2>
                <p className="mt-2 text-zinc-500">Set up the public profile clients will see first.</p>
              </div>
              <label className="block space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Full Name</span>
                <input value={formData.full_name} onChange={(e) => setFormData((c) => ({ ...c, full_name: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4" />
              </label>
              <label className="block space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Public Username</span>
                <input value={formData.username} onChange={(e) => setFormData((c) => ({ ...c, username: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4" />
              </label>
              <label className="block space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Headline</span>
                <input value={formData.headline} onChange={(e) => setFormData((c) => ({ ...c, headline: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4" />
              </label>
              <label className="block space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Bio</span>
                <textarea value={formData.bio} onChange={(e) => setFormData((c) => ({ ...c, bio: e.target.value }))} rows={5} className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4" />
              </label>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold">Professional Edge</h2>
                <p className="mt-2 text-zinc-500">Capture your skills and working level.</p>
              </div>
              <label className="block space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Experience Level</span>
                <select value={formData.experience_level} onChange={(e) => setFormData((c) => ({ ...c, experience_level: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
                  <option value="Entry">Entry</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Expert">Expert</option>
                </select>
              </label>
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Skills</span>
                <div className="flex gap-3">
                  <input value={formData.skillInput} onChange={(e) => setFormData((c) => ({ ...c, skillInput: e.target.value }))} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }} className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-5 py-4" placeholder="React, Figma, SEO..." />
                  <button type="button" onClick={addSkill} className="rounded-2xl bg-blue-600 px-5 py-4 font-bold">Add</button>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {formData.skills.map((skill) => (
                    <button key={skill} type="button" onClick={() => removeSkill(skill)} className="rounded-xl border border-blue-600/20 bg-blue-600/10 px-3 py-2 text-xs font-bold text-blue-400">
                      {skill} ×
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold">Identity & Trust</h2>
                <p className="mt-2 text-zinc-500">Add the last contact details before entering the dashboard.</p>
              </div>
              <label className="block space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Email</span>
                <input value={user.email || ''} readOnly className="w-full cursor-not-allowed rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-zinc-500" />
              </label>
              <label className="block space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Phone Number</span>
                <input value={formData.phone_number} onChange={(e) => setFormData((c) => ({ ...c, phone_number: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4" placeholder="+91 98765 43210" />
              </label>
            </div>
          )}

          <div className="mt-10 flex items-center justify-between">
            <button type="button" onClick={() => setCurrentStep((step) => Math.max(step - 1, 1))} disabled={currentStep === 1} className={`flex items-center gap-2 font-bold ${currentStep === 1 ? 'pointer-events-none opacity-0' : 'text-zinc-400 hover:text-white'}`}>
              <ChevronLeft size={18} />
              Back
            </button>

            {currentStep < 3 ? (
              <button type="button" onClick={() => setCurrentStep((step) => Math.min(step + 1, 3))} className="flex items-center gap-2 rounded-2xl bg-white px-8 py-4 font-black text-black">
                Continue
                <ChevronRight size={18} />
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={loading} className="flex items-center gap-2 rounded-2xl bg-blue-600 px-8 py-4 font-black text-white disabled:opacity-50">
                {loading ? 'Finalizing...' : 'Launch Dashboard'}
                <ShieldCheck size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
