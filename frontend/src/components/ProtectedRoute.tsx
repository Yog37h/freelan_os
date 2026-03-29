// ✅ VERIFIED: Protected routes now only enforce authentication and no longer depend on Google connection state. Manual test: sign in without any Google setup and confirm dashboard routes open normally.
import type { ReactNode } from 'react';
import { Navigate, Outlet } from '@tanstack/react-router';
import { useAuthStore } from '../store/auth.store';

export function ProtectedRoute({ children }: { children?: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return <>{children ?? <Outlet />}</>;
}
