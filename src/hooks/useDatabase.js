import { useEffect, useCallback, useMemo } from 'react';
import { useStore } from '@nanostores/react';
import { 
  $participants, 
  $activities, 
  $dbLoading, 
  $dbError,
  refreshData
} from '../store/appStore';
import {
  saveActivity as dbSaveActivity,
  deleteActivity as dbDeleteActivity,
  saveParticipant as dbSaveParticipant,
  deleteParticipant as dbDeleteParticipant,
  quickUpdateActivity,
} from '../lib/db-utils';

export function useDatabase() {
  const participants = useStore($participants);
  const activities = useStore($activities);
  const isLoading = useStore($dbLoading);
  const error = useStore($dbError);

  const refresh = useCallback(async () => {
    await refreshData();
  }, []);

  const saveActivity = useCallback(async (activity, isNew) => {
    const id = await dbSaveActivity(activity, isNew);
    await refreshData();
    return id;
  }, []);

  const deleteActivity = useCallback(async (id) => {
    await dbDeleteActivity(id);
    await refreshData();
  }, []);

  const quickUpdate = useCallback(async (activityId, type, data) => {
    await quickUpdateActivity(activityId, type, data);
    await refreshData();
  }, []);

  const saveParticipant = useCallback(async (participant, isNew, invitadorId = null) => {
    const id = await dbSaveParticipant(participant, isNew, invitadorId);
    await refreshData();
    return id;
  }, []);

  const deleteParticipant = useCallback(async (id) => {
    await dbDeleteParticipant(id);
    await refreshData();
  }, []);

  const db = useMemo(() => ({
    participants,
    activities,
    nextPid: Math.max(...participants.map(p => p.id), 0) + 1,
    nextAid: Math.max(...activities.map(a => a.id), 0) + 1,
  }), [participants, activities]);

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
