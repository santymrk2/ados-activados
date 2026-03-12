import { useState, useEffect, useCallback } from 'react';
import {
  getParticipants,
  getActivities,
  saveActivity as dbSaveActivity,
  deleteActivity as dbDeleteActivity,
  saveParticipant as dbSaveParticipant,
  deleteParticipant as dbDeleteParticipant,
  quickUpdateActivity,
} from '../lib/db-utils';
import { SEED_PARTICIPANTS } from '../lib/constants';

export function useDatabase() {
  const [participants, setParticipants] = useState([]);
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const [p, a] = await Promise.all([getParticipants(), getActivities()]);
      setParticipants(p);
      setActivities(a);
      setError(null);
    } catch (e) {
      console.error('Error loading DB:', e);
      setError(e);
      setParticipants(SEED_PARTICIPANTS);
      setActivities([]);
    }
  }, []);

  useEffect(() => {
    initDB();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      refresh();
    }, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  async function initDB() {
    try {
      const [p, a] = await Promise.all([getParticipants(), getActivities()]);
      setParticipants(p);
      setActivities(a);
    } catch (e) {
      console.error('Error loading DB:', e);
      setParticipants(SEED_PARTICIPANTS);
      setActivities([]);
    }
    setIsLoading(false);
  }

  const saveActivity = useCallback(async (activity, isNew) => {
    const id = await dbSaveActivity(activity, isNew);
    if (isNew) await refresh();
    return id;
  }, [refresh]);

  const deleteActivity = useCallback(async (id) => {
    await dbDeleteActivity(id);
    await refresh();
  }, [refresh]);

  const quickUpdate = useCallback(async (activityId, type, data) => {
    await quickUpdateActivity(activityId, type, data);
  }, []);

  const saveParticipant = useCallback(async (participant, isNew, invitadorId = null) => {
    const id = await dbSaveParticipant(participant, isNew, invitadorId);
    await refresh();
    return id;
  }, [refresh]);

  const deleteParticipant = useCallback(async (id) => {
    await dbDeleteParticipant(id);
    await refresh();
  }, [refresh]);

  const db = {
    participants,
    activities,
    nextPid: Math.max(...participants.map(p => p.id), 0) + 1,
    nextAid: Math.max(...activities.map(a => a.id), 0) + 1,
  };

  return {
    db,
    isLoading,
    error,
    refresh,
    saveActivity,
    deleteActivity,
    quickUpdate,
    saveParticipant,
    deleteParticipant,
  };
}
