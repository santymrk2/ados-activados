import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Search, ArrowUpDown } from 'lucide-react';
import { getEdad } from '../../lib/constants';
import { calcPts } from '../../lib/calc';
import { PageHeader, Empty } from '../ui/Common';
import { Avatar } from '../ui/Avatar';
import { formatDate } from '../../lib/utils';

export function ParticipantsList({ db, onNew, onEdit, onDelete, onViewDetail }) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('total');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterSex, setFilterSex] = useState('all');

  const list = useMemo(() => {
    let result = db.participants.map((p) => ({ ...p, ...calcPts(p.id, db.activities, db.participants) }));

    if (search) {
      result = result.filter((p) => `${p.nombre} ${p.apellido}`.toLowerCase().includes(search.toLowerCase()));
    }

    if (filterSex !== 'all') {
      result = result.filter((p) => p.sexo === filterSex);
    }

    result.sort((a, b) => {
      let valA = a[sortBy] || 0;
      let valB = b[sortBy] || 0;
      if (sortBy === 'nombre' || sortBy === 'apellido') {
        valA = `${a.nombre} ${a.apellido}`.toLowerCase();
        valB = `${b.nombre} ${b.apellido}`.toLowerCase();
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });

    return result;
  }, [db.participants, db.activities, search, sortBy, sortOrder, filterSex]);

  const del = (id) => {
    if (confirm('¿Eliminar?')) {
      onDelete(id);
    }
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div>
      <PageHeader title="Jugadores" sub={`${db.participants.length} registrados`} />
      <div className="p-4">
        <button
          onClick={onNew}
          className="w-full py-4 bg-accent text-dark font-bold text-base rounded-xl border-none cursor-pointer mb-3 flex items-center justify-center gap-2 min-h-[52px]"
        >
          <Plus className="w-5 h-5" />
          Agregar Jugador
        </button>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre..."
            className="w-full pl-10 p-3 bg-white border border-surface-dark rounded-xl text-dark font-clash mb-2 outline-none"
          />
        </div>

        <div className="flex gap-2 mb-3">
          <select
            value={filterSex}
            onChange={(e) => setFilterSex(e.target.value)}
            className="flex-1 p-2 bg-white border border-surface-dark rounded-lg text-sm"
          >
            <option value="all">Todos</option>
            <option value="M">Varones</option>
            <option value="F">Mujeres</option>
          </select>

          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [by, order] = e.target.value.split('-');
              setSortBy(by);
              setSortOrder(order);
            }}
            className="flex-1 p-2 bg-white border border-surface-dark rounded-lg text-sm"
          >
            <option value="total-desc">Puntos ↓</option>
            <option value="total-asc">Puntos ↑</option>
            <option value="gf-desc">Goles Fútbol ↓</option>
            <option value="gf-asc">Goles Fútbol ↑</option>
            <option value="gh-desc">Goles Handball ↓</option>
            <option value="gh-asc">Goles Handball ↑</option>
            <option value="gb-desc">Goles Básquet ↓</option>
            <option value="gb-asc">Goles Básquet ↑</option>
            <option value="acts-desc">Asistencias ↓</option>
            <option value="acts-asc">Asistencias ↑</option>
            <option value="nombre-asc">Nombre A-Z</option>
            <option value="nombre-desc">Nombre Z-A</option>
          </select>
        </div>

        {list.length === 0 ? (
          <Empty text="No hay jugadores" />
        ) : (
          <div className="flex flex-col gap-2">
            {list.map((p) => {
              return (
                <div
                  key={p.id}
                  onClick={() => onViewDetail(p)}
                  className="bg-white rounded-xl p-3 border border-surface-dark flex items-center gap-3 cursor-pointer hover:border-primary/30"
                >
                  <Avatar p={p} size={44} />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold truncate">{p.nombre} {p.apellido}</div>
                    <div className="text-xs mt-1 flex gap-2 flex-wrap items-center">
                      <span className="text-text-muted">{getEdad(p.fechaNacimiento)}a · {p.acts} act.</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-black text-xl">{p.total}</div>
                    <div className="text-xs text-text-muted">pts</div>
                  </div>
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onEdit(p)}
                      className="w-11 h-11 rounded-xl bg-surface-dark border-none cursor-pointer flex items-center justify-center text-primary"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => del(p.id)}
                      className="w-11 h-11 rounded-xl bg-red-100 border-none cursor-pointer flex items-center justify-center text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
