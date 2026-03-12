import { useMemo } from 'react';
import { TEAMS, TEAM_COLORS, getTeamBg, getEdad } from '../../lib/constants';
import { calcPts, actPts } from '../../lib/calc';
import { Modal, Empty } from '../ui/Common';
import { Avatar } from '../ui/Avatar';
import { formatDate } from '../../lib/utils';

export function PlayerDetailModal({ player, db, onEdit, onClose }) {
  const { activities, participants } = db;
  
  const stats = useMemo(() => calcPts(player.id, activities, participants), [player.id, activities, participants]);

  const playerActivities = useMemo(() =>
    activities
      .filter(a => a.asistentes.includes(player.id))
      .sort((a, b) => b.fecha.localeCompare(a.fecha)),
    [player.id, activities]
  );

  const goalsBySport = useMemo(() => {
    const result = { f: 0, h: 0, b: 0 };
    activities.forEach(a => {
      (a.goles || []).forEach(g => {
        if (g.pid === player.id) {
          result[g.tipo] = (result[g.tipo] || 0) + g.cant;
        }
      });
    });
    return result;
  }, [player.id, activities]);

  const teamsPlayed = [...new Set(
    activities.flatMap(a =>
      a.asistentes.includes(player.id) && a.equipos?.[player.id] ? [a.equipos[player.id]] : []
    )
  )];

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-y-auto pb-28">
      <div className="bg-primary text-white p-4">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={onClose} className="w-11 h-11 rounded-xl bg-white/20 text-white text-lg flex items-center justify-center">←</button>
          <div className="flex-1">
            <div className="font-black text-lg">Perfil del Jugador</div>
          </div>
          <button onClick={onEdit} className="bg-white/20 rounded-lg px-4 py-2 text-accent font-bold text-sm">Editar</button>
        </div>

        <div className="flex items-center gap-4">
          <Avatar p={player} size={72} />
          <div>
            <div className="font-black text-2xl">{player.nombre} {player.apellido}</div>
            <div className="flex gap-3 mt-1 text-sm opacity-80">
              <span>· {getEdad(player.fechaNacimiento)} años</span>
            </div>
            <div className="flex gap-2 mt-2">
              {teamsPlayed.map(t => (
                <span key={t} className="text-xs font-bold px-2 py-1 rounded" style={{ backgroundColor: getTeamBg(t), color: TEAM_COLORS[t] }}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="bg-white rounded-xl p-4 border border-surface-dark text-center">
            <div className="text-3xl font-black text-primary">{stats.total}</div>
            <div className="text-xs text-text-muted font-bold">PUNTOS TOTALES</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-surface-dark text-center">
            <div className="text-3xl font-black text-primary">{stats.acts}</div>
            <div className="text-xs text-text-muted font-bold">ASISTENCIAS</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-surface-dark mb-4">
          <div className="font-bold text-sm mb-3">GOLES POR DEPORTE</div>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-2 bg-surface-dark rounded-lg">
              <div className="font-black text-xl">{goalsBySport.f}</div>
              <div className="text-xs text-text-muted">Fútbol</div>
            </div>
            <div className="text-center p-2 bg-surface-dark rounded-lg">
              <div className="font-black text-xl">{goalsBySport.h}</div>
              <div className="text-xs text-text-muted">Handball</div>
            </div>
            <div className="text-center p-2 bg-surface-dark rounded-lg">
              <div className="font-black text-xl">{goalsBySport.b}</div>
              <div className="text-xs text-text-muted">Básquet</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-surface-dark mb-4">
          <div className="font-bold text-sm mb-3">HISTORIAL DE ACTIVIDADES</div>
          {playerActivities.length === 0 ? (
            <Empty text="Sin actividades" />
          ) : (
            <div className="flex flex-col gap-2">
              {playerActivities.slice(0, 10).map(a => {
                const pts = actPts(player.id, a, participants);
                const team = a.equipos?.[player.id];
                return (
                  <div key={a.id} className="flex items-center gap-3 p-2 bg-surface-dark rounded-lg">
                    <div className="text-sm text-text-muted w-20">{formatDate(a.fecha)}</div>
                    <div className="flex-1 font-bold text-sm truncate">{a.titulo || 'Actividad'}</div>
                    {team && <span className="text-xs font-bold" style={{ color: TEAM_COLORS[team] }}>{team}</span>}
                    <div className="font-black text-primary">{pts} pts</div>
                  </div>
                );
              })}
              {playerActivities.length > 10 && (
                <div className="text-center text-xs text-text-muted">+{playerActivities.length - 10} más</div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-4 border border-surface-dark">
          <div className="font-bold text-sm mb-3">ESTADÍSTICAS</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between"><span className="text-text-muted">Puntualidades</span><span className="font-bold">{stats.acts > 0 ? '⭐' : '—'}</span></div>
            <div className="flex justify-between"><span className="text-text-muted">Bibliotecas</span><span className="font-bold">{stats.acts > 0 ? '📖' : '—'}</span></div>
            <div className="flex justify-between"><span className="text-text-muted">Invitados</span><span className="font-bold">{stats.acts > 0 ? '✓' : '—'}</span></div>
            <div className="flex justify-between"><span className="text-text-muted">Promedio</span><span className="font-bold">{stats.acts > 0 ? (stats.total / stats.acts).toFixed(1) : 0}/act</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
