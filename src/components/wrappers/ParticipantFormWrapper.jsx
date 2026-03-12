import { useApp } from '../../hooks/useApp';
import { ParticipantFormModal } from '../participants/ParticipantForm';

/**
 * Wrapper de formulario de participante para las páginas Astro.
 * @param {{ mode: 'new' | 'edit', id?: string }} props
 */
export default function ParticipantFormWrapper({ mode, id }) {
  const { db, saveParticipant } = useApp();

  const participant =
    mode === 'edit' ? db.participants.find((p) => p.id === Number(id)) : null;

  return (
    <ParticipantFormModal
      db={db}
      initial={participant}
      onClose={() => history.back()}
      onSave={saveParticipant}
    />
  );
}
