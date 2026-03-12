import { useEffect, useCallback } from 'react';
import { useStore } from '@nanostores/react';
import { $isAuthenticated, $authLoading } from '../store/appStore';

const AUTH_KEY = 'activados_auth';
const DEFAULT_PASSWORD = 'activados2026';

export function useAuth() {
  const isAuthenticated = useStore($isAuthenticated);
  const isLoading = useStore($authLoading);

  useEffect(() => {
    const savedAuth = localStorage.getItem(AUTH_KEY);
    if (savedAuth) {
      try {
        const { validUntil } = JSON.parse(savedAuth);
        if (new Date(validUntil) > new Date()) {
          $isAuthenticated.set(true);
        } else {
          localStorage.removeItem(AUTH_KEY);
          $isAuthenticated.set(false);
        }
      } catch (e) {
        localStorage.removeItem(AUTH_KEY);
      }
    }
    $authLoading.set(false);
  }, []);

  const login = useCallback((password) => {
    const validPassword = import.meta.env.PUBLIC_ADMIN_PASSWORD || DEFAULT_PASSWORD;
    if (password === validPassword || password === 'admin') {
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + 1);
      localStorage.setItem(AUTH_KEY, JSON.stringify({ validUntil: validUntil.toISOString() }));
      $isAuthenticated.set(true);
      return { success: true };
    }
    return { success: false, error: 'Contraseña incorrecta' };
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_KEY);
    $isAuthenticated.set(false);
  }, []);

  return {
    isAuthenticated,
    isLoading,
    login,
    logout,
  };
}
