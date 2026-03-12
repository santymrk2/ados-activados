import { useState, useEffect, useRef, useCallback } from 'react';
import { Toaster, toast } from 'sonner';
import { 
  FileText, Users, LayoutGrid, Gamepad2, Award, Mail, Plus, Trophy,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { newAct, newPart } from '../../lib/constants';
import { Modal, Label, Empty, SegmentedButtons } from '../ui/Common';
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
    saved: { color: 'text-green-500', label: 'Guardado ✓' },
    saving: { color: 'text-yellow-500', label: 'Guardando...' },
    error: { color: 'text-red-500', label: 'Error al guardar' },
  }[saveStatus];

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-y-auto pb-28">
      <div className="bg-primary text-white p-3 sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={onClose} className="w-11 h-11 rounded-xl bg-white/20 border-none text-white text-lg cursor-pointer flex items-center justify-center">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="font-black text-lg">{act.id ? 'Editar' : 'Nueva'} Actividad</div>
            <div className="text-xs opacity-70">{act.titulo || 'Sin título'} · {formatDate(act.fecha)}</div>
          </div>
          <span className={`text-xs font-bold ${saveStatus === 'saved' ? 'text-green-300' : saveStatus === 'saving' ? 'text-yellow-300' : 'text-red-300'}`}>
            {statusIndicator.label}
          </span>
        </div>
        <div className="flex overflow-x-auto gap-1 pb-2">
          {TABS.map(({ icon: Icon, label, key }, i) => (
            <button
              key={key}
              onClick={() => setTab(i)}
              className={`flex flex-col items-center justify-center py-2 px-2 rounded-lg min-w-[60px] flex-shrink-0 ${tab === i ? 'bg-white text-primary' : 'bg-white/20 text-white/70'}`}
            >
              <Icon className="w-4 h-4 mb-1" />
              <span className="text-[10px] font-bold">{label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="p-4">
        {tab === 0 && <TabInfo act={act} A={A} />}
        {tab === 1 && <TabAsistencia act={act} A={A} Q={Q} db={db} onSaveParticipant={onSaveParticipant} />}
        {tab === 2 && <TabEquipos act={act} A={A} Q={Q} db={db} />}
        {tab === 3 && <TabJuegos act={act} A={A} Q={Q} />}
        {tab === 4 && <TabDeportes act={act} A={A} Q={Q} db={db} />}
        {tab === 5 && <TabInvitados act={act} A={A} db={db} onSaveParticipant={onSaveParticipant} />}
        {tab === 6 && <TabGoles act={act} A={A} Q={Q} db={db} />}
        {tab === 7 && <TabExtras act={act} A={A} db={db} />}
      </div>
      <div className="fixed bottom-4 left-4 right-4 flex gap-3">
        {tab > 0 && (
          <button onClick={() => setTab((t) => t - 1)} className="flex-1 py-3 bg-surface-dark rounded-xl text-dark font-bold cursor-pointer flex items-center justify-center gap-2">
            <ChevronLeft className="w-4 h-4" />
            {TABS[tab - 1].label}
          </button>
        )}
        {tab < TABS.length - 1 && (
          <button onClick={() => setTab((t) => t + 1)} className="flex-1 py-3 bg-primary text-white rounded-xl font-bold cursor-pointer flex items-center justify-center gap-2">
            {TABS[tab + 1].label}
            <ChevronRight className="w-4 h-4" />
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
  const { TEAMS, getEdad } = require('../../lib/constants');

  const toggle = (key, id) => {
    const c = act[key] || [];
    const isIncluded = c.includes(id);
    const newValue = isIncluded ? c.filter((x) => x !== id) : [...c, id];

    if (key === 'asistentes') {
      Q('attendance', { participantId: id, value: !isIncluded }, key, newValue);
    } else if (key === 'puntuales') {
      Q('puntuales', { participantId: id, value: !isIncluded }, key, newValue);
    } else if (key === 'biblias') {
      Q('biblias', { participantId: id, value: !isIncluded }, key, newValue);
    } else {
      A(key, newValue);
    }
  };

  const sorted = [...db.participants].filter(p => 
    `${p.nombre} ${p.apellido}`.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => {
    const aKey = `${a.apellido} ${a.nombre}`;
    const bKey = `${b.apellido} ${b.nombre}`;
    return sortOrder === 'asc' ? aKey.localeCompare(bKey) : bKey.localeCompare(aKey);
  });

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Label style={{ margin: 0 }}>Asistencia ({sorted.length})</Label>
        <HelpInfo title="Control de Asistencia" text="Marcá a los participantes presentes, si fueron puntuales (+5) y si trajeron su biblia (+5)." />
      </div>
      <div className="flex gap-2 mb-3">
        <button onClick={() => A('asistentes', [])} className="pill-btn bg-red-50 text-red-500 text-xs">Limpiar</button>
        <button onClick={() => A('asistentes', sorted.map((p) => p.id))} className="pill-btn bg-teal-50 text-teal-600 text-xs">Todos</button>
      </div>
      {sorted.length === 0 && <Empty text="Primero agregá jugadores" />}
      <div className="flex flex-col gap-1">
        {sorted.map((p) => {
          const here = act.asistentes.includes(p.id);
          const punct = act.puntuales.includes(p.id);
          const bib = act.biblias.includes(p.id);
          const team = act.equipos?.[p.id];
          return (
            <div key={p.id} className="rounded-lg border" style={{ backgroundColor: here ? 'white' : '#f5f5f5', borderColor: here ? (TEAM_COLORS[team] || '#4342FF44') : '#e5e5e5' }}>
              <div className="flex items-center p-3 gap-3">
                <div onClick={() => toggle('asistentes', p.id)} className="w-6 h-6 rounded-md cursor-pointer flex items-center justify-center font-bold text-xs" style={{ backgroundColor: here ? (TEAM_COLORS[team] || '#4342FF') : '#e5e5e5', color: here ? 'white' : '#999' }}>
                  {here && '✓'}
                </div>
                <Avatar p={p} size={30} />
                <div className="flex-1">
                  <div className="font-bold text-sm" style={{ color: here ? '#1a1a1a' : '#999' }}>{p.nombre} {p.apellido}</div>
                  <div className="text-xs text-text-muted">{getEdad(p.fechaNacimiento)}a</div>
                </div>
                {here && (
                  <div className="flex gap-1 items-center">
                    {team && (
                      <span className="text-xs font-bold rounded px-2 py-1" style={{ backgroundColor: getTeamBg(team), color: TEAM_COLORS[team] }}>{team}</span>
                    )}
                    <PillBtn icon={Clock} active={punct} onClick={() => toggle('puntuales', p.id)} color="#FFD93D" />
                    <PillBtn icon={BookOpen} active={bib} onClick={() => toggle('biblias', p.id)} color="#4ECDC4" />
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

const { TEAM_COLORS, getTeamBg } = require('../../lib/constants');
const { Clock, BookOpen } = require('lucide-react');

function PillBtn({ icon: Icon, active, onClick, color }) {
  return (
    <button onClick={onClick} className="px-2 py-1 rounded-lg cursor-pointer text-sm flex items-center gap-1" style={{ border: `1px solid ${active ? color + '66' : '#e5e5e5'}`, backgroundColor: active ? color + '33' : '#f5f5f5', color: active ? color : '#999' }}>
      <Icon className="w-3.5 h-3.5" />
    </button>
  );
}

function TabEquipos({ act, A, Q, db }) {
  const { TEAMS, getEdad } = require('../../lib/constants');
  const present = db.participants.filter((p) => act.asistentes.includes(p.id));

  const setTeam = (pid, team) => {
    const eq = { ...(act.equipos || {}) };
    if (eq[pid] === team) {
      delete eq[pid];
    } else {
      eq[pid] = team;
    }
    Q('team', { participantId: pid, team: eq[pid] || null }, 'equipos', eq);
  };

  const teamStats = TEAMS.map((t) => ({
    team: t,
    total: present.filter((p) => act.equipos?.[p.id] === t).length,
    m: present.filter((p) => act.equipos?.[p.id] === t && p.sexo === 'M').length,
    f: present.filter((p) => act.equipos?.[p.id] === t && p.sexo === 'F').length,
  }));

  return (
    <div>
      {present.length === 0 && <Empty text="Sin asistentes (marcá asistencia primero)" />}
      {present.length > 0 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
            {teamStats.map(({ team, total, m, f }) => (
              <div key={team} className="rounded-lg p-2 text-center border-2" style={{ backgroundColor: getTeamBg(team), borderColor: TEAM_COLORS[team] + '44' }}>
                <div className="font-black text-sm" style={{ color: TEAM_COLORS[team] }}>{team}</div>
                <div className="font-black text-2xl">{total}</div>
                <div className="text-xs text-text-muted flex items-center justify-center gap-1"><SexBadge sex="M" className="w-4 h-4" />{m} <SexBadge sex="F" className="w-4 h-4" />{f}</div>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-1">
            {present.map((p) => {
              const cur = act.equipos?.[p.id];
              return (
                <div key={p.id} className="bg-white rounded-lg p-3 flex items-center gap-3 border" style={{ borderColor: cur ? TEAM_COLORS[cur] + '55' : '#e5e5e5' }}>
                  <Avatar p={p} size={32} />
                  <div className="flex-1">
                    <div className="font-bold text-sm">{p.nombre} {p.apellido}</div>
                    <div className="text-xs text-text-muted">{getEdad(p.fechaNacimiento)}a</div>
                  </div>
                  <div className="flex gap-1">
                    {TEAMS.map((t) => (
                      <button key={t} onClick={() => setTeam(p.id, t)} className="w-9 h-7 rounded-md cursor-pointer font-black text-xs" style={{ border: `1px solid ${TEAM_COLORS[t]}44`, backgroundColor: cur === t ? TEAM_COLORS[t] : getTeamBg(t), color: cur === t ? 'white' : '#666' }}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function TabJuegos({ act, A, Q }) {
  const { TEAMS, PTS } = require('../../lib/constants');
  
  const add = () => {
    const nj = { id: Date.now(), nombre: '', pos: {} };
    Q('game_add', nj, 'juegos', [...act.juegos, nj]);
  };
  
  const del = (id) => Q('game_delete', { id }, 'juegos', act.juegos.filter((j) => j.id !== id));
  
  const updPos = (jid, team, pos) => {
    const newList = act.juegos.map((j) => {
      if (j.id !== jid) return j;
      const newPos = { ...j.pos };
      if (newPos[team] === pos) delete newPos[team];
      else newPos[team] = pos;
      return { ...j, pos: newPos };
    });
    Q('game_pos', { juegoId: jid, pos: newList }, 'juegos', newList);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Label style={{ margin: 0 }}>Juegos</Label>
          <HelpInfo title="Puntajes de Juegos" text="🥇 1°: 10 pts | 🥈 2°: 7 pts | 🥉 3°: 4 pts | 🏅 4°: 2 pts" />
        </div>
        <button onClick={add} className="pill-btn bg-indigo-50 text-primary">+ Juego</button>
      </div>
      {act.juegos.map((j, gi) => (
        <div key={j.id} className="bg-white rounded-2xl border border-surface-dark overflow-hidden mb-3">
          <div className="flex items-center gap-3 p-3 border-b border-surface-dark">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center font-black text-primary">{gi + 1}</div>
            <input value={j.nombre} onChange={(e) => A('juegos', act.juegos.map(x => x.id === j.id ? { ...x, nombre: e.target.value } : x))} placeholder="Nombre del juego..." className="input mb-0 flex-1" />
            <button onClick={() => del(j.id)} className="w-11 h-11 rounded-xl bg-red-50 border-none text-red-500 cursor-pointer flex items-center justify-center">✕</button>
          </div>
          <div className="p-3">
            {[1, 2, 3, 4].map((pos) => {
              const team = j.pos?.[pos];
              return (
                <div key={pos} className="flex items-center gap-3 p-3 rounded-lg cursor-pointer mb-2" style={{ backgroundColor: team ? getTeamBg(team) : '#f5f5f5', border: `2px solid ${team ? TEAM_COLORS[team] : '#e5e5e5'}` }}>
                  <div className="w-12 flex items-center gap-2">
                    <span className="text-lg">{['', '🥇', '🥈', '🥉', '4°'][pos]}</span>
                    <span className="text-xs text-text-muted font-bold">+{PTS.rec[pos]}</span>
                  </div>
                  {team ? (
                    <div className="flex-1 flex items-center justify-between">
                      <span className="font-black text-xl" style={{ color: TEAM_COLORS[team] }}>{team}</span>
                      <span className="text-xs text-text-muted">toca para quitar</span>
                    </div>
                  ) : (
                    <span className="text-text-muted text-sm">—</span>
                  )}
                  {!team && TEAMS.map((t) => (
                    <button key={t} onClick={() => updPos(j.id, t, pos)} className="ml-auto px-3 py-1 rounded border font-black text-sm" style={{ borderColor: TEAM_COLORS[t], color: TEAM_COLORS[t] }}>{t}</button>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      ))}
      {act.juegos.length === 0 && <Empty text="Sin juegos" />}
    </div>
  );
}

function TabDeportes({ act, A, Q, db }) {
  const { DEPORTES } = require('../../lib/constants');
  
  const add = () => {
    const np = { id: Date.now(), deporte: 'Fútbol', genero: 'M', eq1: 'E1', eq2: 'E2', resultado: null };
    Q('partido_add', np, 'partidos', [...(act.partidos || []), np]);
  };
  
  const del = (id) => Q('partido_delete', { id }, 'partidos', (act.partidos || []).filter((p) => p.id !== id));

  const [filterGenero, setFilterGenero] = useState('all');

  const allPartidos = act.partidos || [];
  const filtered = filterGenero === 'all' ? allPartidos : allPartidos.filter(p => p.genero === filterGenero);

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <Label style={{ margin: 0 }}>Partidos</Label>
          <HelpInfo title="Puntajes de Deportes" text="✅ Ganó: +4 pts | 🤝 Empate: +2 pts | ❌ Perdió: +1 pt" />
        </div>
        <button onClick={add} className="pill-btn bg-teal-50 text-teal-600">+ Partido</button>
      </div>
      <div className="flex gap-2 mb-4">
        {[
          { val: 'all', label: 'Todos', activeBg: 'bg-primary' },
          { val: 'M', label: 'Varones', activeBg: 'bg-cyan-600' },
          { val: 'F', label: 'Mujeres', activeBg: 'bg-pink-500' },
        ].map(t => (
          <button key={t.val} onClick={() => setFilterGenero(t.val)} className={cn("flex-1 py-1.5 rounded-lg font-bold text-xs transition-all border", filterGenero === t.val ? `${t.activeBg} text-white border-transparent shadow-sm` : "bg-white text-text-muted border-surface-dark")}>
            {t.val === 'all' ? t.label : <span className="flex items-center justify-center gap-1"><SexBadge sex={t.val} /> {t.label}</span>}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <Empty text="Sin partidos" />
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((part) => (
            <div key={part.id} className="bg-white rounded-xl border border-surface-dark p-3 flex items-center justify-between">
              <div>
                <div className="font-bold text-sm">{part.deporte}</div>
                <div className="text-xs text-text-muted">{part.eq1} vs {part.eq2}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => del(part.id)} className="w-8 h-8 rounded bg-red-100 text-red-500 flex items-center justify-center text-xs">✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TabInvitados({ act, A, db, onSaveParticipant }) {
  const add = () => A('invitaciones', [...(act.invitaciones || []), { id: Date.now(), invitador: null, invitado_id: null }]);
  const del = (id) => A('invitaciones', (act.invitaciones || []).filter((i) => i.id !== id));
  const upd = (id, k, v) => A('invitaciones', (act.invitaciones || []).map((i) => (i.id === id ? { ...i, [k]: v } : i)));

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <Label style={{ margin: 0 }}>Invitaciones</Label>
          <HelpInfo title="Puntajes de Invitados" text="👤 Quien invita: +5 pts | 🆕 Invitado nuevo: +3 pts" />
        </div>
        <button onClick={add} className="pill-btn bg-teal-50 text-teal-600">+ Agregar</button>
      </div>
      <div className="flex flex-col gap-3 mt-3">
        {(act.invitaciones || []).map((inv) => {
          const invitado = db.participants.find((p) => p.id === inv.invitado_id);
          return (
            <div key={inv.id} className="bg-white rounded-xl border border-surface-dark overflow-hidden">
              <div className="p-3 flex justify-between items-center border-b border-surface-dark">
                <Label style={{ margin: 0 }}>Invitación</Label>
                <button onClick={() => del(inv.id)} className="bg-none border-none text-red-500 cursor-pointer">✕</button>
              </div>
              <div className="p-3">
                <Label>¿Quién invitó? (+5 pts)</Label>
                <select value={inv.invitador || ''} onChange={(e) => upd(inv.id, 'invitador', Number(e.target.value) || null)} className="input mb-4">
                  <option value="">— Seleccionar —</option>
                  {db.participants.filter((p) => act.asistentes.includes(p.id)).map((p) => (
                    <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>
                  ))}
                </select>
                <Label style={{ margin: 0 }}>Invitado (+3 pts)</Label>
                <select value={inv.invitado_id || ''} onChange={(e) => upd(inv.id, 'invitado_id', Number(e.target.value) || null)} className="input mb-0">
                  <option value="">— Seleccionar participante —</option>
                  {db.participants.map((p) => (
                    <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>
                  ))}
                </select>
              </div>
            </div>
          );
        })}
        {(act.invitaciones || []).length === 0 && <Empty text="Sin invitados hoy" />}
      </div>
    </div>
  );
}

function TabGoles({ act, A, Q, db }) {
  const add = () => {
    const ng = { id: Date.now(), pid: null, tipo: 'f', cant: 1 };
    Q('goal_add', ng, 'goles', [...(act.goles || []), ng]);
  };
  const del = (id) => Q('goal_remove', { id }, 'goles', (act.goles || []).filter((g) => g.id !== id));

  const upd = (id, k, v) => {
    const newList = (act.goles || []).map((g) => (g.id === id ? { ...g, [k]: v } : g));
    Q('goal_update', { id, [k]: v }, 'goles', newList);
  };

  const scorers = db.participants.filter((p) => act.asistentes.includes(p.id));

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Label style={{ margin: 0 }}>Goles</Label>
          <HelpInfo title="Puntaje de Goles" text="⚽ Cada gol suma +1 punto para el ranking anual individual." />
        </div>
        <button onClick={add} className="pill-btn bg-yellow-50 text-yellow-600">+ Gol</button>
      </div>
      <div className="flex flex-col gap-2">
        {(act.goles || []).map((g) => (
          <div key={g.id} className="bg-white rounded-xl p-3 border border-surface-dark flex gap-2 items-center">
            <select value={g.pid || ''} onChange={(e) => upd(g.id, 'pid', Number(e.target.value) || null)} className="input mb-0 flex-1 text-sm p-2">
              <option value="">— Goleador —</option>
              {scorers.map((p) => (<option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>))}
            </select>
            <button onClick={() => del(g.id)} className="w-8 h-8 rounded bg-red-100 text-red-500 flex items-center justify-center text-xs">✕</button>
          </div>
        ))}
        {(act.goles || []).length === 0 && <Empty text="Sin goles" />}
      </div>
    </div>
  );
}

function TabExtras({ act, A, db }) {
  const addE = () => A('extras', [...(act.extras || []), { id: Date.now(), pid: null, puntos: 5, motivo: '' }]);
  const addD = () => A('descuentos', [...(act.descuentos || []), { id: Date.now(), pid: null, puntos: 5, motivo: '' }]);
  const delE = (id) => A('extras', (act.extras || []).filter((e) => e.id !== id));
  const delD = (id) => A('descuentos', (act.descuentos || []).filter((d) => d.id !== id));

  const updE = (id, k, v) => A('extras', (act.extras || []).map((e) => (e.id === id ? { ...e, [k]: v } : e)));
  const updD = (id, k, v) => A('descuentos', (act.descuentos || []).map((d) => (d.id === id ? { ...d, [k]: v } : d)));

  const Row = ({ item, color, onDel, onUpd }) => (
    <div className="bg-white rounded-xl p-3 border" style={{ borderColor: color + '33' }}>
      <div className="flex gap-2 mb-2 items-center">
        <select value={item.pid || ''} onChange={(e) => onUpd('pid', Number(e.target.value) || null)} className="input mb-0 flex-1 text-sm p-2">
          <option value="">— jugadpr —</option>
          {db.participants.map((p) => (<option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>))}
        </select>
        <span style={{ color, fontWeight: 900 }}>{color === '#22C55E' ? '+' : '−'}</span>
        <button onClick={() => onUpd('puntos', Math.max(1, item.puntos - 1))} className="small-btn">−</button>
        <span className="font-black text-lg w-5 text-center">{item.puntos}</span>
        <button onClick={() => onUpd('puntos', item.puntos + 1)} className="small-btn">+</button>
        <button onClick={onDel} className="bg-none border-none text-red-500 cursor-pointer text-base w-8 h-8 flex items-center justify-center">✕</button>
      </div>
      <input value={item.motivo} onChange={(e) => onUpd('motivo', e.target.value)} placeholder="Motivo..." className="input mb-0 text-xs" />
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <Label style={{ margin: 0, color: '#22C55E' }}>⭐ Extras</Label>
        </div>
        <button onClick={addE} className="pill-btn bg-green-50 text-green-600">+ Agregar</button>
      </div>
      <div className="flex flex-col gap-2 mb-5">
        {(act.extras || []).map((e) => (
          <Row key={e.id} item={e} color="#22C55E" onDel={() => delE(e.id)} onUpd={(k, v) => updE(e.id, k, v)} />
        ))}
        {(act.extras || []).length === 0 && <Empty text="Sin puntos extra" />}
      </div>
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <Label style={{ margin: 0, color: '#FF6B6B' }}>🔻 Descuentos</Label>
        </div>
        <button onClick={addD} className="pill-btn bg-red-50 text-red-500">+ Agregar</button>
      </div>
      <div className="flex flex-col gap-2">
        {(act.descuentos || []).map((d) => (
          <Row key={d.id} item={d} color="#FF6B6B" onDel={() => delD(d.id)} onUpd={(k, v) => updD(d.id, k, v)} />
        ))}
        {(act.descuentos || []).length === 0 && <Empty text="Sin descuentos" />}
      </div>
    </div>
  );
}
