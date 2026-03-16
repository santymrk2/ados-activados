import { useState, useCallback } from 'react';
import { useStore } from '@nanostores/react';
import { useAuth } from './useAuth';
import { useDatabase } from './useDatabase';
import { $showSettings, $dbError, $dbConnected } from '../store/appStore';

export function useApp() {
  const showSettings = useStore($showSettings);
  const setShowSettings = (val) => $showSettings.set(val);
  const dbError = useStore($dbError);
  const dbConnected = useStore($dbConnected);
  
  const { isAuthenticated, isLoading: authLoading, login, logout: authLogout } = useAuth();
  const { db, isLoading: dbLoading, saveActivity, deleteActivity, quickUpdate, saveParticipant, deleteParticipant, refresh } = useDatabase();

  const isLoading = authLoading || dbLoading;

  const logout = useCallback(() => {
    authLogout();
    setShowSettings(false);
  }, [authLogout]);

  return {
    db,
    isLoading,
    isAuthenticated,
    login,
    logout,
    showSettings,
    setShowSettings,
    saveActivity,
    deleteActivity,
    quickUpdate,
    saveParticipant,
    deleteParticipant,
    refresh,
    dbError,
    dbConnected,
  };
}
