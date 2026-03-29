import type { ReactNode } from 'react';
import { Navigate, Outlet } from '@tanstack/react-router';
import { useAuthStore } from '../store/auth.store';

export function PublicRoute({ children }: { children?: ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  return <>{children ?? <Outlet />}</>;
}
