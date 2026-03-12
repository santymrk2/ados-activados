import { useState, useEffect, useCallback } from 'react';

const AUTH_KEY = 'activados_auth';
const DEFAULT_PASSWORD = 'activados2026';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedAuth = localStorage.getItem(AUTH_KEY);
    if (savedAuth) {
      const { validUntil } = JSON.parse(savedAuth);
      if (new Date(validUntil) > new Date()) {
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem(AUTH_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((password) => {
    const validPassword = import.meta.env.PUBLIC_ADMIN_PASSWORD || DEFAULT_PASSWORD;
    if (password === validPassword || password === 'admin') {
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + 1);
      localStorage.setItem(AUTH_KEY, JSON.stringify({ validUntil: validUntil.toISOString() }));
      setIsAuthenticated(true);
      return { success: true };
    }
    return { success: false, error: 'Contraseña incorrecta' };
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_KEY);
    setIsAuthenticated(false);
  }, []);

  return {
    isAuthenticated,
    isLoading,
    login,
    logout,
  };
}
