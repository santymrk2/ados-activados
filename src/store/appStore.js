import { atom, map, onMount } from 'nanostores';
import { getParticipants, getActivities, checkDatabaseConnection } from '../lib/db-utils';
import { syncTeamConstants } from '../lib/constants';

// Auth State
export const $isAuthenticated = atom(false);
export const $authLoading = atom(true);

// Database State
export const $participants = atom([]);
export const $activities = atom([]);
export const $dbLoading = atom(true);
export const $dbError = atom(null);
export const $dbConnected = atom(false);

// UI State
export const $showSettings = atom(false);

let isRefreshing = false;
let initialLoadDone = false;

export const checkDbConnection = async () => {
  try {
    await checkDatabaseConnection();
    $dbConnected.set(true);
    $dbError.set(null);
    return true;
  } catch (e) {
    console.error('DB Connection Error:', e);
    $dbConnected.set(false);
    $dbError.set(e);
    return false;
  }
};

export const refreshData = async (forceLoader = false) => {
  if (isRefreshing) return;

  // Only show the loading spinner on the very first load, or when explicitly forced
  if (!initialLoadDone || forceLoader) {
    $dbLoading.set(true);
  }

  isRefreshing = true;
  try {
    if (typeof window !== 'undefined') syncTeamConstants();
    const [p, a] = await Promise.all([getParticipants(), getActivities()]);
    $participants.set(p || []);
    $activities.set(a || []);
    $dbError.set(null);
    $dbConnected.set(true);
  } catch (e) {
    console.error('Error loading DB:', e);
    $dbError.set(e);
    $dbConnected.set(false);
  } finally {
    $dbLoading.set(false);
    isRefreshing = false;
    initialLoadDone = true;
  }
};

// Computed helper for Next IDs
export const getNextPid = () => {
  const p = $participants.get() || [];
  return Math.max(...p.map(x => x.id), 0) + 1;
};

export const getNextAid = () => {
  const a = $activities.get() || [];
  return Math.max(...a.map(x => x.id), 0) + 1;
};

// Initialize once on client
if (typeof window !== 'undefined') {
  setTimeout(async () => {
    const isConnected = await checkDbConnection();
    if (isConnected) {
      refreshData();
    }
  }, 100);
}
