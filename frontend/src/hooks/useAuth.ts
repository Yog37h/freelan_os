import { useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/auth.store';
import { api } from '../lib/axios';
import { API_BASE_URL } from '../lib/config';

export function useAuth() {
  const { user, isAuthenticated, isLoading, setLoading, setAuth, clearAuth } = useAuthStore();

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      try {
        const response = await axios.post(
          `${API_BASE_URL}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const { accessToken, user } = response.data;
        if (accessToken) {
          setAuth(accessToken, user);
        } else {
          clearAuth();
        }
      } catch (error) {
        clearAuth();
      } finally {
        setLoading(false);
      }
    };
    
    // Initial fetch to load auth state from HTTP-only cookie
    initAuth();
  }, [setAuth, clearAuth, setLoading]);

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch {
      // Ignore errs
    } finally {
      clearAuth();
      window.location.href = '/login';
    }
  };

  return { user, isAuthenticated, isLoading, logout };
}
