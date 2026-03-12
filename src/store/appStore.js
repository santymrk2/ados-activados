import { atom, map, onMount } from 'nanostores';
import { getParticipants, getActivities } from '../lib/db-utils';
import { SEED_PARTICIPANTS, syncTeamConstants } from '../lib/constants';

// Auth State
export const $isAuthenticated = atom(false);
export const $authLoading = atom(true);

// Database State
export const $participants = atom([]);
export const $activities = atom([]);
export const $dbLoading = atom(true);
export const $dbError = atom(null);

// UI State
export const $showSettings = atom(false);

let isRefreshing = false;

export const refreshData = async (forceLoader = false) => {
  if (isRefreshing) return;
  
  const hasData = $participants.get().length > 0 || $activities.get().length > 0;
  if (!hasData || forceLoader) {
    $dbLoading.set(true);
  }

  isRefreshing = true;
  try {
    if (typeof window !== 'undefined') syncTeamConstants();
    const [p, a] = await Promise.all([getParticipants(), getActivities()]);
    $participants.set(p || []);
    $activities.set(a || []);
    $dbError.set(null);
  } catch (e) {
    console.error('Error loading DB:', e);
    $dbError.set(e);
    if ($participants.get().length === 0) {
      $participants.set(SEED_PARTICIPANTS);
    }
  } finally {
    $dbLoading.set(false);
    isRefreshing = false;
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
  // Use a slight delay to not block the very first meaningful paint
  setTimeout(() => refreshData(), 100);
}
