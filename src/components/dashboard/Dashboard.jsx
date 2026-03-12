import { useState, useMemo } from 'react';
import { Settings, BarChart3, Trophy, Calendar, Eye, EyeOff } from 'lucide-react';
import { TEAMS, TEAM_COLORS, getTeamBg, getEdad } from '../../lib/constants';
import { calcPts } from '../../lib/calc';
import { Section, Empty } from '../ui/Common';
import { Avatar, SexBadge } from '../ui/Badges';
import { cn, formatDate } from '../../lib/utils';

function RankRow({ p, pos, activities, showPts }) {
  const teamsPlayed = [
    ...new Set(
      (activities || []).flatMap((a) =>
        a.asistentes.includes(p.id) && a.equipos?.[p.id] ? [a.equipos[p.id]] : []
      )
    ),
  ];
  
  return (
    <div
      className={cn(
        'bg-white rounded-xl p-3 flex items-center gap-3 border relative overflow-hidden',
        pos <= 3 ? 'border-primary/30' : 'border-surface-dark'
      )}
    >
      {pos <= 3 && <div className="absolute inset-0" style={{ backgroundColor: PODIUM_COLORS[pos - 1].bg + '0A' }} />}
      <RankBadge pos={pos} />
      <Avatar p={p} size={36} />
      <div className="flex-1 z-10 min-w-0">
        <div className="font-bold truncate">{p.nombre} {p.apellido}</div>
        <div className="text-xs mt-1 flex gap-2 flex-wrap">
          <span className="text-text-muted">{p.acts} act.</span>
          {p.gf > 0 && <span className="text-text-muted font-bold">{p.gf}</span>}
          {p.gh > 0 && <span className="text-text-muted font-bold">{p.gh}</span>}
          {p.gb > 0 && <span className="text-text-muted font-bold">{p.gb}</span>}
        </div>
      </div>
      {showPts && <div className="font-black text-2xl z-10">{p.total}</div>}
    </div>
  );
}

const PODIUM_COLORS = [
  { bg: '#F59E0B', text: '#fff', shadow: '#F59E0B44' },
  { bg: '#94A3B8', text: '#fff', shadow: '#94A3B844' },
  { bg: '#B45309', text: '#fff', shadow: '#B4530944' },
];

