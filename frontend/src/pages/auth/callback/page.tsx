import React, { useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useAppNavigate } from '@/lib/navigation';

function decodeAccessToken(token: string) {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(window.atob(normalized));
    return decoded as { sub?: string; email?: string };
  } catch {
    return null;
  }
}

export default function AuthCallbackPage() {
  const { setAuth } = useAuthStore();
  const navigate = useAppNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      const decoded = decodeAccessToken(token);
      setAuth(token, {
        id: decoded?.sub || 'auth-user',
        email: decoded?.email || 'user@example.com',
        name: decoded?.email?.split('@')[0] || 'User',
      });
      window.history.replaceState({}, '', '/dashboard');
      navigate.navigate({ to: '/dashboard', replace: true });
    } else {
      navigate.navigate({ to: '/login', replace: true });
    }
  }, [setAuth, navigate]);

  return <div>Authenticating...</div>;
}
