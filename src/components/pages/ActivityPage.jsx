import { useMemo, useState } from 'react';
import { navigate } from 'astro:transitions/client';
import {
  LayoutGrid, Trophy, Award, Gamepad2, ChevronLeft,
  List, Table2, Eye, EyeOff, Clock, BookOpen, HelpCircle, Coffee,
  Volleyball
} from 'lucide-react';
import { TEAMS, TEAM_COLORS, getTeamBg, PTS } from '../../lib/constants';
import { actPts, actGoles, calcDayTeamPts } from '../../lib/calc';
import { Empty, Section } from '../ui/Common';
import { Avatar } from '../ui/Avatar';
import { SexBadge, RankBadge } from '../ui/Badges';
import { HelpInfo } from '../ui/HelpInfo';
import { TeamTable } from '../ui/TeamTable';
import { cn, formatDate } from '../../lib/utils';
import { useApp } from '../../hooks/useApp';
import { usePolling } from '../../hooks/usePolling';
import { DEPORTES, GENEROS } from '../../lib/constants';

const PODIUM_COLORS = [
  { bg: '#F59E0B', text: '#fff', shadow: '#F59E0B44' },
  { bg: '#94A3B8', text: '#fff', shadow: '#94A3B844' },
  { bg: '#B45309', text: '#fff', shadow: '#B4530944' },
];