export function Dashboard({ db, onOpenSettings }) {
  const { participants, activities } = db;
  const [showRanking, setShowRanking] = useState(false);
  const [showTopGoleadores, setShowTopGoleadores] = useState(false);
  const [topGoleadoresGender, setTopGoleadoresGender] = useState('M');

  const rankings = useMemo(() => {
    return (participants || []).map(p => {
      const stats = calcPts(p.id, activities, participants);
      return { ...p, ...stats };
    }).sort((a, b) => b.total - a.total);
  }, [participants, activities]);

  const stats = useMemo(() => {
    const jugadoresActivos = (participants || []).filter(p =>
      (activities || []).some(a => (a.asistentes || []).includes(p.id))
    ).length;

    const totalGoles = (activities || []).reduce((acc, a) =>
      acc + (a.goles || []).reduce((s, g) => s + g.cant, 0), 0
    );

    const avgAsistencia = activities.length
      ? Math.round(activities.reduce((acc, a) => acc + (a.asistentes || []).length, 0) / activities.length)
      : 0;

    const masGoles = {
      f: (activities || []).reduce((acc, a) => acc + (a.goles || []).filter(g => g.tipo === 'f').reduce((s, g) => s + g.cant, 0), 0),
      h: (activities || []).reduce((acc, a) => acc + (a.goles || []).filter(g => g.tipo === 'h').reduce((s, g) => s + g.cant, 0), 0),
      b: (activities || []).reduce((acc, a) => acc + (a.goles || []).filter(g => g.tipo === 'b').reduce((s, g) => s + g.cant, 0), 0),
    };

    const top5ScorersM = rankings
      .filter(p => p.sexo === 'M')
      .map(p => ({ ...p, goals: (p.gf || 0) + (p.gh || 0) + (p.gb || 0) }))
      .filter(p => p.goals > 0)
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 5);

    const top5ScorersF = rankings
      .filter(p => p.sexo === 'F')
      .map(p => ({ ...p, goals: (p.gf || 0) + (p.gh || 0) + (p.gb || 0) }))
      .filter(p => p.goals > 0)
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 5);

    return {
      jugadoresActivos,
      porcentajeActivos: participants.length ? Math.round((jugadoresActivos / participants.length) * 100) : 0,
      totalGoles,
      avgAsistencia,
      masGoles,
      totalPartidos: (activities || []).reduce((acc, a) => acc + (a.partidos || []).length, 0),
      top5ScorersM,
      top5ScorersF
    };
  }, [rankings, participants, activities]);

  const lastActs = useMemo(() =>
    [...activities].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).slice(0, 5),
    [activities]);

  const topScorers = topGoleadoresGender === 'M' ? stats.top5ScorersM : stats.top5ScorersF;

  return (
    <div>
      <div className="bg-primary text-white p-4 pb-3">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-2xl font-black tracking-tight" style={{ fontFamily: 'ClashGrotesk, sans-serif' }}>ACTIVADOS</div>
            <h1 className="text-lg font-bold mt-1 opacity-80">Dashboard</h1>
          </div>
          <button
            onClick={onOpenSettings}
            className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <div className="bg-white/10 rounded-xl p-3 text-center border border-white/20">
            <div className="text-2xl font-black text-accent">{activities.length}</div>
            <div className="text-xs font-bold opacity-60">Actividades</div>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center border border-white/20">
            <div className="text-2xl font-black text-accent">{stats.jugadoresActivos}/{participants.length}</div>
            <div className="text-xs font-bold opacity-60">Activos ({stats.porcentajeActivos}%)</div>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center border border-white/20">
            <div className="text-2xl font-black text-accent">{stats.totalGoles}</div>
            <div className="text-xs font-bold opacity-60">Goles Totales</div>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center border border-white/20">
            <div className="text-2xl font-black text-accent">{stats.avgAsistencia}</div>
            <div className="text-xs font-bold opacity-60">Promedio/Actividad</div>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="bg-white rounded-xl p-4 border border-surface-dark mb-4">
          <div className="font-bold text-sm mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            ESTADÍSTICAS GENERALES
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between items-center p-2 bg-surface-dark rounded-lg">
              <span className="text-text-muted">Fútbol</span>
              <span className="font-black text-primary">{stats.masGoles.f || 0}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-surface-dark rounded-lg">
              <span className="text-text-muted">Handball</span>
              <span className="font-black text-primary">{stats.masGoles.h || 0}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-surface-dark rounded-lg">
              <span className="text-text-muted">Básquet</span>
              <span className="font-black text-primary">{stats.masGoles.b || 0}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-surface-dark rounded-lg">
              <span className="text-text-muted">Partidos</span>
              <span className="font-black text-primary">{stats.totalPartidos}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <Section icon={Trophy} title="Top Goleadores" />
          <button
            onClick={() => setShowTopGoleadores(!showTopGoleadores)}
            className="w-11 h-11 rounded-xl bg-white border border-surface-dark flex items-center justify-center text-primary active:scale-95 transition-transform"
          >
            {showTopGoleadores ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        {showTopGoleadores && (
          <div className="bg-white rounded-xl p-4 border border-surface-dark mb-4">
            <div className="flex gap-2 mb-4">
              {[
                { val: 'M', label: 'Varones', color: 'text-cyan-600', bg: 'bg-cyan-50', activeBg: 'bg-cyan-600' },
                { val: 'F', label: 'Mujeres', color: 'text-pink-500', bg: 'bg-pink-50', activeBg: 'bg-pink-500' },
              ].map(t => (
                <button
                  key={t.val}
                  onClick={() => setTopGoleadoresGender(t.val)}
                  className={cn(
                    "flex-1 py-1.5 rounded-lg font-bold text-xs transition-all border",
                    topGoleadoresGender === t.val
                      ? `${t.activeBg} text-white border-transparent shadow-sm`
                      : `bg-white text-text-muted border-surface-dark`
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              {topScorers.length === 0 ? (
                <div className="text-center py-4 text-xs text-text-muted italic">Aún no hay goles registrados</div>
              ) : (
                topScorers.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3 p-2 bg-surface-dark rounded-xl">
                    <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-[10px] font-black text-primary shadow-sm">
                      {i + 1}
                    </div>
                    <Avatar p={p} size={28} />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs truncate">{p.nombre} {p.apellido}</div>
                    </div>
                    <div className="font-black text-primary bg-white px-2 py-1 rounded-lg text-xs shadow-sm">
                      {p.goals} <span className="text-[10px] opacity-50 font-bold">goles</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-4">
          <Section icon={Trophy} title="Ranking Individual" />
          <button
            onClick={() => setShowRanking(!showRanking)}
            className="w-11 h-11 rounded-xl bg-white border border-surface-dark flex items-center justify-center text-primary active:scale-95 transition-transform"
          >
            {showRanking ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        {showRanking && (
          <>
            {rankings.length === 0 ? (
              <Empty text="Aún no hay participantes" />
            ) : (
              <div className="flex flex-col gap-2 mb-5">
                {rankings.slice(0, 10).map((p, i) => (
                  <RankRow key={p.id} p={p} pos={i + 1} activities={activities} showPts />
                ))}
              </div>
            )}
          </>
        )}
        
        {lastActs.length > 0 && (
          <>
            <Section icon={Calendar} title="Últimas Actividades" />
            <div className="flex flex-col gap-2">
              {lastActs.map((a) => (
                <div
                  key={a.id}
                  className="bg-white rounded-xl p-4 border border-surface-dark flex justify-between"
                >
                  <div>
                    <div className="font-bold">{a.titulo || formatDate(a.fecha)}</div>
                    <div className="text-sm text-text-muted mt-1">
                      {formatDate(a.fecha)} · {a.asistentes.length} presentes
                    </div>
                  </div>
                  <div className="text-sm text-primary font-bold">
                    {a.juegos.length}j · {(a.partidos || []).length}p
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
