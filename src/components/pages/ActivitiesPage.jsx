import { useState, useMemo } from 'react';
import { navigate } from 'astro:transitions/client';
import { Pencil, Trash2, Users, Gamepad2, Award, Trophy, Calendar } from 'lucide-react';
import { TEAMS, TEAM_COLORS, getTeamBg } from '../../lib/constants';
import { calcPts } from '../../lib/calc';
import { PageHeader, Empty } from '../ui/Common';
import { Avatar } from '../ui/Avatar';
import { Chip } from '../ui/Badges';
import { formatDate, isToday } from '../../lib/utils';
import { useApp } from '../../hooks/useApp';
import { usePolling } from '../../hooks/usePolling';
import { NewActivityModal } from '../activities/NewActivityModal';
import { confirmDialog } from '../../lib/confirm';

export default function ActivitiesPage() {
  const { db, deleteActivity, refresh } = useApp();
  const { activities } = db;
  const [showNewModal, setShowNewModal] = useState(false);

  usePolling(refresh, 5000);

  const sorted = useMemo(() => [...(activities || [])].sort((a, b) => (b.fecha || '').localeCompare(a.fecha || '')), [activities]);

  const del = async (id, e) => {
    e.stopPropagation();
    if (await confirmDialog('¿Eliminar esta actividad?')) {
      deleteActivity(id);
    }
  };

  return (
    <div>
      <PageHeader title="Actividades" sub={`${(activities || []).length} registradas`} />
      <div className="p-4">
        <button
          onClick={() => setShowNewModal(true)}
          className="w-full py-4 bg-accent text-dark font-bold text-base rounded-xl border-none cursor-pointer mb-4 min-h-[52px]"
        >
          + Nueva Actividad
        </button>
        {sorted.length === 0 ? (
          <Empty text="No hay actividades todavía" />
        ) : (
          <div className="flex flex-col gap-3">
            {sorted.map((a) => {
              const isHoy = isToday(a.fecha);
              return (
                <div
                  key={a.id}
                  onClick={() => { navigate(`/activities/${a.id}`); }}
                  className={`bg-white rounded-2xl border-2 overflow-hidden cursor-pointer transition-all ${isHoy ? 'border-primary shadow-lg shadow-primary/20' : 'border-surface-dark'
                    }`}
                >
                  {isHoy && (
                    <div className="bg-primary text-white text-xs font-bold px-3 py-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> HOY
                    </div>
                  )}
                  <div className="p-4 flex justify-between">
                    <div>
                      <div className="font-black text-base">{a.titulo || 'Sin título'}</div>
                      <div className={`text-sm mt-1 flex items-center gap-2 ${isHoy ? 'text-primary font-bold' : 'text-text-muted'}`}>
                        {formatDate(a.fecha)}
                        {isHoy && <span className="bg-primary/20 px-2 py-0.5 rounded-full text-xs">HOY</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/activities/${a.id}/edit`);
                        }}
                        className="w-11 h-11 rounded-xl bg-surface-dark border-none cursor-pointer flex items-center justify-center text-primary"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => del(a.id, e)}
                        className="w-11 h-11 rounded-xl bg-red-100 border-none cursor-pointer flex items-center justify-center text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="p-3 flex gap-2 border-t border-surface-dark flex-wrap">
                    <Chip icon={Users} val={a.asistentes.length} label="asist." />
                    <Chip icon={Gamepad2} val={a.juegos.length} label="juegos" />
                    <Chip icon={Award} val={(a.partidos || []).length} label="partidos" />
                    <Chip icon={Trophy} val={(a.goles || []).reduce((s, g) => s + g.cant, 0)} label="goles" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showNewModal && <NewActivityModal onClose={() => setShowNewModal(false)} />}
    </div>
  );
}