export default function ActivityPage({ id }) {
  const { db, refresh } = useApp();
  const { activities, participants } = db;

  const act = useMemo(() => activities.find(a => a.id === Number(id)), [activities, id]);

  usePolling(refresh, 5000);

  if (!act) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-muted">Actividad no encontrada</p>
          <button onClick={() => { navigate('/activities'); }} className="text-primary font-bold mt-2">
            Volver a actividades
          </button>
        </div>
      </div>
    );
  }

  const activeTeams = useMemo(() => TEAMS.slice(0, act.cantEquipos || 4), [act.cantEquipos]);
  const dayPts = useMemo(() => calcDayTeamPts(act, participants || []), [act, participants]);
  const teamRank = activeTeams.map((t) => ({ team: t, pts: dayPts[t] || 0 })).sort((a, b) => b.pts - a.pts);
  const maxTeamPts = Math.max(...teamRank.map((t) => t.pts), 1);

  const playerRank = useMemo(
    () =>
      (act.asistentes || [])
        .map((pid) => {
          const p = (participants || []).find((x) => x.id === pid);
          if (!p) return null;
          return { ...p, pts: actPts(pid, act, participants || []), goles: actGoles(pid, act) };
        })
        .filter(Boolean)
        .sort((a, b) => b.pts - a.pts),
    [act, participants]
  );

  const [tab, setTab] = useState(0);
  const [teamViewMode, setTeamViewMode] = useState('list');
  const [showScorers, setShowScorers] = useState(false);

  const TABS = [
    { icon: LayoutGrid, label: 'Equipos' },
    { icon: Trophy, label: 'Ranking' },
    { icon: Award, label: 'Goleadores' },
    { icon: Gamepad2, label: 'Juegos' },
    { icon: Volleyball, label: 'Deportes' },
  ];

  const scorersByDeporte = useMemo(() => {
    const res = { f: [], h: [], b: [] };
    act.asistentes.forEach(pid => {
      const p = participants.find(x => x.id === pid);
      if (!p) return;
      ['f', 'h', 'b'].forEach(tipo => {
        const cant = (act.goles || []).filter(g => g.pid === pid && g.tipo === tipo).reduce((s, g) => s + g.cant, 0);
        if (cant > 0) {
          res[tipo].push({ ...p, goles: cant, tipo });
        }
      });
    });
    Object.keys(res).forEach(k => res[k].sort((a, b) => b.goles - a.goles));
    return res;
  }, [act, participants]);

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary text-white p-4 sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => history.back()} className="w-11 h-11 rounded-xl bg-white/20 border-none text-white text-lg flex items-center justify-center">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="font-black text-lg">{act.titulo || 'Actividad'}</div>
            <div className="text-sm opacity-70">{formatDate(act.fecha)} · {act.asistentes.length} presentes</div>
          </div>
          <button onClick={() => { navigate(`/activities/${id}/edit`); }} className="bg-white/20 rounded-lg px-4 py-2 text-accent font-bold text-sm border border-white/30">
            Editar
          </button>
        </div>
      </div>

      <div className="p-5">
        {tab === 0 && (
          <div>
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setTeamViewMode('list')}
                className={cn(
                  'flex-1 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1 border transition-all',
                  teamViewMode === 'list' ? 'bg-primary text-white border-primary' : 'bg-white text-text-muted border-surface-dark'
                )}
              >
                <List className="w-3.5 h-3.5" /> Ranking
              </button>
              <button
                onClick={() => setTeamViewMode('table')}
                className={cn(
                  'flex-1 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1 border transition-all',
                  teamViewMode === 'table' ? 'bg-primary text-white border-primary' : 'bg-white text-text-muted border-surface-dark'
                )}
              >
                <Table2 className="w-3.5 h-3.5" /> Por Equipos
              </button>
            </div>

            {teamViewMode === 'list' && (
              <>
                <div className="flex flex-col gap-2 mb-5">
                  {teamRank.map(({ team, pts }, i) => (
                    <div
                      key={team}
                      className="rounded-2xl p-4 flex items-center gap-3 border-2"
                      style={{ backgroundColor: getTeamBg(team), borderColor: i === 0 ? TEAM_COLORS[team] : TEAM_COLORS[team] + '44' }}
                    >
                      <RankBadge pos={i + 1} />
                      <div className="font-black text-xl" style={{ color: TEAM_COLORS[team] }}>
                        {team}
                      </div>
                      <div className="flex-1 bg-black/30 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${(pts / maxTeamPts) * 100}%`, backgroundColor: TEAM_COLORS[team] }}
                        />
                      </div>
                      <div className="font-black text-2xl">{pts}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {teamViewMode === 'table' && (
              <TeamTable act={act} participants={participants || []} readOnly={true} />
            )}
          </div>
        )}

        {tab === 1 && (
          <div>
            <div className="flex justify-end mb-2">
              <HelpInfo title="Ranking del día" text="Estas posiciones se calculan en base a la asistencia, puntualidad, biblia, logros en juegos y desempeño en deportes de esta actividad específica." />
            </div>
            {playerRank.length === 0 ? (
              <Empty text="Sin asistentes" />
            ) : (
              <>
                {playerRank.length >= 1 && (
                  <div className="flex items-end justify-center gap-2 mt-4 mb-2 px-2">
                    {playerRank[1] && (
                      <div className="flex flex-col items-center flex-1 min-w-0">
                        <Avatar p={playerRank[1]} size={48} />
                        <div className="text-xs font-bold mt-1 text-center truncate w-full px-1">{playerRank[1].nombre} {playerRank[1].apellido[0]}.</div>
                        {act.equipos?.[playerRank[1].id] && (
                          <span className="text-[10px] font-bold" style={{ color: TEAM_COLORS[act.equipos[playerRank[1].id]] }}>{act.equipos[playerRank[1].id]}</span>
                        )}
                        <div className="w-full mt-2 rounded-t-xl flex items-center justify-center pt-2 pb-1" style={{ backgroundColor: PODIUM_COLORS[1].bg, minHeight: 56 }}>
                          <span className="text-white font-black text-xl">2</span>
                        </div>
                      </div>
                    )}
                    <div className="flex flex-col items-center flex-1 min-w-0">
                      <Avatar p={playerRank[0]} size={64} />
                      <div className="text-sm font-black mt-1 text-center truncate w-full px-1">{playerRank[0].nombre} {playerRank[0].apellido[0]}.</div>
                      {act.equipos?.[playerRank[0].id] && (
                        <span className="text-[10px] font-bold" style={{ color: TEAM_COLORS[act.equipos[playerRank[0].id]] }}>{act.equipos[playerRank[0].id]}</span>
                      )}
                      <div className="w-full mt-2 rounded-t-xl flex items-center justify-center pt-2 pb-1" style={{ backgroundColor: PODIUM_COLORS[0].bg, minHeight: 80 }}>
                        <span className="text-white font-black text-2xl">1</span>
                      </div>
                    </div>
                    {playerRank[2] && (
                      <div className="flex flex-col items-center flex-1 min-w-0">
                        <Avatar p={playerRank[2]} size={40} />
                        <div className="text-xs font-bold mt-1 text-center truncate w-full px-1">{playerRank[2].nombre} {playerRank[2].apellido[0]}.</div>
                        {act.equipos?.[playerRank[2].id] && (
                          <span className="text-[10px] font-bold" style={{ color: TEAM_COLORS[act.equipos[playerRank[2].id]] }}>{act.equipos[playerRank[2].id]}</span>
                        )}
                        <div className="w-full mt-2 rounded-t-xl flex items-center justify-center pt-2 pb-1" style={{ backgroundColor: PODIUM_COLORS[2].bg, minHeight: 44 }}>
                          <span className="text-white font-black text-lg">3</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {playerRank.length > 3 && (
                  <div className="flex flex-col gap-1 mt-3">
                    {playerRank.slice(3).map((p, i) => (
                      <div key={p.id} className="bg-white rounded-xl p-3 flex items-center gap-3 border border-surface-dark">
                        <div className="w-7 h-7 flex items-center justify-center font-light text-sm text-text-muted flex-shrink-0">{i + 4}</div>
                        <Avatar p={p} size={30} />
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm truncate">{p.nombre} {p.apellido}</div>
                          <div className="text-xs text-text-muted mt-0.5 flex items-center gap-1">
                            {act.equipos?.[p.id] && (
                              <span style={{ color: TEAM_COLORS[act.equipos[p.id]] }} className="font-bold">{act.equipos[p.id]} · </span>
                            )}
                            {(act.socials || []).includes(p.id) && <span className="text-[10px] bg-amber-100 text-amber-600 px-1 rounded font-bold">SOCIAL</span>}
                            {act.puntuales.includes(p.id) && <Clock className="w-3 h-3" />}
                            {act.biblias.includes(p.id) && <BookOpen className="w-3 h-3" />}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {tab === 3 && (
          <JuegosMixtosView juegos={act.juegos || []} />
        )}

        {tab === 2 && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <HelpInfo title="Goleadores" text="Aquí se listan los goleadores registrados en los partidos de hoy (Fútbol, Handball, Básquet) y los goles cargados manualmente." />
                <span className="text-xs text-text-muted font-bold uppercase">Goleadores</span>
              </div>
              <button onClick={() => setShowScorers(!showScorers)} className="w-11 h-11 rounded-xl bg-white border border-surface-dark flex items-center justify-center text-primary active:scale-95 transition-transform">
                {showScorers ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {showScorers && (
              <div className="flex flex-col gap-6">
                {[
                  { key: 'f', label: '⚽ Fútbol' },
                  { key: 'h', label: '🤾 Handball' },
                  { key: 'b', label: '🏀 Básquet' },
                ].map(({ key, label }) => {
                  const items = scorersByDeporte[key];
                  if (items.length === 0) return null;
                  return (
                    <div key={key}>
                      <div className="font-black text-sm text-primary mb-3 uppercase tracking-wider">{label}</div>
                      <div className="flex flex-col gap-2">
                        {items.map((p, i) => (
                          <div key={`${p.id}-${key}`} className="bg-white rounded-xl p-3 flex items-center gap-3 border border-surface-dark">
                            <div className="w-7 h-7 flex items-center justify-center font-black text-xs bg-surface-dark rounded-full flex-shrink-0">
                              {i + 1}
                            </div>
                            <Avatar p={p} size={30} />
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-sm truncate">{p.nombre} {p.apellido}</div>
                              {act.equipos?.[p.id] && (
                                <div className="text-[10px] font-bold" style={{ color: TEAM_COLORS[act.equipos[p.id]] }}>{act.equipos[p.id]}</div>
                              )}
                            </div>
                            <div className="font-black text-lg">⚽ {p.goles}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {Object.values(scorersByDeporte).every(l => l.length === 0) && <Empty text="Sin goles registrados" />}
              </div>
            )}
            {!showScorers && <Empty text="Goleadores ocultos" />}
          </div>
        )}

        {tab === 4 && (
          <PartidosView partidos={act.partidos || []} />
        )}
      </div>

      <div className="fixed px-3 py-2 bottom-4 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-xl shadow-black/10 border border-surface-dark flex z-50 p-1.5 w-full max-w-[calc(100vw-2rem)] transition-all">
        <div className="flex items-center overflow-x-auto gap-0.5 no-scrollbar max-w-full justify-start">
          {TABS.map(({ icon: Icon, label }, i) => (
            <button
              key={i}
              onClick={() => setTab(i)}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all flex-shrink-0 min-w-[70px]",
                tab === i ? "text-primary bg-primary/10 shadow-sm" : "text-text-muted hover:text-primary "
              )}
            >
              <Icon className={cn("w-5 h-5 mb-0.5", tab === i ? "scale-110" : "scale-100")} />
              <span className="text-[9px] font-bold tracking-wide uppercase">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function JuegosMixtosView({ juegos }) {
  if ((juegos || []).length === 0) {
    return <Empty text="Sin juegos registrados" />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="font-bold text-sm text-text-muted mb-2 flex items-center gap-2">
        <Gamepad2 className="w-4 h-4" /> Juegos Mixtos
      </div>
      {juegos.map((j, gi) => {
        const activeTeams = TEAMS.slice(0, act.cantEquipos || 4);
        const sorted = activeTeams.map((t) => ({ t, pos: j.pos?.[t] || 99 })).filter((x) => x.pos !== 99).sort((a, b) => a.pos - b.pos);
        const medals = ['', '🥇', '🥈', '🥉', '4°', '5°', '6°'];
        return (
          <div key={j.id} className="bg-white rounded-xl border border-surface-dark overflow-hidden">
            <div className="p-3 border-b border-surface-dark font-bold">
              {j.nombre || `Juego ${gi + 1}`}
            </div>
            <div className="flex">
              {sorted.map(({ t, pos }) => (
                <div
                  key={t}
                  className={cn('flex-1 p-3 text-center', pos === 1 ? 'bg-surface-dark' : '')}
                >
                  <div className="text-xl mb-1">{medals[pos]}</div>
                  <div className="font-black mt-1" style={{ color: TEAM_COLORS[t] }}>
                    {t}
                  </div>
                  <div className="text-xs text-text-muted">+{PTS.rec[pos] || 0}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PartidosView({ partidos }) {
  const [filterGenero, setFilterGenero] = useState('all');

  const filtered = filterGenero === 'all' ? partidos : partidos.filter(p => p.genero === filterGenero);
  const byDeporte = DEPORTES.reduce((acc, d) => {
    const group = filtered.filter(p => p.deporte === d);
    if (group.length > 0) acc[d] = group;
    return acc;
  }, {});

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {[
          { val: 'all', label: 'Todos', activeBg: 'bg-primary' },
          { val: 'M', label: 'Varones', activeBg: 'bg-cyan-600' },
          { val: 'F', label: 'Mujeres', activeBg: 'bg-pink-500' },
          { val: 'MX', label: 'Mixto', activeBg: 'bg-indigo-600' },
        ].map(t => (
          <button
            key={t.val}
            onClick={() => setFilterGenero(t.val)}
            className={cn(
              "flex-1 py-1.5 rounded-lg font-bold text-xs transition-all border",
              filterGenero === t.val ? `${t.activeBg} text-white border-transparent shadow-sm` : "bg-white text-text-muted border-surface-dark"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <Empty text="Sin partidos para este filtro" />
      ) : (
        <div className="flex flex-col gap-5">
          {Object.entries(byDeporte).map(([deporte, parts]) => (
            <div key={deporte}>
              <div className="flex items-center gap-2 mb-2">
                <Gamepad2 className="w-4 h-4 text-primary" />
                <span className="font-black text-sm">{deporte}</span>
                <span className="text-xs text-text-muted">({parts.length} partido{parts.length !== 1 ? 's' : ''})</span>
              </div>
              <div className="flex flex-col gap-3">
                {parts.map(part => <PartidoReadOnlyCard key={part.id} part={part} />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PartidoReadOnlyCard({ part }) {
  const isEmpate = part.resultado === 'empate';
  const isEq1Win = part.resultado === 'eq1';
  const isEq2Win = part.resultado === 'eq2';

  const TeamBox = ({ team, isWinner, isDraw, isLoser }) => (
    <div className="flex flex-col items-center gap-1">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center font-black text-xl transition-all"
        style={{
          backgroundColor: isWinner ? '#22C55E' : isDraw ? '#EAB308' : isLoser ? '#f5f5f5' : getTeamBg(team),
          color: isWinner || isDraw ? '#fff' : isLoser ? '#ccc' : TEAM_COLORS[team],
          boxShadow: isWinner ? '0 0 0 3px #22C55E44' : isDraw ? '0 0 0 3px #EAB30844' : 'none',
        }}
      >
        {team}
      </div>
      {isWinner && <span className="text-[10px] font-bold text-green-600 uppercase tracking-wide">Ganó</span>}
      {isDraw && <span className="text-[10px] font-bold text-yellow-600 uppercase tracking-wide">Empató</span>}
      {isLoser && <span className="text-[10px] text-text-muted">Perdió</span>}
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-surface-dark overflow-hidden">
      <div className="p-2 bg-surface-dark border-b border-surface-dark flex gap-2 items-center">
        <span className="text-xs text-text-muted">{part.genero}</span>
      </div>
      <div className="p-4 flex items-center justify-between gap-2">
        <TeamBox team={part.eq1} isWinner={isEq1Win} isDraw={isEmpate} isLoser={!!(part.resultado && !isEq1Win && !isEmpate)} />
        <div className="text-center flex-shrink-0">
          <span className="font-black text-text-muted text-lg">VS</span>
        </div>
        <TeamBox team={part.eq2} isWinner={isEq2Win} isDraw={isEmpate} isLoser={!!(part.resultado && !isEq2Win && !isEmpate)} />
      </div>
    </div>
  );
}

function TeamTableViewReadOnly({ act, participants }) {
  const present = participants
    .filter((p) => act.asistentes.includes(p.id))
    .sort((a, b) => `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`));

  const activeTeams = useMemo(() => TEAMS.slice(0, act.cantEquipos || 4), [act.cantEquipos]);

  const tableData = useMemo(() => {
    return activeTeams.map((team) => {
      const members = present.filter((p) => act.equipos?.[p.id] === team);
      return {
        team,
        women: members.filter((p) => p.sexo === 'F').sort((a, b) => `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`)),
        men: members.filter((p) => p.sexo === 'M').sort((a, b) => `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`)),
      };
    });
  }, [act, participants]);

  const unassigned = present.filter((p) => !act.equipos?.[p.id]).length;

  if (present.length === 0) return <Empty text="Sin asistentes en esta actividad" />;

  return (
    <div>
      {unassigned > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-xs text-yellow-700 mb-3">
          ⚠ {unassigned} jugador{unassigned > 1 ? 'es' : ''} sin equipo asignado
        </div>
      )}
      <div className="overflow-x-auto rounded-xl border border-surface-dark">
        <table className="w-full border-collapse text-sm" style={{ minWidth: activeTeams.length * 110 }}>
          <thead>
            <tr>
              {tableData.map(({ team }) => (
                <th key={team} className="p-2 text-center font-black text-xs border-b border-surface-dark" style={{ backgroundColor: getTeamBg(team), color: TEAM_COLORS[team], borderRight: `2px solid ${TEAM_COLORS[team]}33` }}>
                  {team}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {tableData.map(({ team, women }) => (
                <td key={team} className="px-1 pt-2 pb-0.5 text-center" style={{ borderRight: `2px solid ${TEAM_COLORS[team]}22`, backgroundColor: '#fdf2f8' }}>
                  <div className="flex items-center justify-center gap-1">
                    <SexBadge sex="F" />
                    <span className="text-[10px] font-bold text-pink-400 uppercase tracking-wide">Mujeres ({women.length})</span>
                  </div>
                </td>
              ))}
            </tr>
            {Array.from({ length: Math.max(...tableData.map((c) => c.women.length), 0) }).map((_, rowIdx) => (
              <tr key={`w-${rowIdx}`}>
                {tableData.map(({ team, women }) => {
                  const p = women[rowIdx];
                  return (
                    <td key={team} className="px-1 py-0.5" style={{ borderRight: `2px solid ${TEAM_COLORS[team]}22`, backgroundColor: rowIdx % 2 === 0 ? '#fdf2f822' : '#fff0f799' }}>
                      {p ? (
                        <div className="flex items-center gap-1.5 py-0.5">
                          <Avatar p={p} size={20} />
                          <span className="text-xs font-bold truncate">{p.nombre} {p.apellido[0]}.</span>
                        </div>
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr>
              {tableData.map(({ team, men }) => (
                <td key={team} className="px-1 pt-2 pb-0.5 text-center" style={{ borderRight: `2px solid ${TEAM_COLORS[team]}22`, backgroundColor: '#eff6ff' }}>
                  <div className="flex items-center justify-center gap-1">
                    <SexBadge sex="M" />
                    <span className="text-[10px] font-bold text-cyan-500 uppercase tracking-wide">Varones ({men.length})</span>
                  </div>
                </td>
              ))}
            </tr>
            {Array.from({ length: Math.max(...tableData.map((c) => c.men.length), 0) }).map((_, rowIdx) => (
              <tr key={`m-${rowIdx}`}>
                {tableData.map(({ team, men }) => {
                  const p = men[rowIdx];
                  return (
                    <td key={team} className="px-1 py-0.5" style={{ borderRight: `2px solid ${TEAM_COLORS[team]}22`, backgroundColor: rowIdx % 2 === 0 ? '#eff6ff22' : '#e0f2fe44' }}>
                      {p ? (
                        <div className="flex items-center gap-1.5 py-0.5">
                          <Avatar p={p} size={20} />
                          <span className="text-xs font-bold truncate">{p.nombre} {p.apellido[0]}.</span>
                        </div>
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr>
              {tableData.map(({ team, women, men }) => (
                <td key={team} className="p-1.5 text-center border-t border-surface-dark" style={{ backgroundColor: getTeamBg(team), borderRight: `2px solid ${TEAM_COLORS[team]}33` }}>
                  <div className="font-black text-base" style={{ color: TEAM_COLORS[team] }}>{women.length + men.length}</div>
                  <div className="text-[10px] text-text-muted">total</div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
