import { useMemo } from 'react';
import { Pencil, Trash2, Users, Gamepad2, Award, Trophy } from 'lucide-react';
import { TEAMS, TEAM_COLORS, getTeamBg } from '../../lib/constants';
import { calcPts } from '../../lib/calc';
import { PageHeader, Empty } from '../ui/Common';
import { Chip } from '../ui/Badges';
import { formatDate } from '../../lib/utils';
import { confirmDialog } from '../../lib/confirm';

export function ActivitiesList({ db, onView, onNew, onEdit, onDelete }) {
  const sorted = useMemo(() => [...db.activities].sort((a, b) => b.fecha.localeCompare(a.fecha)), [db.activities]);
  
  const del = async (id, e) => {
    e.stopPropagation();
    if (await confirmDialog('¿Eliminar esta actividad?')) {
      onDelete(id);
    }
  };

  return (
    <div>
      <PageHeader title="Actividades" sub={`${db.activities.length} registradas`} />
      <div className="p-4">
        <button onClick={onNew} className="w-full py-4 bg-primary text-white font-bold text-base rounded-xl border-none cursor-pointer mb-4 min-h-[52px]">
          + Nueva Actividad
        </button>
        {sorted.length === 0 ? (
          <Empty text="No hay actividades todavía" />
        ) : (
          <div className="flex flex-col gap-3">
            {sorted.map((a) => (
              <div
                key={a.id}
                onClick={() => onView(a)}
                className="bg-white rounded-2xl border border-surface-dark overflow-hidden cursor-pointer"
              >
                <div className="p-4 flex justify-between">
                  <div>
                    <div className="font-black text-base">{a.titulo || 'Sin título'}</div>
                    <div className="text-sm text-text-muted mt-1">{formatDate(a.fecha)}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(a);
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
