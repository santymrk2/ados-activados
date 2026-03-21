import { useApp } from '../../hooks/useApp';
import { ActivityFormModal } from '../activities/ActivityForm';
import { usePolling } from '../../hooks/usePolling';

/**
 * Wrapper de formulario de actividad para las páginas Astro.
 * @param {{ mode: 'new' | 'edit', id?: string }} props
 */
export default function ActivityFormWrapper({ mode, id }) {
  const { db, saveActivity, quickUpdate, saveParticipant, refresh } = useApp();

  usePolling(refresh, 5000);

  const activity =
    mode === 'edit' ? db.activities.find((a) => a.id === Number(id)) : null;

  return (
    <ActivityFormModal
      db={db}
      initial={activity}
      onClose={() => history.back()}
      onSave={saveActivity}
      onQuickUpdate={quickUpdate}
      onSaveParticipant={saveParticipant}
    />
  );
}
