import { SEED_PARTICIPANTS, newAct } from './constants';

const API_BASE = '/api';

export async function getParticipants() {
  const res = await fetch(`${API_BASE}/participants`);
  if (!res.ok) throw new Error('Failed to fetch participants');
  return res.json();
}

export async function getActivities() {
  const res = await fetch(`${API_BASE}/activities`);
  if (!res.ok) throw new Error('Failed to fetch activities');
  return res.json();
}

export async function saveActivity(activity, isNewProvided) {
  const isNew = isNewProvided !== undefined ? isNewProvided : !activity.id;
  const res = await fetch(`${API_BASE}/activities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: activity, isNew }),
  });
  if (!res.ok) throw new Error('Failed to save activity');
  const result = await res.json();
  return isNew ? result.id : activity.id;
}

export async function quickUpdateActivity(activityId: number, type: string, data: any) {
  const res = await fetch(`${API_BASE}/activities`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ activityId, type, data }),
  });
  if (!res.ok) throw new Error('Failed to quick update activity');
  return res.json();
}

export async function deleteActivity(id) {
  const res = await fetch(`${API_BASE}/activities`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error('Failed to delete activity');
}

export async function saveParticipant(participant, isNew, invitadorId = null) {
  const res = await fetch(`${API_BASE}/participants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: participant, isNew, invitadorId }),
  });
  if (!res.ok) throw new Error('Failed to save participant');
  const result = await res.json();
  return isNew ? result.id : participant.id;
}

export async function deleteParticipant(id) {
  const res = await fetch(`${API_BASE}/participants`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error('Failed to delete participant');
}
