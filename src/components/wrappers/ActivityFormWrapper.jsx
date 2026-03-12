import { useApp } from '../../hooks/useApp';
import { ActivityFormModal } from '../activities/ActivityForm';

/**
 * Wrapper de formulario de actividad para las páginas Astro.
 * @param {{ mode: 'new' | 'edit', id?: string }} props
 */
export default function ActivityFormWrapper({ mode, id }) {
  const { db, saveActivity, quickUpdate, saveParticipant } = useApp();

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
