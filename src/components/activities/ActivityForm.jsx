import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Toaster, toast } from 'sonner';
import {
  FileText, Users, LayoutGrid, Gamepad2, Award, Mail, Plus, Trophy,
  ChevronLeft, ChevronRight, Clock, BookOpen, Search, ArrowUpDown, X, List, Table2, Coffee, Zap, Trash2, Settings
} from 'lucide-react';
import { newAct, newPart, TEAMS, getEdad, TEAM_COLORS, getTeamBg, PTS, DEPORTES, GENEROS } from '../../lib/constants';
import { Modal, Label, Empty, SegmentedButtons, PillCheck } from '../ui/Common';
import { SexBadge, Chip } from '../ui/Badges';
import { Avatar } from '../ui/Avatar';
import { HelpInfo } from '../ui/HelpInfo';
import { cn, formatDate } from '../../lib/utils';

export function ActivityFormModal({ db, initial, onClose, onSave, onQuickUpdate, onSaveParticipant }) {
  const [act, setAct] = useState({ ...newAct(), ...initial });
  const [tab, setTab] = useState(0);
  const [saveStatus, setSaveStatus] = useState('saved');
  const saveTimerRef = useRef(null);
  const isFirstRender = useRef(true);
  const actRef = useRef(act);
  actRef.current = act;

  const A = (k, v) => setAct((a) => ({ ...a, [k]: v }));

  const Q = (type, data, k, v) => {
    setAct((a) => ({ ...a, [k]: v }));
    if (act.id) {
      onQuickUpdate(act.id, type, data);
    }
  };

  const TABS = [
    { icon: FileText, label: 'Info', key: 'info' },
    { icon: Users, label: 'Asistencia', key: 'asistencia' },
    { icon: LayoutGrid, label: 'Equipos', key: 'equipos' },
    { icon: Gamepad2, label: 'Juegos', key: 'juegos' },
    { icon: Award, label: 'Deportes', key: 'deportes' },
    { icon: Mail, label: 'Invitados', key: 'invitados' },
    { icon: Trophy, label: 'Goles', key: 'goles' },
    { icon: Plus, label: 'Extras', key: 'extras' },
  ];

  const doSave = useCallback(async (currentAct) => {
    if (!currentAct.fecha) return;
    setSaveStatus('saving');
    try {
      const isNew = !currentAct.id;
      const saved = isNew ? { ...currentAct, id: db.nextAid } : currentAct;
      const realId = await onSave(saved, isNew);
      if (isNew && realId) {
        setAct(prev => ({ ...prev, id: realId }));
      }
      setSaveStatus('saved');
    } catch (e) {
      setSaveStatus('error');
      toast.error('Error al guardar: ' + e.message);
    }
  }, [db.nextAid, onSave]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (!act.id) {
      setSaveStatus('saving');
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => doSave(actRef.current), 800);
    } else {
      setSaveStatus('saving');
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => doSave(actRef.current), 3000);
    }

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [act, doSave]);

  const statusIndicator = {
    saved: { color: 'text-accent', label: 'Guardado' },
    saving: { color: 'text-yellow-500', label: 'Guardando...' },
    error: { color: 'text-red-500', label: 'Error al guardar' },
  }[saveStatus];

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-y-auto pb-32 min-h-screen">
      <div className="bg-primary text-white p-3 sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={onClose} className="w-11 h-11 rounded-xl bg-white/20 border-none text-white text-lg cursor-pointer flex items-center justify-center">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="font-black text-lg">{act.id ? 'Editar' : 'Nueva'} Actividad</div>
            <div className="text-xs opacity-70">{act.titulo || 'Sin título'} · {formatDate(act.fecha)}</div>
          </div>
          <span className={`text-xs font-bold ${saveStatus === 'saved' ? 'text-accent' : saveStatus === 'saving' ? 'text-yellow-300' : 'text-red-300'}`}>
            {statusIndicator.label}
          </span>
        </div>
      </div>
      <div className="p-4 flex-1">
        {tab === 0 && <TabInfo act={act} A={A} />}
        {tab === 1 && <TabAsistencia act={act} A={A} Q={Q} db={db} onSaveParticipant={onSaveParticipant} />}
        {tab === 2 && <TabEquipos act={act} A={A} Q={Q} db={db} />}
        {tab === 3 && <TabJuegos act={act} A={A} Q={Q} />}
        {tab === 4 && <TabDeportes act={act} A={A} Q={Q} db={db} />}
        {tab === 5 && <TabInvitados act={act} A={A} db={db} onSaveParticipant={onSaveParticipant} />}
        {tab === 6 && <TabGoles act={act} A={A} Q={Q} db={db} />}
        {tab === 7 && <TabExtras act={act} A={A} db={db} />}
      </div>

      <div className="fixed bottom-4 left-4 right-4 bg-white rounded-2xl shadow-lg shadow-black/10 border border-surface-dark flex z-50 p-2 safe-area-bottom mb-2">
        <div className="flex overflow-x-auto gap-1 no-scrollbar max-w-full">
          {TABS.map(({ icon: Icon, label, key }, i) => (
            <button
              key={key}
              onClick={() => setTab(i)}
              className={`flex flex-col items-center justify-center py-2 px-2 rounded-xl transition-colors flex-1 min-w-[60px] ${tab === i ? 'text-primary bg-primary/10' : 'text-text-muted hover:text-dark'}`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[8px] font-bold">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="fixed bottom-24 left-4 right-4 mb-2 flex items-center gap-3">
        {tab > 0 && (
          <button onClick={() => setTab((t) => t - 1)} className="w-12 h-12 bg-white rounded-xl shadow-lg shadow-black/10 border border-surface-dark text-dark font-bold cursor-pointer flex items-center justify-center">
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        <div className="flex-1" />
        {tab < TABS.length - 1 && (
          <button onClick={() => setTab((t) => t + 1)} className="w-12 h-12 bg-primary rounded-xl shadow-lg shadow-black/10 border border-primary text-white font-bold cursor-pointer flex items-center justify-center">
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}

function TabInfo({ act, A }) {
  return (
    <div className="flex flex-col gap-4">
      <Label>Fecha</Label>
      <input type="date" value={act.fecha} onChange={(e) => A('fecha', e.target.value)} className="input" />
      <div className="flex items-center gap-2">
        <Label style={{ margin: 0 }}>Preferencias</Label>
        <HelpInfo title="Flujo de Carga" text="1. Marcá Asistencia. 2. Asigná Equipos. 3. Cargá Juegos y Deportes. Los puntos se calculan automáticamente." />
      </div>
      <input value={act.titulo} onChange={(e) => A('titulo', e.target.value)} placeholder="Ej: Actividad Mayo" className="input mt-2" />
    </div>
  );
}

function TabAsistencia({ act, A, Q, db, onSaveParticipant }) {
  const [sortOrder, setSortOrder] = useState('asc');
  const [search, setSearch] = useState('');
  const [showNewPlayer, setShowNewPlayer] = useState(false);
  const [newPlayer, setNewPlayer] = useState({ nombre: '', apellido: '', sexo: 'M', fechaNacimiento: '', invitadorId: null });
  const [isSubmittingPlayer, setIsSubmittingPlayer] = useState(false);

  const toggle = (key, id) => {
    const c = act[key] || [];
    const isIncluded = c.includes(id);
    const newValue = isIncluded ? c.filter((x) => x !== id) : [...c, id];

    if (key === 'asistentes') {
      Q('attendance', { participantId: id, value: !isIncluded }, key, newValue);
      // When removing attendance, also remove from social/punctual/bible/teams
      if (isIncluded) {
        A('socials', (act.socials || []).filter(x => x !== id));
        A('puntuales', (act.puntuales || []).filter(x => x !== id));
        A('biblias', (act.biblias || []).filter(x => x !== id));
        const newEq = { ...act.equipos };
        delete newEq[id];
        A('equipos', newEq);
      }
    } else if (key === 'socials') {
      A(key, newValue);
      // If marking as social, remove from teams
      if (!isIncluded) {
        const newEq = { ...act.equipos };
        delete newEq[id];
        A('equipos', newEq);
      }
    } else if (key === 'puntuales') {
      Q('puntuales', { participantId: id, value: !isIncluded }, key, newValue);
    } else if (key === 'biblias') {
      Q('biblias', { participantId: id, value: !isIncluded }, key, newValue);
    } else {
      A(key, newValue);
    }
  };

  const sorted = useMemo(() => {
    let arr = [...db.participants];
    if (search) {
      arr = arr.filter(p => `${p.nombre} ${p.apellido}`.toLowerCase().includes(search.toLowerCase()));
    }
    if (sortOrder === 'asc') {
      arr.sort((a, b) => `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`));
    } else {
      arr.sort((a, b) => `${b.apellido} ${b.nombre}`.localeCompare(`${a.apellido} ${a.nombre}`));
    }
    return arr;
  }, [db.participants, sortOrder, search]);

  const handleCreatePlayer = async () => {
    if (!newPlayer.nombre.trim() || !newPlayer.apellido.trim()) return toast.error('Ingresá nombre y apellido');
    if (!newPlayer.fechaNacimiento) return toast.error('Ingresá la fecha de nacimiento');

    const age = getEdad(newPlayer.fechaNacimiento);
    if (age < 0 || age > 100) return toast.error('La fecha de nacimiento no es válida');
    if (age < 12 || age > 18) {
      if (!confirm(`¿Estás seguro que querés agregar a ${newPlayer.nombre} con ${age} años?`)) return;
    }

    if (isSubmittingPlayer) return;
    setIsSubmittingPlayer(true);
    try {
      const p = { ...newPart(), ...newPlayer, id: db.nextPid };
      const newId = await onSaveParticipant(p, true, newPlayer.invitadorId);
      const playerId = newId || p.id;
      A('asistentes', [...act.asistentes, playerId]);

      if (newPlayer.invitadorId) {
        A('invitaciones', [...(act.invitaciones || []), {
          id: Date.now(),
          invitador: newPlayer.invitadorId,
          invitado_id: playerId
        }]);
      }

      setShowNewPlayer(false);
      setNewPlayer({ nombre: '', apellido: '', sexo: 'M', fechaNacimiento: '', invitadorId: null });
      toast.success('Jugador agregado y registrado');
    } catch (e) {
      toast.error('Error al guardar: ' + e.message);
    } finally {
      setIsSubmittingPlayer(false);
    }
  };

  return (
    <div>
      {showNewPlayer && (
        <div className="bg-white rounded-xl p-4 border border-primary mb-3 shadow-md">
          <div className="flex justify-between items-center mb-3">
            <Label style={{ margin: 0 }}>Nuevo Jugador</Label>
            <button onClick={() => setShowNewPlayer(false)} className="text-text-muted"><X className="w-5 h-5" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
            <input value={newPlayer.nombre} onChange={(e) => setNewPlayer(p => ({ ...p, nombre: e.target.value }))} placeholder="Nombre" className="input mb-0 text-sm" />
            <input value={newPlayer.apellido} onChange={(e) => setNewPlayer(p => ({ ...p, apellido: e.target.value }))} placeholder="Apellido" className="input mb-0 text-sm" />
            <input value={newPlayer.fechaNacimiento} onChange={(e) => setNewPlayer(p => ({ ...p, fechaNacimiento: e.target.value }))} type="date" className="input mb-0 text-sm col-span-2" />
            <select value={newPlayer.sexo} onChange={(e) => setNewPlayer(p => ({ ...p, sexo: e.target.value }))} className="input mb-0 text-sm">
              <option value="M">Varón</option>
              <option value="F">Mujer</option>
            </select>
            <select value={newPlayer.invitadorId || ''} onChange={(e) => setNewPlayer(p => ({ ...p, invitadorId: e.target.value ? Number(e.target.value) : null }))} className="input mb-0 text-sm">
              <option value="">¿Quién lo invitó?</option>
              {db.participants.filter(p => act.asistentes.includes(p.id)).map(p => (
                <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>
              ))}
            </select>
          </div>
          <button onClick={handleCreatePlayer} disabled={isSubmittingPlayer} className="w-full py-2 bg-primary text-white font-bold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50">
            <Plus className="w-4 h-4" />
            {isSubmittingPlayer ? 'Cargando...' : 'Agregar y registrar'}
          </button>
        </div>
      )}

      <div className="flex flex-col gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar jugador..." className="pl-10 pr-3 py-2 w-full bg-white border border-surface-dark rounded-xl text-sm outline-none" />
          </div>
          <button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} title="Ordenar A→Z" className="p-2 bg-white border border-surface-dark rounded-xl flex items-center gap-1 text-text-muted hover:text-primary">
            <ArrowUpDown className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Label style={{ margin: 0 }}>Asistencia ({sorted.length})</Label>
          <div className="flex gap-2 ml-auto">
            <button onClick={() => setShowNewPlayer(true)} className="pill-btn bg-primary/10 text-primary text-xs flex items-center gap-1">
              <Plus className="w-3 h-3" /> Nuevo
            </button>
            <button onClick={() => A('asistentes', [])} className="pill-btn bg-red-50 text-red-500 text-xs">Limpiar</button>
            <button onClick={() => A('asistentes', sorted.map((p) => p.id))} className="pill-btn bg-teal-50 text-teal-600 text-xs">Todos</button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        {sorted.map((p) => {
          const here = act.asistentes.includes(p.id);
          const punct = (act.puntuales || []).includes(p.id);
          const bib = (act.biblias || []).includes(p.id);
          const team = act.equipos?.[p.id];
          return (
            <div key={p.id} className="rounded-lg border bg-white border-surface-dark">
              <div className="flex items-center p-3 gap-3">
                <div onClick={() => toggle('asistentes', p.id)} className="w-6 h-6 rounded-md cursor-pointer flex items-center justify-center font-bold text-xs" style={{ backgroundColor: here ? '#4342FF' : '#f5f5f5', color: here ? 'white' : '#999', border: !here ? '1px solid #e5e5e5' : 'none' }}>
                  {here && '✓'}
                </div>
                <Avatar p={p} size={30} />
                <div className="flex-1">
                  <div className="font-bold text-sm" style={{ color: here ? '#1a1a1a' : '#999' }}>{p.nombre} {p.apellido}</div>
                  <div className="text-xs text-text-muted">{getEdad(p.fechaNacimiento)}a</div>
                </div>
                {here && (
                  <div className="flex gap-1 items-center">
                    {team && <span className="text-[10px] font-bold rounded px-2 py-0.5" style={{ backgroundColor: getTeamBg(team), color: TEAM_COLORS[team] }}>{team}</span>}
                    <PillCheck
                      icon={(act.socials || []).includes(p.id) ? Coffee : Zap}
                      label={(act.socials || []).includes(p.id) ? "SOCIAL" : "RECRE"}
                      active={true}
                      onClick={() => toggle('socials', p.id)}
                      color={(act.socials || []).includes(p.id) ? "#F59E0B" : "#10B981"}
                    />
                    <PillCheck icon={Clock} active={punct} onClick={() => toggle('puntuales', p.id)} color="#FFD93D" />
                    <PillCheck icon={BookOpen} active={bib} onClick={() => toggle('biblias', p.id)} color="#4ECDC4" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TabEquipos({ act, A, Q, db }) {
  const [viewMode, setViewMode] = useState('list');
  const present = useMemo(() =>
    db.participants.filter(p => act.asistentes.includes(p.id) && !(act.socials || []).includes(p.id)).sort((a, b) => `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`))
    , [db.participants, act.asistentes, act.socials]);

  const setTeam = (pid, team) => {
    const eq = { ...(act.equipos || {}) };
    let finalTeam = team;
    if (eq[pid] === team) {
      delete eq[pid];
      finalTeam = null;
    } else {
      eq[pid] = team;
    }
    Q('team', { participantId: pid, team: finalTeam }, 'equipos', eq);
  };

  const autoBalance = (resetAll = false) => {
    const eq = resetAll ? {} : { ...(act.equipos || {}) };
    const counts = {};
    TEAMS.forEach(t => { counts[t] = { M: 0, F: 0, total: 0 }; });
    if (!resetAll) {
      present.forEach(p => {
        const t = eq[p.id];
        if (t) { counts[t][p.sexo]++; counts[t].total++; }
      });
    }
    const unassigned = present.filter(p => !eq[p.id]);
    const masc = unassigned.filter(p => p.sexo === 'M');
    const fem = unassigned.filter(p => p.sexo === 'F');

    [...masc, ...fem].forEach(p => {
      const best = [...TEAMS].sort((a, b) => counts[a][p.sexo] - counts[b][p.sexo] || counts[a].total - counts[b].total)[0];
      eq[p.id] = best;
      counts[best][p.sexo]++;
      counts[best].total++;
    });
    A('equipos', eq);
  };

  const teamStats = TEAMS.map(t => ({
    team: t,
    total: present.filter(p => act.equipos?.[p.id] === t).length,
    m: present.filter(p => act.equipos?.[p.id] === t && p.sexo === 'M').length,
    f: present.filter(p => act.equipos?.[p.id] === t && p.sexo === 'F').length,
  }));
  const unassignedCount = present.filter(p => !act.equipos?.[p.id]).length;

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <button onClick={() => setViewMode('list')} className={cn('flex-1 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1 border transition-all', viewMode === 'list' ? 'bg-primary text-white border-primary' : 'bg-white text-text-muted border-surface-dark')}><List className="w-3.5 h-3.5" /> Lista</button>
        <button onClick={() => setViewMode('table')} className={cn('flex-1 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1 border transition-all', viewMode === 'table' ? 'bg-primary text-white border-primary' : 'bg-white text-text-muted border-surface-dark')}><Table2 className="w-3.5 h-3.5" /> Tabla</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
        {teamStats.map(({ team, total, m, f }) => (
          <div key={team} className="rounded-lg p-2 text-center border-2" style={{ backgroundColor: getTeamBg(team), borderColor: TEAM_COLORS[team] + '44' }}>
            <div className="font-black text-xs" style={{ color: TEAM_COLORS[team] }}>{team}</div>
            <div className="font-black text-xl">{total}</div>
            <div className="text-[10px] text-text-muted flex items-center justify-center gap-1"><SexBadge sex="M" className="w-3.5 h-3.5" />{m} <SexBadge sex="F" className="w-3.5 h-3.5" />{f}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-4">
        {unassignedCount > 0 && <button onClick={() => autoBalance(false)} className="pill-btn flex-1 bg-indigo-50 text-primary text-xs">⚡ Completar ({unassignedCount})</button>}
        <button onClick={() => autoBalance(true)} className="pill-btn flex-1 bg-red-50 text-red-500 text-xs">🔀 Redistribuir</button>
      </div>

      {viewMode === 'list' ? (
        <div className="flex flex-col gap-1">
          {present.map(p => {
            const cur = act.equipos?.[p.id];
            return (
              <div key={p.id} className="bg-white rounded-lg p-3 flex items-center gap-3 border" style={{ borderColor: cur ? TEAM_COLORS[cur] + '55' : '#e5e5e5' }}>
                <Avatar p={p} size={32} />
                <div className="flex-1">
                  <div className="font-bold text-sm">{p.nombre} {p.apellido}</div>
                </div>
                <div className="flex gap-1">
                  {TEAMS.map(t => (
                    <button key={t} onClick={() => setTeam(p.id, t)} className="w-8 h-7 rounded bg-surface-dark font-black text-[10px]" style={{ backgroundColor: cur === t ? TEAM_COLORS[t] : getTeamBg(t), color: cur === t ? 'white' : '#666' }}>{t}</button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <TeamTableView act={act} db={db} />
      )}
    </div>
  );
}

function TeamTableView({ act, db }) {
  const present = useMemo(() =>
    db.participants.filter(p => act.asistentes.includes(p.id)).sort((a, b) => `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`))
    , [db.participants, act.asistentes]);

  const tableData = useMemo(() => {
    return TEAMS.map(team => {
      const members = present.filter(p => act.equipos?.[p.id] === team);
      return {
        team,
        women: members.filter(p => p.sexo === 'F'),
        men: members.filter(p => p.sexo === 'M'),
      };
    });
  }, [present, act.equipos]);

  return (
    <div className="overflow-x-auto rounded-xl border border-surface-dark">
      <table className="w-full border-collapse text-[10px]">
        <thead>
          <tr>
            {tableData.map(({ team }) => (
              <th key={team} className="p-2 border-b border-surface-dark font-black" style={{ backgroundColor: getTeamBg(team), color: TEAM_COLORS[team] }}>{team}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {tableData.map(({ team, women }) => (
              <td key={team} className="p-1 text-center bg-pink-50/30 font-bold border-r border-surface-dark last:border-0">Mujeres ({women.length})</td>
            ))}
          </tr>
          {Array.from({ length: Math.max(...tableData.map(c => c.women.length), 0) }).map((_, r) => (
            <tr key={`w-${r}`}>
              {tableData.map(({ team, women }) => (
                <td key={team} className="p-1 border-r border-surface-dark last:border-0 truncate bg-pink-50/10 max-w-[80px]">
                  {women[r] ? `${women[r].nombre} ${women[r].apellido[0]}.` : ''}
                </td>
              ))}
            </tr>
          ))}
          <tr>
            {tableData.map(({ team, men }) => (
              <td key={team} className="p-1 text-center bg-cyan-50/30 font-bold border-r border-surface-dark last:border-0 border-t border-surface-dark">Varones ({men.length})</td>
            ))}
          </tr>
          {Array.from({ length: Math.max(...tableData.map(c => c.men.length), 0) }).map((_, r) => (
            <tr key={`m-${r}`}>
              {tableData.map(({ team, men }) => (
                <td key={team} className="p-1 border-r border-surface-dark last:border-0 truncate bg-cyan-50/10 max-w-[80px]">
                  {men[r] ? `${men[r].nombre} ${men[r].apellido[0]}.` : ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TabJuegos({ act, A, Q }) {
  const add = () => {
    const nj = { id: Date.now(), nombre: '', pos: {} };
    Q('game_add', nj, 'juegos', [...(act.juegos || []), nj]);
  };
  const del = (id) => Q('game_delete', { id }, 'juegos', (act.juegos || []).filter(j => j.id !== id));
  const updN = (id, v) => A('juegos', (act.juegos || []).map(j => j.id === id ? { ...j, nombre: v } : j));
  const updPos = (jid, team, pos) => {
    const game = (act.juegos || []).find(j => j.id === jid);
    if (!game) return;

    const newPos = { ...game.pos };
    // Swap logic: if another team had this position, they take the current team's old position
    const prev = Object.entries(newPos).find(([t, p]) => p === pos && t !== team);
    if (prev) {
      newPos[prev[0]] = newPos[team];
    }

    // Toggle logic: if clicking the same position, remove it
    if (newPos[team] === pos) {
      delete newPos[team];
    } else {
      newPos[team] = pos;
    }

    const sortedPos = Object.fromEntries(Object.entries(newPos).filter(([, v]) => v != null));
    const newList = (act.juegos || []).map(g => g.id === jid ? { ...g, pos: sortedPos } : g);

    Q('game_pos', { juegoId: jid, pos: sortedPos }, 'juegos', newList);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <Label style={{ margin: 0 }}>Juegos</Label>
        <button onClick={add} className="pill-btn bg-indigo-50 text-primary">+ Juego</button>
      </div>
      <div className="flex flex-col gap-4">
        {(act.juegos || []).map((j, gi) => (
          <JuegoCard key={j.id} j={j} gi={gi} onNombre={(v) => updN(j.id, v)} onDel={() => del(j.id)} onPos={(team, pos) => updPos(j.id, team, pos)} />
        ))}
      </div>
      {(act.juegos || []).length === 0 && <Empty text="Sin juegos registrados" />}
    </div>
  );
}

function JuegoCard({ j, gi, onNombre, onDel, onPos }) {
  const posToTeam = {};
  Object.entries(j.pos || {}).forEach(([t, p]) => { posToTeam[p] = t; });
  const placed = Object.keys(j.pos || {});
  const unplaced = TEAMS.filter((t) => !placed.includes(t));
  const medals = ['', '🥇', '🥈', '🥉', '4°'];

  return (
    <div className="bg-white rounded-2xl border border-surface-dark overflow-hidden shadow-sm">
      <div className="flex items-center gap-3 p-3 border-b border-surface-dark">
        <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center font-black text-primary text-xs">{gi + 1}</div>
        <input value={j.nombre} onChange={(e) => onNombre(e.target.value)} placeholder="Nombre del juego..." className="input mb-0 flex-1" />
        <button onClick={onDel} className="w-11 h-11 text-red-500 bg-red-50 rounded-xl flex items-center justify-center border-none cursor-pointer">✕</button>
      </div>
      <div className="p-3">
        <div className="flex flex-col gap-2 mb-3">
          {[1, 2, 3, 4].map(pos => {
            const team = posToTeam[pos];
            return (
              <div key={pos} onClick={() => team && onPos(team, pos)} className="flex items-center gap-3 p-3 rounded-lg cursor-pointer min-h-12" style={{ backgroundColor: team ? getTeamBg(team) : '#f5f5f5', border: `2px solid ${team ? TEAM_COLORS[team] : '#e5e5e5'}` }}>
                <div className="w-12 flex items-center gap-2">
                  <span className="text-lg">{medals[pos]}</span>
                  <span className="text-xs text-text-muted font-bold">+{PTS.rec[pos]}</span>
                </div>
                {team ? (
                  <div className="flex-1 flex justify-between items-center">
                    <span className="font-black text-xl" style={{ color: TEAM_COLORS[team] }}>{team}</span>
                    <span className="text-xs text-text-muted">toca para quitar</span>
                  </div>
                ) : (
                  <span className="text-text-muted text-sm">— tocar equipo de abajo para asignar</span>
                )}
              </div>
            );
          })}
        </div>
        {unplaced.length > 0 && (
          <div>
            <div className="text-[10px] text-text-muted font-bold mb-2 uppercase tracking-wide">Sin posición — toca para asignar al siguiente lugar</div>
            <div className="flex gap-2 flex-wrap">
              {unplaced.map((t) => {
                const nextPos = [1, 2, 3, 4].find((p) => !posToTeam[p]);
                return (
                  <button key={t} onClick={() => nextPos && onPos(t, nextPos)} className="px-5 py-2 rounded-lg border-2 cursor-pointer font-black text-lg" style={{ borderColor: TEAM_COLORS[t], backgroundColor: getTeamBg(t), color: TEAM_COLORS[t] }}>
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {unplaced.length === 0 && <div className="text-xs text-green-600 text-center pt-1">✓ Todos posicionados</div>}
      </div>
    </div>
  );
}

function TabDeportes({ act, A, Q, db }) {
  const [filterGenero, setFilterGenero] = useState('all');
  const [selectedPartido, setSelectedPartido] = useState(null);

  const add = () => {
    const np = { id: Date.now(), deporte: 'Fútbol', genero: 'M', eq1: 'E1', eq2: 'E2', resultado: null };
    Q('partido_add', np, 'partidos', [...(act.partidos || []), np]);
  };
  const del = (id) => Q('partido_delete', { id }, 'partidos', (act.partidos || []).filter(p => p.id !== id));
  const upd = (id, k, v) => {
    const newList = (act.partidos || []).map(p => p.id === id ? { ...p, [k]: v } : p);
    const p = newList.find(x => x.id === id);
    Q('partido_update', p, 'partidos', newList);
  };

  const filtered = (act.partidos || []).filter(p => filterGenero === 'all' || p.genero === filterGenero);

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <Label style={{ margin: 0 }}>Partidos</Label>
        <button onClick={add} className="pill-btn bg-teal-50 text-teal-600">+ Partido</button>
      </div>
      <div className="flex gap-2 mb-4">
        {[
          { v: 'all', l: 'Todos', c: 'bg-primary' },
          { v: 'M', l: 'Varones', c: 'bg-cyan-600' },
          { v: 'F', l: 'Mujeres', c: 'bg-pink-500' },
          { v: 'MX', l: 'Mixto', c: 'bg-indigo-600' }
        ].map(t => (
          <button key={t.v} onClick={() => setFilterGenero(t.v)} className={cn('flex-1 py-1.5 rounded-lg font-bold text-xs border bg-white text-center px-1', filterGenero === t.v ? `${t.c} text-white border-transparent` : 'text-text-muted border-surface-dark')}>{t.l}</button>
        ))}
      </div>
      {filtered.length === 0 ? <Empty text="Sin partidos" /> : (
        <div className="flex flex-col gap-2">
          {filtered.map(p => (
            <PartidoResumenCard key={p.id} part={p} act={act} onClick={() => setSelectedPartido(p)} />
          ))}
        </div>
      )}
      {selectedPartido && <PartidoEditModal part={selectedPartido} act={act} db={db} onClose={() => setSelectedPartido(null)} onUpd={upd} onDel={del} Q={Q} />}
    </div>
  );
}

function PartidoResumenCard({ part, act, onClick }) {
  const goles = (act.goles || []).filter(g => g.matchId === part.id);
  const score1 = goles.filter(g => g.team === part.eq1).length;
  const score2 = goles.filter(g => g.team === part.eq2).length;
  const icons = { 'Fútbol': '⚽', 'Handball': '🤾', 'Básquet': '🏀', 'Vóley': '🏐' };

  return (
    <div onClick={onClick} className="bg-white rounded-xl border border-surface-dark p-3 flex items-center justify-between cursor-pointer active:scale-95 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="text-xl">{icons[part.deporte] || '🎲'}</div>
        <div>
          <div className="font-bold text-sm">{part.deporte}</div>
          <SexBadge sex={part.genero} className="w-3 h-3" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-black text-sm" style={{ color: score1 > score2 ? '#22C55E' : '#666' }}>{part.eq1}</span>
        <div className="bg-surface-dark rounded px-2 py-0.5 font-black text-sm">{score1} : {score2}</div>
        <span className="font-black text-sm" style={{ color: score2 > score1 ? '#22C55E' : '#666' }}>{part.eq2}</span>
      </div>
    </div>
  );
}

function PartidoEditModal({ part: initialPart, act, db, onClose, onUpd, onDel, Q }) {
  const part = act.partidos.find(p => p.id === initialPart.id) || initialPart;
  const update = (k, v) => onUpd(part.id, k, v);
  const goles = (act.goles || []).filter(g => g.matchId === part.id);
  const s1 = (goles || []).filter(g => g.team === part.eq1).length;
  const s2 = (goles || []).filter(g => g.team === part.eq2).length;

  const addGoal = (team) => {
    const tipos = { 'Fútbol': 'f', 'Handball': 'h', 'Básquet': 'b' };
    const ng = { id: Date.now(), pid: null, tipo: tipos[part.deporte] || 'f', matchId: part.id, team, cant: 1 };
    const all = [...(act.goles || []), ng];
    Q('goal_add', ng, 'goles', all);

    // Auto result
    const ns1 = all.filter(g => g.matchId === part.id && g.team === part.eq1).length;
    const ns2 = all.filter(g => g.matchId === part.id && g.team === part.eq2).length;
    let res = 'empate'; if (ns1 > ns2) res = 'eq1'; else if (ns2 > ns1) res = 'eq2';
    update('resultado', res);
  };

  const delGoal = (id) => {
    const all = (act.goles || []).filter(g => g.id !== id);
    Q('goal_remove', { id }, 'goles', all);
    const ns1 = all.filter(g => g.matchId === part.id && g.team === part.eq1).length;
    const ns2 = all.filter(g => g.matchId === part.id && g.team === part.eq2).length;
    let res = 'empate'; if (ns1 > ns2) res = 'eq1'; else if (ns2 > ns1) res = 'eq2';
    update('resultado', res);
  };

  const getTeamPlayers = (t) => db.participants.filter(p => act.asistentes.includes(p.id) && act.equipos?.[p.id] === t && (part.genero === 'MX' || p.sexo === part.genero));

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-end justify-center" onClick={onClose}>
      <div className="bg-white w-full max-w-lg rounded-t-3xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="bg-primary text-white p-4 flex justify-between items-center">
          <button onClick={onClose} className="w-9 h-9 bg-white/20 rounded flex items-center justify-center">✕</button>
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 opacity-50" />
            <select
              value={part.deporte}
              onChange={(e) => update('deporte', e.target.value)}
              className="bg-transparent text-white border-none font-black text-base cursor-pointer focus:outline-none"
            >
              {DEPORTES.map(d => <option key={d} value={d} className="text-black">{d}</option>)}
            </select>
          </div>
          <button onClick={() => { if (confirm('¿Borrar?')) { onDel(part.id); onClose(); } }} className="w-9 h-9 bg-red-500/20 rounded flex items-center justify-center text-red-200">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 bg-background">
          <div className="flex gap-1 mb-4">
            {['M', 'F', 'MX'].map(g => (
              <button key={g} onClick={() => update('genero', g)} className={cn('flex-1 py-1.5 rounded-lg font-bold text-xs border', part.genero === g ? 'bg-primary text-white' : 'bg-white text-text-muted')}>{g === 'MX' ? 'Mixto' : g === 'M' ? 'Varones' : 'Mujeres'}</button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center">
              <select value={part.eq1} onChange={(e) => update('eq1', e.target.value)} className="input mb-2 text-center font-black" style={{ color: TEAM_COLORS[part.eq1], backgroundColor: getTeamBg(part.eq1) }}>{TEAMS.map(t => <option key={t} value={t}>{t}</option>)}</select>
              <div className="flex items-center justify-center gap-2"><button onClick={() => addGoal(part.eq1)} className="w-10 h-10 bg-primary text-white rounded-full font-black text-xl">+</button><span className="text-3xl font-black">{s1}</span></div>
            </div>
            <div className="text-center">
              <select value={part.eq2} onChange={(e) => update('eq2', e.target.value)} className="input mb-2 text-center font-black" style={{ color: TEAM_COLORS[part.eq2], backgroundColor: getTeamBg(part.eq2) }}>{TEAMS.map(t => <option key={t} value={t}>{t}</option>)}</select>
              <div className="flex items-center justify-center gap-2"><span className="text-3xl font-black">{s2}</span><button onClick={() => addGoal(part.eq2)} className="w-10 h-10 bg-primary text-white rounded-full font-black text-xl">+</button></div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 max-h-[200px] overflow-y-auto p-1">
            {[part.eq1, part.eq2].map(t => (
              <div key={t}>
                <div className="text-[10px] font-bold uppercase text-text-muted mb-1">Goles {t}</div>
                {goles.filter(g => g.team === t).map(g => (
                  <div key={g.id} className="flex gap-1 mb-1">
                    <select value={g.pid || ''} onChange={(e) => Q('goal_update', { id: g.id, pid: Number(e.target.value) }, 'goles', act.goles.map(x => x.id === g.id ? { ...x, pid: Number(e.target.value) } : x))} className="flex-1 text-[10px] p-1 border rounded bg-white">
                      <option value="">— Goleador —</option>
                      {getTeamPlayers(t).map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido[0]}.</option>)}
                    </select>
                    <button onClick={() => delGoal(g.id)} className="w-5 h-5 bg-red-50 text-red-500 rounded text-[10px]">✕</button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TabInvitados({ act, A, db, onSaveParticipant }) {
  const add = () => A('invitaciones', [...(act.invitaciones || []), { id: Date.now(), invitador: null, invitado_id: null }]);
  const del = (id) => A('invitaciones', (act.invitaciones || []).filter(i => i.id !== id));
  const upd = (id, k, v) => A('invitaciones', (act.invitaciones || []).map(i => i.id === id ? { ...i, [k]: v } : i));

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <Label style={{ margin: 0 }}>Invitaciones</Label>
        <button onClick={add} className="pill-btn bg-teal-50 text-teal-600">+ Invitación</button>
      </div>
      <div className="flex flex-col gap-3 mt-3">
        {(act.invitaciones || []).map(inv => (
          <div key={inv.id} className="bg-white rounded-xl border border-surface-dark p-3 shadow-sm">
            <div className="flex justify-between items-center mb-3 text-xs font-black text-text-muted"><span>INVITACIÓN</span><button onClick={() => del(inv.id)} className="text-red-500">✕</button></div>
            <Label>¿Quién invitó?</Label>
            <select value={inv.invitador || ''} onChange={(e) => upd(inv.id, 'invitador', Number(e.target.value) || null)} className="input mb-3 text-sm">
              <option value="">— Seleccionar —</option>
              {db.participants.filter(p => act.asistentes.includes(p.id)).map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
            </select>
            <Label>Invitado</Label>
            <select value={inv.invitado_id || ''} onChange={(e) => upd(inv.id, 'invitado_id', Number(e.target.value) || null)} className="input mb-0 text-sm">
              <option value="">— Seleccionar —</option>
              {db.participants.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
            </select>
          </div>
        ))}
        {(act.invitaciones || []).length === 0 && <Empty text="Sin invitados" />}
      </div>
    </div>
  );
}

function TabGoles({ act, A, Q, db }) {
  const add = () => {
    const ng = { id: Date.now(), pid: null, tipo: 'f', cant: 1 };
    Q('goal_add', ng, 'goles', [...(act.goles || []), ng]);
  };
  const del = (id) => Q('goal_remove', { id }, 'goles', (act.goles || []).filter(g => g.id !== id));
  const upd = (id, k, v) => Q('goal_update', { id, [k]: v }, 'goles', (act.goles || []).map(g => g.id === id ? { ...g, [k]: v } : g));

  return (
    <div>
      <div className="flex justify-between items-center mb-4"><Label style={{ margin: 0 }}>Goles Manuales</Label><button onClick={add} className="pill-btn bg-yellow-50 text-yellow-600">+ Gol</button></div>
      <div className="flex flex-col gap-2">
        {(act.goles || []).filter(g => !g.matchId).map(g => (
          <div key={g.id} className="bg-white rounded-xl p-3 border border-surface-dark flex gap-2 items-center shadow-sm">
            <select value={g.pid || ''} onChange={(e) => upd(g.id, 'pid', Number(e.target.value) || null)} className="input mb-0 flex-1 text-xs">{scorerOptions(act, db)}</select>
            <select value={g.tipo} onChange={(e) => upd(g.id, 'tipo', e.target.value)} className="input mb-0 w-24 text-xs"><option value="f">Fútbol</option><option value="h">Handball</option><option value="b">Básquet</option></select>
            <button onClick={() => del(g.id)} className="w-8 h-8 text-red-500 bg-red-50 rounded">✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function scorerOptions(act, db) {
  return [
    <option key="none" value="">— Seleccionar —</option>,
    ...db.participants.filter(p => act.asistentes.includes(p.id) && !(act.socials || []).includes(p.id)).map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)
  ];
}

function TabExtras({ act, A, db }) {
  const addE = () => A('extras', [...(act.extras || []), { id: Date.now(), pid: null, puntos: 5, motivo: '' }]);
  const addD = () => A('descuentos', [...(act.descuentos || []), { id: Date.now(), pid: null, puntos: 5, motivo: '' }]);
  const updE = (id, k, v) => A('extras', (act.extras || []).map(e => e.id === id ? { ...e, [k]: v } : e));
  const updD = (id, k, v) => A('descuentos', (act.descuentos || []).map(d => d.id === id ? { ...d, [k]: v } : d));

  return (
    <div>
      <div className="mb-4">
        <div className="flex justify-between items-center mb-3"><Label style={{ color: '#22C55E' }}>⭐ Extras (+5)</Label><button onClick={addE} className="pill-btn bg-green-50 text-green-600">+ Agregar</button></div>
        <div className="flex flex-col gap-2">{(act.extras || []).map(e => <ExtraRow key={e.id} item={e} color="#22C55E" onDel={(id) => A('extras', act.extras.filter(x => x.id !== id))} onUpd={updE} db={db} act={act} />)}</div>
      </div>
      <div>
        <div className="flex justify-between items-center mb-3"><Label style={{ color: '#FF6B6B' }}>🔻 Descuentos (-5)</Label><button onClick={addD} className="pill-btn bg-red-50 text-red-500">+ Agregar</button></div>
        <div className="flex flex-col gap-2">{(act.descuentos || []).map(d => <ExtraRow key={d.id} item={d} color="#FF6B6B" onDel={(id) => A('descuentos', act.descuentos.filter(x => x.id !== id))} onUpd={updD} db={db} act={act} />)}</div>
      </div>
    </div>
  );
}

function ExtraRow({ item, color, onDel, onUpd, db, act }) {
  return (
    <div className="bg-white rounded-xl p-3 border shadow-sm" style={{ borderColor: color + '33' }}>
      <div className="flex gap-2 mb-2">
        <select value={item.pid || ''} onChange={(e) => onUpd(item.id, 'pid', Number(e.target.value) || null)} className="input mb-0 flex-1 text-xs">{scorerOptions(act, db)}</select>
        <button onClick={() => onDel(item.id)} className="text-red-500">✕</button>
      </div>
      <input value={item.motivo} onChange={(e) => onUpd(item.id, 'motivo', e.target.value)} placeholder="Motivo..." className="input mb-0 text-xs" />
    </div>
  );
}
