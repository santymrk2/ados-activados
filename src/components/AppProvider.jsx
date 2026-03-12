import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useDatabase } from '../hooks/useDatabase';

const AppContext = createContext(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export function AppProvider({ children }) {
  const [showSettings, setShowSettings] = useState(false);
  
  const { isAuthenticated, isLoading: authLoading, login, logout } = useAuth();
  const { db, isLoading: dbLoading, saveActivity, deleteActivity, quickUpdate, saveParticipant, deleteParticipant, refresh } = useDatabase();

  const isLoading = authLoading || dbLoading;

  const handleLogout = useCallback(() => {
    logout();
    setShowSettings(false);
  }, [logout]);

  const value = {
    db,
    isLoading,
    isAuthenticated,
    login,
    logout: handleLogout,
    showSettings,
    setShowSettings,
    saveActivity,
    deleteActivity,
    quickUpdate,
    saveParticipant,
    deleteParticipant,
    refresh,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
