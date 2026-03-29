

import * as React from 'react';
import { api } from '@/lib/axios';
import { API_BASE_URL } from '@/lib/config';
import { useAuthStore } from '../../store/auth.store';
import { useAppNavigate } from '@/lib/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Github, Loader2, Mail, Lock, User, ArrowRight } from 'lucide-react';

function AuthContent() {
    const router = useAppNavigate();
    const { setAuth } = useAuthStore();
    const searchParams = new URLSearchParams(window.location.search);
    const pathname = window.location.pathname;

    const [mode, setMode] = React.useState<'signin' | 'signup'>(
        pathname === '/register' ? 'signup' : ((searchParams.get('mode') as 'signin' | 'signup') || 'signin')
    );
    const [isLoading, setIsLoading] = React.useState(false);
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [username, setUsername] = React.useState('');
    const [error, setError] = React.useState<string | null>(null);

    const handleGoogleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // OAuth flow logic
        window.location.href = `${API_BASE_URL}/api/auth/google`;
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            if (mode === 'signup') {
                const res = await api.post('/api/auth/register', { email, password, username });
                if (res.data?.accessToken) {
                    setAuth(res.data.accessToken, res.data.user ?? { id: 'auth-user', email, name: username });
                    router.navigate({ to: '/onboarding' });
                }
            } else {
                const res = await api.post('/api/auth/login', { email, password });
                if (res.data?.accessToken) {
                    setAuth(res.data.accessToken, res.data.user ?? { id: 'auth-user', email });
                    router.navigate({ to: '/dashboard' });
                }
            }
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Auth failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-zinc-900/50 border border-white/5 backdrop-blur-xl rounded-3xl p-8 shadow-2xl">
            <div className="text-center mb-10">
                <h1 className="text-3xl font-bold bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">
                    {mode === 'signin' ? 'Welcome Back' : 'Join FreelanceOS'}
                </h1>
                <p className="text-zinc-500 mt-2">
                    {mode === 'signin' ? 'Login to your dashboard' : 'Create your pro freelancer account'}
                </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
                <AnimatePresence mode="wait">
                    {mode === 'signup' && (
                        <motion.div
                            key="username"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-2"
                        >
                            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider ml-1">Username</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-blue-600 focus:outline-none transition-all placeholder:text-zinc-700 font-medium"
                                    placeholder="designpro_24"
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider ml-1">Email Address</label>
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-blue-600 focus:outline-none transition-all placeholder:text-zinc-700 font-medium"
                            placeholder="you@example.com"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider ml-1">Password</label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-blue-600 focus:outline-none transition-all placeholder:text-zinc-700 font-medium"
                            placeholder="••••••••"
                        />
                    </div>
                </div>

                {error && (
                    <p className="text-red-400 text-sm mt-2 ml-1">{error}</p>
                )}

                <button
                    disabled={isLoading}
                    className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 mt-6"
                >
                    {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            <span>{mode === 'signin' ? 'Login' : 'Create Account'}</span>
                            <ArrowRight className="w-4 h-4" />
                        </>
                    )}
                </button>
            </form>

            <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/5" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[#0a0a0a] px-2 text-zinc-500 px-4">Or continue with</span>
                </div>
            </div>

            <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full bg-white/5 border border-white/10 py-3 rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-3 font-medium"
            >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                    />
                    <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                    />
                    <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                        fill="#FBBC05"
                    />
                    <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.18-4.53z"
                        fill="#EA4335"
                    />
                </svg>
                <span>Google</span>
            </button>

            <p className="text-center text-zinc-500 text-sm mt-8">
                {mode === 'signin' ? (
                    <>
                        Don't have an account?{' '}
                        <button
                            onClick={() => setMode('signup')}
                            className="text-white font-semibold hover:underline"
                        >
                            Create one
                        </button>
                    </>
                ) : (
                    <>
                        Already have an account?{' '}
                        <button
                            onClick={() => setMode('signin')}
                            className="text-white font-semibold hover:underline"
                        >
                            Login
                        </button>
                    </>
                )}
            </p>
        </div>
    );
}

export default function AuthPage() {
    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md z-10"
            >
                <React.Suspense fallback={<div className="p-8 text-center animate-pulse text-zinc-500">Loading...</div>}>
                    <AuthContent />
                </React.Suspense>
            </motion.div>
        </div>
    );
}
