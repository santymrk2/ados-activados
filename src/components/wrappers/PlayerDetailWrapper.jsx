import { useApp } from '../../hooks/useApp';
import { navigate } from 'astro:transitions/client';
import { PlayerDetailModal } from '../participants/PlayerDetail';

/**
 * Wrapper de detalle de jugador para las páginas Astro.
 * @param {{ id: string }} props
 */
export default function PlayerDetailWrapper({ id }) {
  const { db } = useApp();
  const participant = db.participants.find((p) => p.id === Number(id));

  if (!participant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-muted">Jugador no encontrado</p>
          <button
            onClick={() => { navigate('/participants'); }}
            className="text-primary font-bold mt-2"
          >
            Volver a jugadores
          </button>
        </div>
      </div>
    );
  }

  return (
    <PlayerDetailModal
      player={participant}
      db={db}
      onEdit={() => { navigate(`/participants/${id}/edit`); }}
      onClose={() => history.back()}
    />
  );
}
