

import * as React from 'react'
import { useAuthStore } from '../store/auth.store';
import { useAppNavigate } from '@/lib/navigation';
import { motion } from 'framer-motion'
import { Rocket, Shield, Zap, ArrowRight, LogIn } from 'lucide-react'

export default function LandingPage() {
  const router = useAppNavigate()
  const { user, isAuthenticated, isLoading } = useAuthStore()

  React.useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && user) {
        // Assume user is fully matched to dashboard
        router.navigate({ to: '/dashboard' });
      }
    }
  }, [isAuthenticated, isLoading, user, router])

  if (isLoading) return null // Avoid flickering

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6 overflow-hidden relative">
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-4xl text-center z-10"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm">
          <Zap className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-blue-100">The Ultimate Operating System for Freelancers</span>
        </div>

        <h1 className="text-6xl md:text-8xl font-bold tracking-tight mb-8 bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent italic">
          FreelanceOS
        </h1>

        <p className="text-xl md:text-2xl text-zinc-400 mb-12 max-w-2xl mx-auto leading-relaxed">
          Manage your projects, payments, and profile with professional-grade tools built for the modern independent worker.
        </p>

        <div className="flex flex-col md:flex-row items-center justify-center gap-6">
          <button
            onClick={() => router.navigate({ to: '/login' })}
            className="group relative px-8 py-4 bg-white text-black font-extrabold rounded-2xl hover:bg-zinc-200 transition-all duration-300 flex items-center gap-2 overflow-hidden shadow-[0_0_20px_rgba(255,255,255,0.3)]"
          >
            <span>Get Started</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={() => router.navigate({ to: '/login' })}
            className="group px-8 py-4 bg-white/5 border border-white/10 text-white font-bold rounded-2xl hover:bg-white/10 transition-all duration-300 flex items-center gap-2 backdrop-blur-md"
          >
            <LogIn className="w-5 h-5 text-zinc-500 group-hover:text-white transition-colors" />
            <span>Login</span>
          </button>
        </div>

        <div className="flex items-center justify-center gap-8 mt-16 text-zinc-600">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span className="text-sm font-medium">Enterprise Security</span>
          </div>
          <div className="flex items-center gap-2">
            <Rocket className="w-4 h-4" />
            <span className="text-sm font-medium">Built for Speed</span>
          </div>
        </div>
      </motion.div>

      {/* Floating Elements Mockup */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-10 left-10 text-zinc-800 pointer-events-none select-none font-mono"
      >
        <code className="text-[10px] leading-tight">
          system.init('freelance-os');
          <br />auth.provider('jwt');
          <br />ui.theme('premium-dark');
          <br />status.loading('ready');
        </code>
      </motion.div>
    </div>
  )
}
