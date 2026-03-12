import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  TEAMS, TEAM_COLORS, getTeamBg, MEDALS, DEPORTES, GENEROS, PTS,
  newAct, newPart, SEED_PARTICIPANTS, getEdad
} from '../lib/constants';
import { actPts, actGoles, calcPts, calcDayTeamPts } from '../lib/calc';
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  Check,
  Star,
  Target,
  FileText,
  Users,
  Play,
  Mail,
  Boxes,
  X,
  Calendar,
  BarChart3,
  Clock,
  BookOpen,
  UserCheck,
  Trophy,
  Gamepad2,
  LayoutGrid,
  Award,
  PersonStanding,
  UsersRound,
  Lock,
  Eye,
  EyeOff,
  Table2,
  List,
  ArrowUpDown,
  Info,
} from 'lucide-react';
import { Toaster, toast } from 'sonner';

function cn(...inputs) {
  return inputs.filter(Boolean).join(' ');
}

import { getParticipants, getActivities, saveActivity as dbSaveActivity, deleteActivity as dbDeleteActivity, saveParticipant as dbSaveParticipant, deleteParticipant as dbDeleteParticipant, quickUpdateActivity } from '../lib/db-utils';

export default function App() {
  const [participants, setParticipants] = useState([]);
  const [activities, setActivities] = useState([]);
  const [view, setView] = useState('dashboard');
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    initDB();
  }, []);

  async function initDB() {
    try {
      const [p, a] = await Promise.all([getParticipants(), getActivities()]);
      setParticipants(p);
      setActivities(a);
    } catch (e) {
      console.error('Error loading DB:', e);
      setParticipants(SEED_PARTICIPANTS);
      setActivities([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const save = async (newDB) => {
    setParticipants(newDB.participants);
    setActivities(newDB.activities);
  };

  const db = { participants, activities, nextPid: Math.max(...participants.map(p => p.id), 0) + 1, nextAid: Math.max(...activities.map(a => a.id), 0) + 1 };

  const refreshData = async () => {
    const [p, a] = await Promise.all([getParticipants(), getActivities()]);
    setParticipants(p);
    setActivities(a);
  };

  useEffect(() => {
    const evtSource = new EventSource('/api/live');
    evtSource.onmessage = (event) => {
      refreshData();
    };
    return () => {
      evtSource.close();
    };
  }, []);

  const handleSaveActivity = async (activity, isNew) => {
    const id = await dbSaveActivity(activity, isNew);
    if (isNew) await refreshData();
    return id;
  };

  const handleQuickUpdate = async (activityId, type, data) => {
    await quickUpdateActivity(activityId, type, data);
    // No refrescamos todo el DB aquí, confiamos en el estado local y el EventSource live
  };

  const handleDeleteActivity = async (id) => {
    await dbDeleteActivity(id);
    await refreshData();
  };

  const handleSaveParticipant = async (participant, isNew, invitadorId = null) => {
    const id = await dbSaveParticipant(participant, isNew, invitadorId);
    await refreshData();
    return id;
  };

  const handleDeleteParticipant = async (id) => {
    await dbDeleteParticipant(id);
    await refreshData();
  };

  if (loading) return <Loader />;

  const openActivityView = (act) => setModal({ type: 'actview', data: act });
  const openActivityEdit = (act) => setModal({ type: 'actedit', data: act || newAct() });
  const openParticipant = (p) => setModal({ type: 'participant', data: p || newPart() });
  const openPlayerDetail = (p) => setModal({ type: 'playerdetail', data: p });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 w-full max-w-sm border border-surface-dark shadow-xl">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-black text-center mb-2">Acceso Admin</h2>
          <p className="text-text-muted text-sm text-center mb-8">Ingresá tu contraseña para continuar</p>

          <form onSubmit={(e) => {
            e.preventDefault();
            if (loginPass === (import.meta.env.PUBLIC_ADMIN_PASSWORD || 'activados2026') || loginPass === 'admin') {
              setIsAuthenticated(true);
              setLoginError(false);
            } else {
              setLoginError(true);
            }
          }}>
            <div className="relative mb-4">
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Contraseña"
                value={loginPass}
                onChange={(e) => { setLoginPass(e.target.value); setLoginError(false); }}
                className={cn("input pr-10", loginError && "border-red-500 focus:border-red-500")}
                style={{ marginBottom: 0 }}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-dark bg-transparent border-none cursor-pointer p-1 flex items-center justify-center outline-none"
                onClick={() => setShowPass(!showPass)}
              >
                {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {loginError && <p className="text-red-500 text-xs text-center mb-4 font-bold">Contraseña incorrecta</p>}
            <button type="submit" className="w-full py-3 bg-primary text-white font-bold rounded-xl active:scale-95 transition-transform">
              Ingresar
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-dark font-clash pb-20">
      <Toaster richColors position="top-center" />
      {modal?.type === 'actview' && (
        <ActivityView
          db={db}
          act={modal.data}
          onEdit={() => setModal({ type: 'actedit', data: modal.data })}
          onClose={() => setModal(null)}
          onActivityChange={refreshData}
        />
      )}
      {modal?.type === 'actedit' && (
        <ActivityForm
          db={db}
          initial={modal.data}
          onClose={() => setModal(null)}
          onSave={handleSaveActivity}
          onQuickUpdate={handleQuickUpdate}
          onSaveParticipant={handleSaveParticipant}
        />
      )}
      {modal?.type === 'participant' && (
        <ParticipantForm
          db={db}
          initial={modal.data}
          onClose={() => setModal(null)}
          onSave={handleSaveParticipant}
        />
      )}
      {modal?.type === 'playerdetail' && (
        <PlayerDetail
          player={modal.data}
          activities={activities}
          participants={participants}
          onEdit={() => setModal({ type: 'participant', data: modal.data })}
          onClose={() => setModal(null)}
        />
      )}
      {!modal && (
        <>
          {view === 'dashboard' && <Dashboard db={db} />}
          {view === 'activities' && (
            <ActivitiesList
              db={db}
              onView={openActivityView}
              onNew={() => openActivityEdit(null)}
              onEdit={openActivityEdit}
              onDelete={handleDeleteActivity}
            />
          )}
          {view === 'participants' && (
            <ParticipantsList
              db={db}
              onNew={() => openParticipant(null)}
              onEdit={openParticipant}
              onDelete={handleDeleteParticipant}
              onViewDetail={openPlayerDetail}
            />
          )}
          <BottomNav view={view} setView={setView} />
        </>
      )}
    </div>
  );
}

function Loader() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <BarChart3 className="w-16 h-16 text-primary mx-auto mb-3" />
        <div className="text-primary font-bold">Cargando...</div>
      </div>
    </div>
  );
}

function BottomNav({ view, setView }) {
  const navItems = [
    { key: 'dashboard', Icon: BarChart3 },
    { key: 'activities', Icon: Calendar },
    { key: 'participants', Icon: Users },
  ];

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-lg shadow-black/10 border border-surface-dark flex z-50 px-3 py-2 pb-safe">
      {navItems.map(({ key, Icon }) => (
        <button
          key={key}
          onClick={() => setView(key)}
          className={cn(
            'relative p-2.5 rounded-xl transition-all duration-200',
            view === key 
              ? 'text-primary bg-primary/10' 
              : 'text-text-muted hover:text-dark'
          )}
        >
          <Icon className="w-5 h-5" />
        </button>
      ))}
    </nav>
  );
}

function Dashboard({ db }) {
  const { participants, activities } = db;
  const [showRanking, setShowRanking] = useState(false);
  const [showTopGoleadores, setShowTopGoleadores] = useState(false);
  const [topGoleadoresGender, setTopGoleadoresGender] = useState('M');

  const stats = useMemo(() => {
    const totalAsistencias = activities.reduce((s, a) => s + a.asistentes.length, 0);
    const avgAsistencia = activities.length > 0 ? (totalAsistencias / activities.length).toFixed(1) : 0;
    const totalGoles = activities.reduce((s, a) => s + (a.goles || []).reduce((gs, g) => gs + g.cant, 0), 0);
    const totalPartidos = activities.reduce((s, a) => s + (a.partidos || []).length, 0);
    const jugadoresActivos = new Set(activities.flatMap(a => a.asistentes)).size;
    const porcentajeActivos = participants.length > 0 ? ((jugadoresActivos / participants.length) * 100).toFixed(0) : 0;
    const masGoles = { f: 0, h: 0, b: 0 };
    const playerGoals = {};
    activities.forEach(a => {
      (a.goles || []).forEach(g => {
        masGoles[g.tipo] = (masGoles[g.tipo] || 0) + g.cant;
        playerGoals[g.pid] = (playerGoals[g.pid] || 0) + g.cant;
      });
    });

    const allScorers = Object.entries(playerGoals)
      .map(([pid, goals]) => {
        const p = participants.find(x => x.id === Number(pid));
        if (!p) return null;
        return { ...p, goals };
      })
      .filter(Boolean)
      .sort((a, b) => b.goals - a.goals);

    const top5ScorersM = allScorers.filter(p => p.sexo === 'M').slice(0, 5);
    const top5ScorersF = allScorers.filter(p => p.sexo === 'F').slice(0, 5);

    return {
      totalAsistencias,
      avgAsistencia,
      totalGoles,
      totalPartidos,
      jugadoresActivos,
      porcentajeActivos,
      masGoles,
      top5ScorersM,
      top5ScorersF,
    };
  }, [db]);

  const rankings = useMemo(
    () =>
      participants
        .map((p) => ({ ...p, ...calcPts(p.id, activities, participants) }))
        .sort((a, b) => b.total - a.total),
    [db]
  );

  const lastActs = [...activities].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 4);

  return (
    <div>
      <div className="bg-primary text-white p-4 pb-3">
        <div className="text-3xl font-black tracking-tight" style={{ fontFamily: 'ClashGrotesk, sans-serif' }}>ACTIVADOS</div>
        <h1 className="text-lg font-bold mt-1 opacity-80">Dashboard</h1>

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
          <Section icon={Trophy} title="Top Goleadores" style={{ marginBottom: 0 }} />
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
              {(topGoleadoresGender === 'M' ? stats.top5ScorersM : stats.top5ScorersF).length === 0 ? (
                <div className="text-center py-4 text-xs text-text-muted italic">Aún no hay goles registrados</div>
              ) : (
                (topGoleadoresGender === 'M' ? stats.top5ScorersM : stats.top5ScorersF).map((p, i) => (
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
          <Section icon={Trophy} title="Ranking Individual" style={{ marginBottom: 0 }} />
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

// Reutilizable en todo el sistema: M en cyan, F en pink, igual al listado de alumnos
function SexBadge({ sex, className = '' }) {
  const isM = sex === 'M';
  return (
    <span
      className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black ${isM ? 'bg-cyan-100 text-cyan-600' : 'bg-pink-100 text-pink-500'} ${className}`}
    >
      {isM ? 'M' : 'F'}
    </span>
  );
}

const PODIUM_COLORS = [
  { bg: '#F59E0B', text: '#fff', shadow: '#F59E0B44' }, // 1° oro
  { bg: '#94A3B8', text: '#fff', shadow: '#94A3B844' }, // 2° plata
  { bg: '#B45309', text: '#fff', shadow: '#B4530944' }, // 3° bronce
];

function RankBadge({ pos }) {
  if (pos <= 3) {
    const c = PODIUM_COLORS[pos - 1];
    return (
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm z-10 flex-shrink-0"
        style={{ backgroundColor: c.bg, color: c.text, boxShadow: `0 0 0 3px ${c.shadow}` }}
      >
        {pos}
      </div>
    );
  }
  return (
    <div className="w-8 h-8 flex items-center justify-center font-light text-sm text-text-muted z-10 flex-shrink-0">
      {pos}
    </div>
  );
}

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
        <div className="font-bold truncate flex items-center gap-1"><SexBadge sex={p.sexo} /> {p.nombre} {p.apellido}</div>
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

function ActivityView({ db, act, onEdit, onClose }) {
  const { participants } = db;
  const dayPts = useMemo(() => calcDayTeamPts(act, participants), [act]);
  const teamRank = TEAMS.map((t) => ({ team: t, pts: dayPts[t] || 0 })).sort((a, b) => b.pts - a.pts);
  const maxTeamPts = Math.max(...teamRank.map((t) => t.pts), 1);

  const playerRank = useMemo(
    () =>
      act.asistentes
        .map((pid) => {
          const p = participants.find((x) => x.id === pid);
          if (!p) return null;
          return { ...p, pts: actPts(pid, act, participants), goles: actGoles(pid, act) };
        })
        .filter(Boolean)
        .sort((a, b) => b.pts - a.pts),
    [act]
  );

  const scorerRank = useMemo(() => playerRank.filter((p) => p.goles > 0).sort((a, b) => b.goles - a.goles), [playerRank]);

  const [tab, setTab] = useState(0);
  const [teamViewMode, setTeamViewMode] = useState('list'); // 'list' | 'table'
  const TABS = [
    { icon: LayoutGrid, label: 'Equipos' },
    { icon: Trophy, label: 'Ranking' },
    { icon: Award, label: 'Goleadores' },
    { icon: Gamepad2, label: 'Partidos' },
  ];

  const [showScorers, setShowScorers] = useState(false);

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
    <div className="fixed inset-0 bg-background z-50 overflow-y-auto">
      <div className="bg-primary text-white p-4 sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={onClose}
            className="w-11 h-11 rounded-xl bg-white/20 border-none text-white text-lg flex items-center justify-center"
          >
            ←
          </button>
          <div className="flex-1">
            <div className="font-black text-lg">{act.titulo || 'Actividad'}</div>
            <div className="text-sm opacity-70">{formatDate(act.fecha)} · {act.asistentes.length} presentes</div>
          </div>
          <button
            onClick={onEdit}
            className="bg-white/20 rounded-lg px-4 py-2 text-accent font-bold text-sm border border-white/30"
          >
            Editar
          </button>
        </div>
        <div className="flex">
          {TABS.map(({ icon: Icon, label }, i) => (
            <button
              key={i}
              onClick={() => setTab(i)}
              className={cn(
                'flex-1 py-2 bg-none border-none cursor-pointer font-bold text-xs flex flex-col items-center gap-1',
                tab === i ? 'text-accent border-b-2 border-accent' : 'text-white/50'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5">
        {tab === 0 && (
          <div>
            {/* View toggle */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setTeamViewMode('list')}
                className={cn(
                  'flex-1 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1 border transition-all',
                  teamViewMode === 'list'
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-text-muted border-surface-dark'
                )}
              >
                <List className="w-3.5 h-3.5" /> Ranking
              </button>
              <button
                onClick={() => setTeamViewMode('table')}
                className={cn(
                  'flex-1 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1 border transition-all',
                  teamViewMode === 'table'
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-text-muted border-surface-dark'
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
                {(act.juegos || []).length > 0 && (
                  <>
                    <div className="font-bold text-sm text-text-muted mb-3 flex items-center gap-2">
                      <Gamepad2 className="w-4 h-4" /> Juegos Mixtos
                    </div>
                    {(act.juegos || []).map((j, gi) => {
                      const sorted = TEAMS.map((t) => ({ t, pos: j.pos?.[t] || 99 })).filter((x) => x.pos !== 99).sort((a, b) => a.pos - b.pos);
                      return (
                        <div key={j.id} className="bg-white rounded-xl border border-surface-dark mb-3 overflow-hidden">
                          <div className="p-3 border-b border-surface-dark font-bold">
                            {j.nombre || `Juego ${gi + 1}`}
                          </div>
                          <div className="flex">
                            {sorted.map(({ t, pos }) => (
                              <div
                                key={t}
                                className={cn(
                                  'flex-1 p-3 text-center',
                                  pos === 1 ? 'bg-surface-dark' : ''
                                )}
                              >
                                <RankBadge pos={pos} />
                                <div className="font-black mt-1" style={{ color: TEAM_COLORS[t] }}>
                                  {t}
                                </div>
                                <div className="text-xs text-text-muted">+{PTS.rec[pos]}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </>
            )}

            {teamViewMode === 'table' && (
              <TeamTableViewReadOnly act={act} participants={participants} />
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
                {/* PODIO TOP 3 */}
                {playerRank.length >= 1 && (
                  <div className="flex items-end justify-center gap-2 mt-4 mb-2 px-2">
                    {/* 2° lugar */}
                    {playerRank[1] && (
                      <div className="flex flex-col items-center flex-1 min-w-0">
                        <Avatar p={playerRank[1]} size={48} />
                        <div className="text-xs font-bold mt-1 text-center truncate w-full px-1 flex items-center justify-center gap-1"><SexBadge sex={playerRank[1].sexo} className="w-4 h-4" /> {playerRank[1].nombre} {playerRank[1].apellido[0]}.</div>
                        {act.equipos?.[playerRank[1].id] && (
                          <span className="text-[10px] font-bold" style={{ color: TEAM_COLORS[act.equipos[playerRank[1].id]] }}>{act.equipos[playerRank[1].id]}</span>
                        )}
                        <div
                          className="w-full mt-2 rounded-t-xl flex items-center justify-center pt-2 pb-1"
                          style={{ backgroundColor: PODIUM_COLORS[1].bg, minHeight: 56 }}
                        >
                          <span className="text-white font-black text-xl">2</span>
                        </div>
                      </div>
                    )}
                    {/* 1° lugar — centro, más alto */}
                    <div className="flex flex-col items-center flex-1 min-w-0">
                      <Avatar p={playerRank[0]} size={64} />
                      <div className="text-sm font-black mt-1 text-center truncate w-full px-1 flex items-center justify-center gap-1"><SexBadge sex={playerRank[0].sexo} className="w-4 h-4" /> {playerRank[0].nombre} {playerRank[0].apellido[0]}.</div>
                      {act.equipos?.[playerRank[0].id] && (
                        <span className="text-[10px] font-bold" style={{ color: TEAM_COLORS[act.equipos[playerRank[0].id]] }}>{act.equipos[playerRank[0].id]}</span>
                      )}
                      <div
                        className="w-full mt-2 rounded-t-xl flex items-center justify-center pt-2 pb-1"
                        style={{ backgroundColor: PODIUM_COLORS[0].bg, minHeight: 80 }}
                      >
                        <span className="text-white font-black text-2xl">1</span>
                      </div>
                    </div>
                    {/* 3° lugar */}
                    {playerRank[2] && (
                      <div className="flex flex-col items-center flex-1 min-w-0">
                        <Avatar p={playerRank[2]} size={40} />
                        <div className="text-xs font-bold mt-1 text-center truncate w-full px-1 flex items-center justify-center gap-1"><SexBadge sex={playerRank[2].sexo} className="w-4 h-4" /> {playerRank[2].nombre} {playerRank[2].apellido[0]}.</div>
                        {act.equipos?.[playerRank[2].id] && (
                          <span className="text-[10px] font-bold" style={{ color: TEAM_COLORS[act.equipos[playerRank[2].id]] }}>{act.equipos[playerRank[2].id]}</span>
                        )}
                        <div
                          className="w-full mt-2 rounded-t-xl flex items-center justify-center pt-2 pb-1"
                          style={{ backgroundColor: PODIUM_COLORS[2].bg, minHeight: 44 }}
                        >
                          <span className="text-white font-black text-lg">3</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {/* RESTO desde el 4° */}
                {playerRank.length > 3 && (
                  <div className="flex flex-col gap-1 mt-3">
                    {playerRank.slice(3).map((p, i) => (
                      <div
                        key={p.id}
                        className="bg-white rounded-xl p-3 flex items-center gap-3 border border-surface-dark"
                      >
                        <div className="w-7 h-7 flex items-center justify-center font-light text-sm text-text-muted flex-shrink-0">{i + 4}</div>
                        <Avatar p={p} size={30} />
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm truncate flex items-center gap-1"><SexBadge sex={p.sexo} /> {p.nombre} {p.apellido}</div>
                          <div className="text-xs text-text-muted mt-0.5 flex items-center gap-1">
                            {act.equipos?.[p.id] && (
                              <span style={{ color: TEAM_COLORS[act.equipos[p.id]] }} className="font-bold">{act.equipos[p.id]} · </span>
                            )}
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

        {tab === 2 && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <HelpInfo title="Goleadores" text="Aquí se listan los goleadores registrados en los partidos de hoy (Fútbol, Handball, Básquet) y los goles cargados manualmente." />
                <span className="text-xs text-text-muted font-bold uppercase">Goleadores</span>
              </div>
              <button
                onClick={() => setShowScorers(!showScorers)}
                className="w-11 h-11 rounded-xl bg-white border border-surface-dark flex items-center justify-center text-primary active:scale-95 transition-transform"
              >
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
                          <div
                            key={`${p.id}-${key}`}
                            className="bg-white rounded-xl p-3 flex items-center gap-3 border border-surface-dark"
                          >
                            <div className="w-7 h-7 flex items-center justify-center font-black text-xs bg-surface-dark rounded-full flex-shrink-0">
                              {i + 1}
                            </div>
                            <Avatar p={p} size={30} />
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-sm truncate flex items-center gap-1">
                                <SexBadge sex={p.sexo} /> {p.nombre} {p.apellido}
                              </div>
                              {act.equipos?.[p.id] && (
                                <div className="text-[10px] font-bold" style={{ color: TEAM_COLORS[act.equipos[p.id]] }}>
                                  {act.equipos[p.id]}
                                </div>
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

        {tab === 3 && (
          <PartidosView partidos={act.partidos || []} />
        )}
      </div>
    </div>
  );
}

function ActivitiesList({ db, onView, onNew, onEdit, onDelete }) {
  const sorted = useMemo(() => [...db.activities].sort((a, b) => b.fecha.localeCompare(a.fecha)), [db.activities]);
  const del = (id, e) => {
    e.stopPropagation();
    if (confirm('¿Eliminar?')) {
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-1 p-3 pt-0">
                  {TEAMS.map((t) => {
                    const n = Object.entries(a.equipos || {}).filter(([pid, eq]) => eq === t && a.asistentes.includes(Number(pid))).length;
                    return (
                      <div
                        key={t}
                        className="rounded-lg p-2 text-center border"
                        style={{ backgroundColor: getTeamBg(t), borderColor: TEAM_COLORS[t] + '44' }}
                      >
                        <div className="text-xs font-bold" style={{ color: TEAM_COLORS[t] }}>
                          {t}
                        </div>
                        <div className="text-xs text-text-muted">{n} jug.</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ParticipantsList({ db, onNew, onEdit, onDelete, onViewDetail }) {
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
      <div className="p-4 pt-0">
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
              const teamsPlayed = [
                ...new Set(
                  db.activities.flatMap((a) =>
                    a.asistentes.includes(p.id) && a.equipos?.[p.id] ? [a.equipos[p.id]] : []
                  )
                ),
              ];
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
                      <SexBadge sex={p.sexo} />
                      <span className="text-text-muted">· {getEdad(p.fechaNacimiento)}a · {p.acts} act.</span>
                      {teamsPlayed.map((t) => (
                        <span key={t} className="font-bold" style={{ color: TEAM_COLORS[t] }}>
                          {t}
                        </span>
                      ))}
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

function ParticipantForm({ db, initial, onClose, onSave }) {
  const [form, setForm] = useState({ ...newPart(), ...initial });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileRef = useRef();
  const F = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handlePhoto = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 160;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const min = Math.min(img.width, img.height);
        ctx.drawImage(img, (img.width - min) / 2, (img.height - min) / 2, min, min, 0, 0, size, size);
        F('foto', canvas.toDataURL('image/jpeg', 0.75));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    if (!form.nombre.trim()) return toast.error('Ingresá el nombre');
    if (!form.fechaNacimiento) return toast.error('Ingresá la fecha de nacimiento');

    const age = getEdad(form.fechaNacimiento);
    if (age < 0 || age > 100) return toast.error('La fecha de nacimiento no es válida (edad debe estar entre 0 y 100 años).');
    if (age < 12 || age > 18) {
      if (!confirm(`¿Estás seguro que querés agregar a ${form.nombre} con una edad de ${age} años?`)) {
        return;
      }
    }

    if (isSubmitting) return;
    setIsSubmitting(true);
    const loadingToast = toast.loading('Guardando...');

    try {
      const isNew = !form.id;
      const p = isNew ? { ...form, id: db.nextPid } : form;
      await onSave(p, isNew);
      toast.dismiss(loadingToast);
      toast.success('Jugador guardado exitosamente');
      onClose();
    } catch (e) {
      toast.dismiss(loadingToast);
      toast.error('Error al guardar: ' + e.message);
      setIsSubmitting(false);
    }
  };

  return (
    <Modal title={form.id ? 'Editar Jugador' : 'Nuevo Jugador'} onClose={onClose}>
      <div className="flex flex-col items-center mb-5">
        <div
          onClick={() => fileRef.current?.click()}
          className="w-24 h-24 rounded-full bg-surface-dark border-4 border-gray-300 cursor-pointer overflow-hidden flex items-center justify-center"
        >
          {form.foto ? (
            <img src={form.foto} className="w-full h-full object-cover" />
          ) : (
            <span className="text-4xl">👤</span>
          )}
        </div>
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => fileRef.current?.click()}
            className="px-4 py-2 rounded-full bg-surface-dark text-primary font-bold text-sm border border-gray-300"
          >
            📷 Subir foto
          </button>
          {form.foto && (
            <button
              onClick={() => F('foto', '')}
              className="px-4 py-2 rounded-full bg-red-50 text-red-500 font-bold text-sm"
            >
              ✕ Quitar
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handlePhoto(e.target.files[0])} />
      </div>
      <Label>Nombre</Label>
      <input value={form.nombre} onChange={(e) => F('nombre', e.target.value)} placeholder="Nombre" className="input" />
      <Label>Apellido</Label>
      <input value={form.apellido} onChange={(e) => F('apellido', e.target.value)} placeholder="Apellido" className="input" />
      <Label>Edad</Label>
      <Label>Fecha de Nacimiento</Label>
      <input
        value={form.fechaNacimiento}
        onChange={(e) => F('fechaNacimiento', e.target.value)}
        type="date"
        className="input"
      />
      <Label>Sexo</Label>
      <SegmentedButtons
        options={[
          { val: 'M', label: <span className="flex items-center gap-1"><SexBadge sex="M" /> Varón</span> },
          { val: 'F', label: <span className="flex items-center gap-1"><SexBadge sex="F" /> Mujer</span> },
        ]}
        value={form.sexo}
        onChange={(v) => F('sexo', v)}
      />
      <button onClick={submit} disabled={isSubmitting} className="w-full py-4 bg-primary text-white font-bold text-base rounded-xl border-none cursor-pointer mt-2 disabled:opacity-50">
        {isSubmitting ? 'Cargando...' : form.id ? 'Guardar Cambios' : 'Agregar Jugador'}
      </button>
    </Modal>
  );
}

function ActivityForm({ db, initial, onClose, onSave, onQuickUpdate, onSaveParticipant }) {
  const [act, setAct] = useState({ ...newAct(), ...initial });
  const [tab, setTab] = useState(0);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'error'
  const saveTimerRef = useRef(null);
  const isFirstRender = useRef(true);
  const actRef = useRef(act);
  actRef.current = act;

  const A = (k, v) => setAct((a) => ({ ...a, [k]: v }));
  
  // Custom update for atomized fields
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

  // Auto-save with 800ms debounce ONLY for metadata (title, date) 
  // or for the entire object if it's a NEW activity.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Si es nueva, guardamos todo para que se cree el ID
    if (!act.id) {
      setSaveStatus('saving');
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        doSave(actRef.current);
      }, 800);
    } else {
      // Si ya existe, el auto-save solo debería dispararse para cambios en titulo o fecha
      // Los demás campos (asistencia, equipos, etc) se manejan por Q() atomizado.
      // Pero por ahora, para no romper nada, dejamos que guarde pero con un delay mayor
      // o detectamos si el cambio fue en titulo/fecha.
      setSaveStatus('saving');
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        doSave(actRef.current);
      }, 3000); // Delay mayor para existentes (los cambios críticos son atomizados via Q)
    }
    
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [act]); // Reacciona a cualquier cambio, pero el delay varía si es nueva o no

  const statusIndicator = {
    saved: { color: 'text-green-500', label: 'Guardado ✓' },
    saving: { color: 'text-yellow-500', label: 'Guardando...' },
    error: { color: 'text-red-500', label: 'Error al guardar' },
  }[saveStatus];

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-y-auto pb-28">
      <div className="bg-surface-dark p-3 sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={onClose}
            className="w-11 h-11 rounded-xl bg-surface-dark border border-surface-dark text-dark text-lg cursor-pointer flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="font-black text-lg">{act.id ? 'Editar' : 'Nueva'} Actividad</div>
            <div className="text-xs text-text-muted">{act.titulo || 'Sin título'} · {formatDate(act.fecha)}</div>
          </div>
          <span className={`text-xs font-bold ${statusIndicator.color}`}>{statusIndicator.label}</span>
        </div>
        <div className="flex overflow-x-auto gap-1 pb-2">
          {TABS.map(({ icon: Icon, label, key }, i) => (
            <button
              key={key}
              onClick={() => setTab(i)}
              className={`flex flex-col items-center justify-center py-2 px-2 rounded-lg min-w-[60px] flex-shrink-0 ${tab === i ? 'bg-primary text-white' : 'bg-white text-text-muted'
                }`}
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
            <ChevronUp className="w-4 h-4 rotate-90" />
            {TABS[tab - 1].label}
          </button>
        )}
        {tab < TABS.length - 1 && (
          <button
            onClick={() => setTab((t) => t + 1)}
            className="flex-1 py-3 bg-primary text-white rounded-xl font-bold cursor-pointer flex items-center justify-center gap-2"
          >
            {TABS[tab + 1].label}
            <ChevronDown className="w-4 h-4" />
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
      <input
        type="date"
        value={act.fecha}
        onChange={(e) => A('fecha', e.target.value)}
        className="input"
      />
      <div className="flex items-center gap-2">
        <Label style={{ margin: 0 }}>Preferencias</Label>
        <HelpInfo title="Flujo de Carga" text="1. Marcá Asistencia. 2. Asigná Equipos. 3. Cargá Juegos y Deportes. Los puntos se calculan automáticamente." />
      </div>
      <input
        value={act.titulo}
        onChange={(e) => A('titulo', e.target.value)}
        placeholder="Ej: Actividad Mayo"
        className="input mt-2"
      />
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
    if (age < 0 || age > 100) return toast.error('La fecha de nacimiento no es válida (edad debe estar entre 0 y 100 años).');
    if (age < 12 || age > 18) {
      if (!confirm(`¿Estás seguro que querés agregar a ${newPlayer.nombre} con una edad de ${age} años?`)) {
        return;
      }
    }

    if (isSubmittingPlayer) return;
    setIsSubmittingPlayer(true);
    const loadingToast = toast.loading('Guardando jugador...');

    try {
      const p = { ...newPart(), ...newPlayer, id: db.nextPid };
      const newId = await onSaveParticipant(p, true, newPlayer.invitadorId);
      A('asistentes', [...act.asistentes, newId || p.id]);
      setShowNewPlayer(false);
      setNewPlayer({ nombre: '', apellido: '', sexo: 'M', fechaNacimiento: '', invitadorId: null });
      toast.success('Jugador agregado y registrado');
    } catch (e) {
      toast.error('Error al guardar: ' + e.message);
    } finally {
      toast.dismiss(loadingToast);
      setIsSubmittingPlayer(false);
    }
  };

  return (
    <div>
      {showNewPlayer && (
        <div className="bg-white rounded-xl p-4 border border-primary mb-3">
          <div className="flex justify-between items-center mb-3">
            <Label style={{ margin: 0 }}>Nuevo Jugador</Label>
            <button onClick={() => setShowNewPlayer(false)} className="text-text-muted"><X /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
            <input
              value={newPlayer.nombre}
              onChange={(e) => setNewPlayer(p => ({ ...p, nombre: e.target.value }))}
              placeholder="Nombre"
              className="input mb-0 text-sm"
            />
            <input
              value={newPlayer.apellido}
              onChange={(e) => setNewPlayer(p => ({ ...p, apellido: e.target.value }))}
              placeholder="Apellido"
              className="input mb-0 text-sm"
            />
            <input
              value={newPlayer.fechaNacimiento}
              onChange={(e) => setNewPlayer(p => ({ ...p, fechaNacimiento: e.target.value }))}
              type="date"
              className="input mb-0 text-sm col-span-2"
            />
            <select
              value={newPlayer.sexo}
              onChange={(e) => setNewPlayer(p => ({ ...p, sexo: e.target.value }))}
              className="input mb-0 text-sm"
            >
              <option value="M">Varón</option>
              <option value="F">Mujer</option>
            </select>
            <select
              value={newPlayer.invitadorId || ''}
              onChange={(e) => setNewPlayer(p => ({ ...p, invitadorId: e.target.value ? Number(e.target.value) : null }))}
              className="input mb-0 text-sm"
            >
              <option value="">¿Quién lo invitó?</option>
              {db.participants.filter(p => act.asistentes.includes(p.id)).map(p => (
                <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>
              ))}
            </select>
          </div>
          <button onClick={handleCreatePlayer} disabled={isSubmittingPlayer} className="w-full py-2 bg-primary text-white font-bold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50">
            <Plus className="w-4 h-4" />
            {isSubmittingPlayer ? 'Cargando...' : 'Agregar y registrar asistencia'}
          </button>
        </div>
      )}
      <div className="flex flex-col gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar jugador..."
              className="pl-10 pr-3 py-2 w-full bg-white border border-surface-dark rounded-xl text-sm outline-none"
            />
          </div>
          <button
            onClick={() => setSortOrder('asc')}
            title="Ordenar A→Z"
            className="p-2 bg-white border border-surface-dark rounded-xl flex items-center gap-1 text-text-muted hover:text-primary"
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Label style={{ margin: 0 }}>Asistencia ({sorted.length})</Label>
          <HelpInfo 
            title="Control de Asistencia" 
            text="Marcá a los participantes presentes, si fueron puntuales (+5) y si trajeron su biblia (+5). Podés filtrar por nombre, género o limpiar la lista." 
          />
          <div className="flex gap-2 ml-auto">
            <button onClick={() => setShowNewPlayer(true)} className="pill-btn bg-primary/10 text-primary text-xs flex items-center gap-1">
              <Plus className="w-3 h-3" />
              Nuevo
            </button>
            <button onClick={() => A('asistentes', [])} className="pill-btn bg-red-50 text-red-500 text-xs">
              Limpiar
            </button>
            <button onClick={() => A('asistentes', sorted.map((p) => p.id))} className="pill-btn bg-teal-50 text-teal-600 text-xs">
              Todos
            </button>
          </div>
        </div>
      </div>
      {sorted.length === 0 && <Empty text="Primero agregá jugadores" />}
      <div className="flex flex-col gap-1">
        {sorted.map((p) => {
          const here = act.asistentes.includes(p.id);
          const punct = act.puntuales.includes(p.id);
          const bib = act.biblias.includes(p.id);
          const team = act.equipos?.[p.id];
          return (
            <div
              key={p.id}
              className="rounded-lg border"
              style={{
                backgroundColor: here ? 'white' : '#f5f5f5',
                borderColor: here ? (TEAM_COLORS[team] || '#4342FF44') : '#e5e5e5',
              }}
            >
              <div className="flex items-center p-3 gap-3">
                <div
                  onClick={() => toggle('asistentes', p.id)}
                  className="w-6 h-6 rounded-md cursor-pointer flex items-center justify-center font-bold text-xs"
                  style={{
                    backgroundColor: here ? (TEAM_COLORS[team] || '#4342FF') : '#e5e5e5',
                    color: here ? 'white' : '#999',
                  }}
                >
                  {here && '✓'}
                </div>
                <Avatar p={p} size={30} />
                <div className="flex-1">
                  <div className="font-bold text-sm" style={{ color: here ? '#1a1a1a' : '#999' }}>
                    {p.nombre} {p.apellido}
                  </div>
                  <div className="text-xs text-text-muted"><SexBadge sex={p.sexo} /> · {getEdad(p.fechaNacimiento)}a</div>
                </div>
                {here && (
                  <div className="flex gap-1 items-center">
                    {team && (
                      <span
                        className="text-xs font-bold rounded px-2 py-1"
                        style={{ backgroundColor: getTeamBg(team), color: TEAM_COLORS[team] }}
                      >
                        {team}
                      </span>
                    )}
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
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'table'

  const present = db.participants
    .filter((p) => act.asistentes.includes(p.id))
    .sort((a, b) => `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`));

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
    TEAMS.forEach((t) => {
      counts[t] = { M: 0, F: 0, total: 0 };
    });
    if (!resetAll)
      present.forEach((p) => {
        const t = eq[p.id];
        if (t) {
          counts[t][p.sexo]++;
          counts[t].total++;
        }
      });
    const unassigned = present.filter((p) => !eq[p.id]);
    const masc = unassigned.filter((p) => p.sexo === 'M'),
      fem = unassigned.filter((p) => p.sexo === 'F');
    [...masc, ...fem].forEach((p) => {
      const best = [...TEAMS].sort(
        (a, b) =>
          counts[a][p.sexo] - counts[b][p.sexo] || counts[a].total - counts[b].total
      )[0];
      eq[p.id] = best;
      counts[best][p.sexo]++;
      counts[best].total++;
    });
    A('equipos', eq);
  };

  const teamStats = TEAMS.map((t) => ({
    team: t,
    total: present.filter((p) => act.equipos?.[p.id] === t).length,
    m: present.filter((p) => act.equipos?.[p.id] === t && p.sexo === 'M').length,
    f: present.filter((p) => act.equipos?.[p.id] === t && p.sexo === 'F').length,
  }));
  const unassigned = present.filter((p) => !act.equipos?.[p.id]).length;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Label style={{ margin: 0 }}>Equipos</Label>
        <HelpInfo 
          title="Asignación de Equipos" 
          text="Asigná a cada asistente a uno de los 4 equipos (E1, E2, E3, E4). Podés usar los botones de Autocompletar o Redistribuir para balancearlos por género automáticamente." 
        />
      </div>
      {present.length === 0 && <Empty text="Sin asistentes (marcá asistencia primero)" />}
      {present.length > 0 && (
        <>
          {/* View toggle */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'flex-1 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1 border transition-all',
                viewMode === 'list'
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-text-muted border-surface-dark'
              )}
            >
              <List className="w-3.5 h-3.5" /> Lista
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                'flex-1 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1 border transition-all',
                viewMode === 'table'
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-text-muted border-surface-dark'
              )}
            >
              <Table2 className="w-3.5 h-3.5" /> Por Equipos
            </button>
          </div>

          {/* Summary row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
            {teamStats.map(({ team, total, m, f }) => (
              <div
                key={team}
                className="rounded-lg p-2 text-center border-2"
                style={{ backgroundColor: getTeamBg(team), borderColor: TEAM_COLORS[team] + '44' }}
              >
                <div className="font-black text-sm" style={{ color: TEAM_COLORS[team] }}>
                  {team}
                </div>
                <div className="font-black text-2xl">{total}</div>
                <div className="text-xs text-text-muted flex items-center justify-center gap-1"><SexBadge sex="M" className="w-4 h-4" />{m} <SexBadge sex="F" className="w-4 h-4" />{f}</div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 mb-4">
            {unassigned > 0 && (
              <button
                onClick={() => autoBalance(false)}
                className="pill-btn flex-1 bg-indigo-50 text-primary text-xs"
              >
                ⚡ Completar ({unassigned} sin asignar)
              </button>
            )}
            <button
              onClick={() => autoBalance(true)}
              className={cn('pill-btn', unassigned > 0 ? 'flex-0' : 'flex-1', 'bg-red-50 text-red-500 text-xs')}
            >
              🔀 Redistribuir todo
            </button>
          </div>
          {unassigned === 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-600 mb-3 flex items-center gap-1 flex-wrap">
              ✓ Todos asignados · <div className="flex items-center gap-1"><SexBadge sex="M" className="w-4 h-4" /> y <SexBadge sex="F" className="w-4 h-4" /></div> balanceados automáticamente
            </div>
          )}

          {viewMode === 'list' && (
            <div className="flex flex-col gap-1">
              {present.map((p) => {
                const cur = act.equipos?.[p.id];
                return (
                  <div
                    key={p.id}
                    className="bg-white rounded-lg p-3 flex items-center gap-3 border"
                    style={{ borderColor: cur ? TEAM_COLORS[cur] + '55' : '#e5e5e5' }}
                  >
                    <Avatar p={p} size={32} />
                    <div className="flex-1">
                      <div className="font-bold text-sm">{p.nombre} {p.apellido}</div>
                      <div className="text-xs text-text-muted"><SexBadge sex={p.sexo} /> · {getEdad(p.fechaNacimiento)}a</div>
                    </div>
                    <div className="flex gap-1">
                      {TEAMS.map((t) => (
                        <button
                          key={t}
                          onClick={() => setTeam(p.id, t)}
                          className="w-9 h-7 rounded-md cursor-pointer font-black text-xs"
                          style={{
                            border: `1px solid ${TEAM_COLORS[t]}44`,
                            backgroundColor: cur === t ? TEAM_COLORS[t] : getTeamBg(t),
                            color: cur === t ? 'white' : '#666',
                          }}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {viewMode === 'table' && (
            <TeamTableView act={act} db={db} />
          )}
        </>
      )}
    </div>
  );
}

function TeamTableViewReadOnly({ act, participants }) {
  // No polling here — parent (ActivityView) is already refreshed via SSE
  const present = participants
    .filter((p) => act.asistentes.includes(p.id))
    .sort((a, b) => `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`));

  const tableData = useMemo(() => {
    return TEAMS.map((team) => {
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
      <div className="overflow-x-auto rounded-xl border border-surface-dark table-wrapper">
        <table className="w-full border-collapse text-sm" style={{ minWidth: TEAMS.length * 110 }}>
          <thead>
            <tr>
              {tableData.map(({ team }) => (
                <th
                  key={team}
                  className="p-2 text-center font-black text-xs border-b border-surface-dark"
                  style={{ backgroundColor: getTeamBg(team), color: TEAM_COLORS[team], borderRight: `2px solid ${TEAM_COLORS[team]}33` }}
                >
                  {team}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Women section header */}
            <tr>
              {tableData.map(({ team, women }) => (
                <td
                  key={team}
                  className="px-1 pt-2 pb-0.5 text-center"
                  style={{ borderRight: `2px solid ${TEAM_COLORS[team]}22`, backgroundColor: '#fdf2f8' }}
                >
                  <div className="flex items-center justify-center gap-1">
                    <SexBadge sex="F" />
                    <span className="text-[10px] font-bold text-pink-400 uppercase tracking-wide">Mujeres ({women.length})</span>
                  </div>
                </td>
              ))}
            </tr>
            {/* Women rows */}
            {Array.from({ length: Math.max(...tableData.map((c) => c.women.length), 0) }).map((_, rowIdx) => (
              <tr key={`w-${rowIdx}`}>
                {tableData.map(({ team, women }) => {
                  const p = women[rowIdx];
                  return (
                    <td
                      key={team}
                      className="px-1 py-0.5"
                      style={{ borderRight: `2px solid ${TEAM_COLORS[team]}22`, backgroundColor: rowIdx % 2 === 0 ? '#fdf2f822' : '#fff0f799' }}
                    >
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
            {/* Men section header */}
            <tr>
              {tableData.map(({ team, men }) => (
                <td
                  key={team}
                  className="px-1 pt-2 pb-0.5 text-center"
                  style={{ borderRight: `2px solid ${TEAM_COLORS[team]}22`, backgroundColor: '#eff6ff' }}
                >
                  <div className="flex items-center justify-center gap-1">
                    <SexBadge sex="M" />
                    <span className="text-[10px] font-bold text-cyan-500 uppercase tracking-wide">Varones ({men.length})</span>
                  </div>
                </td>
              ))}
            </tr>
            {/* Men rows */}
            {Array.from({ length: Math.max(...tableData.map((c) => c.men.length), 0) }).map((_, rowIdx) => (
              <tr key={`m-${rowIdx}`}>
                {tableData.map(({ team, men }) => {
                  const p = men[rowIdx];
                  return (
                    <td
                      key={team}
                      className="px-1 py-0.5"
                      style={{ borderRight: `2px solid ${TEAM_COLORS[team]}22`, backgroundColor: rowIdx % 2 === 0 ? '#eff6ff22' : '#e0f2fe44' }}
                    >
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
            {/* Totals footer */}
            <tr>
              {tableData.map(({ team, women, men }) => (
                <td
                  key={team}
                  className="p-1.5 text-center border-t border-surface-dark"
                  style={{ backgroundColor: getTeamBg(team), borderRight: `2px solid ${TEAM_COLORS[team]}33` }}
                >
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

function TeamTableView({ act, db }) {
  // Auto-refresh every 3 seconds for real-time updates
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 3000);
    return () => clearInterval(id);
  }, []);

  const present = db.participants
    .filter((p) => act.asistentes.includes(p.id))
    .sort((a, b) => `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`));

  // Build table data: for each team, get women (F) and men (M) sorted
  const tableData = useMemo(() => {
    return TEAMS.map((team) => {
      const members = present.filter((p) => act.equipos?.[p.id] === team);
      return {
        team,
        women: members.filter((p) => p.sexo === 'F').sort((a, b) => `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`)),
        men: members.filter((p) => p.sexo === 'M').sort((a, b) => `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`)),
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [act, db.participants, tick]);

  const maxRows = Math.max(...tableData.map((col) => col.women.length + col.men.length + 2), 1);

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span className="text-xs text-text-muted">Actualización automática cada 3s</span>
      </div>
      <div className="overflow-x-auto rounded-xl border border-surface-dark table-wrapper">
        <table className="w-full border-collapse text-sm" style={{ minWidth: TEAMS.length * 110 }}>
          <thead>
            <tr>
              {tableData.map(({ team }) => (
                <th
                  key={team}
                  className="p-2 text-center font-black text-xs border-b border-surface-dark"
                  style={{ backgroundColor: getTeamBg(team), color: TEAM_COLORS[team], borderRight: `2px solid ${TEAM_COLORS[team]}33` }}
                >
                  {team}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Women section header */}
            <tr>
              {tableData.map(({ team, women }) => (
                <td
                  key={team}
                  className="px-1 pt-2 pb-0.5 text-center"
                  style={{ borderRight: `2px solid ${TEAM_COLORS[team]}22`, backgroundColor: '#fdf2f8' }}
                >
                  <div className="flex items-center justify-center gap-1">
                    <SexBadge sex="F" />
                    <span className="text-[10px] font-bold text-pink-400 uppercase tracking-wide">Mujeres ({women.length})</span>
                  </div>
                </td>
              ))}
            </tr>
            {/* Women rows */}
            {Array.from({ length: Math.max(...tableData.map((c) => c.women.length), 0) }).map((_, rowIdx) => (
              <tr key={`w-${rowIdx}`}>
                {tableData.map(({ team, women }) => {
                  const p = women[rowIdx];
                  return (
                    <td
                      key={team}
                      className="px-1 py-0.5"
                      style={{ borderRight: `2px solid ${TEAM_COLORS[team]}22`, backgroundColor: rowIdx % 2 === 0 ? '#fdf2f822' : '#fff0f799' }}
                    >
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
            {/* Men section header */}
            <tr>
              {tableData.map(({ team, men }) => (
                <td
                  key={team}
                  className="px-1 pt-2 pb-0.5 text-center"
                  style={{ borderRight: `2px solid ${TEAM_COLORS[team]}22`, backgroundColor: '#eff6ff' }}
                >
                  <div className="flex items-center justify-center gap-1">
                    <SexBadge sex="M" />
                    <span className="text-[10px] font-bold text-cyan-500 uppercase tracking-wide">Varones ({men.length})</span>
                  </div>
                </td>
              ))}
            </tr>
            {/* Men rows */}
            {Array.from({ length: Math.max(...tableData.map((c) => c.men.length), 0) }).map((_, rowIdx) => (
              <tr key={`m-${rowIdx}`}>
                {tableData.map(({ team, men }) => {
                  const p = men[rowIdx];
                  return (
                    <td
                      key={team}
                      className="px-1 py-0.5"
                      style={{ borderRight: `2px solid ${TEAM_COLORS[team]}22`, backgroundColor: rowIdx % 2 === 0 ? '#eff6ff22' : '#e0f2fe44' }}
                    >
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
            {/* Totals footer */}
            <tr>
              {tableData.map(({ team, women, men }) => (
                <td
                  key={team}
                  className="p-1.5 text-center border-t border-surface-dark"
                  style={{ backgroundColor: getTeamBg(team), borderRight: `2px solid ${TEAM_COLORS[team]}33` }}
                >
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

function TabJuegos({ act, A, Q }) {
  const add = () => {
    const nj = { id: Date.now(), nombre: '', pos: {} };
    Q('game_add', nj, 'juegos', [...act.juegos, nj]);
  };
  const del = (id) => {
    Q('game_delete', { id }, 'juegos', act.juegos.filter((j) => j.id !== id));
  };
  const updN = (id, v) => A('juegos', act.juegos.map((j) => (j.id === id ? { ...j, nombre: v } : j)));
  const updPos = (jid, team, pos) => {
    const newList = act.juegos.map((j) => {
      if (j.id !== jid) return j;
      const newPos = { ...j.pos };
      const prev = Object.entries(newPos).find(([t, p]) => p === pos && t !== team);
      if (prev) newPos[prev[0]] = newPos[team];
      if (newPos[team] === pos) delete newPos[team];
      else newPos[team] = pos;
      const sortedPos = Object.fromEntries(Object.entries(newPos).filter(([, v]) => v != null));
      // Trigger quick update for positions
      Q('game_pos', { juegoId: jid, pos: sortedPos }, 'juegos', act.juegos.map(g => g.id === jid ? { ...g, pos: sortedPos } : g));
      return { ...j, pos: sortedPos };
    });
    // setAct ya se hizo en Q
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Label style={{ margin: 0 }}>Juegos</Label>
          <HelpInfo 
            title="Puntajes de Juegos" 
            text="🥇 1° lugar: 10 pts | 🥈 2° lugar: 7 pts | 🥉 3° lugar: 4 pts | 🏅 4° lugar: 2 pts. Tocá +Juego para agregar y asigná las posiciones." 
          />
        </div>
        <button onClick={add} className="pill-btn bg-indigo-50 text-primary">
          + Juego
        </button>
      </div>
      <div className="flex flex-col gap-4">
        {act.juegos.map((j, gi) => (
          <JuegoCard
            key={j.id}
            j={j}
            gi={gi}
            onNombre={(v) => updN(j.id, v)}
            onDel={() => del(j.id)}
            onPos={(team, pos) => updPos(j.id, team, pos)}
          />
        ))}
      </div>
    </div>
  );
}

function JuegoCard({ j, gi, onNombre, onDel, onPos }) {
  const posToTeam = {};
  Object.entries(j.pos || {}).forEach(([t, p]) => {
    posToTeam[p] = t;
  });
  const placed = Object.keys(j.pos || {});
  const unplaced = TEAMS.filter((t) => !placed.includes(t));

  const medals = ['🥇', '🥈', '🥉', '4°'];

  return (
    <div className="bg-white rounded-2xl border border-surface-dark overflow-hidden">
      <div className="flex items-center gap-3 p-3 border-b border-surface-dark">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center font-black text-primary">
          {gi + 1}
        </div>
        <input
          value={j.nombre}
          onChange={(e) => onNombre(e.target.value)}
          placeholder="Nombre del juego..."
          className="input mb-0 flex-1"
        />
        <button
          onClick={onDel}
          className="w-11 h-11 rounded-xl bg-red-50 border-none text-red-500 cursor-pointer flex items-center justify-center"
        >
          ✕
        </button>
      </div>
      <div className="p-3">
        <div className="flex flex-col gap-2 mb-3">
          {[1, 2, 3, 4].map((pos) => {
            const team = posToTeam[pos];
            return (
              <div
                key={pos}
                onClick={() => team && onPos(team, pos)}
                className="flex items-center gap-3 p-3 rounded-lg cursor-pointer min-h-12"
                style={{
                  backgroundColor: team ? getTeamBg(team) : '#f5f5f5',
                  border: `2px solid ${team ? TEAM_COLORS[team] : '#e5e5e5'}`,
                }}
              >
                <div className="w-12 flex items-center gap-2">
                  <span className="text-lg">{medals[pos - 1]}</span>
                  <span className="text-xs text-text-muted font-bold">+{PTS.rec[pos]}</span>
                </div>
                {team ? (
                  <div className="flex-1 flex items-center justify-between">
                    <span className="font-black text-xl" style={{ color: TEAM_COLORS[team] }}>
                      {team}
                    </span>
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
            <div className="text-xs text-text-muted font-bold mb-2 uppercase tracking-wide">
              Sin posición — toca para asignar al siguiente lugar
            </div>
            <div className="flex gap-2 flex-wrap">
              {unplaced.map((t) => {
                const nextPos = [1, 2, 3, 4].find((p) => !posToTeam[p]);
                return (
                  <button
                    key={t}
                    onClick={() => nextPos && onPos(t, nextPos)}
                    className="px-5 py-2 rounded-lg border-2 cursor-pointer font-black text-lg"
                    style={{
                      borderColor: TEAM_COLORS[t],
                      backgroundColor: getTeamBg(t),
                      color: TEAM_COLORS[t],
                    }}
                  >
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
      {/* Filtro género */}
      <div className="flex gap-2 mb-4">
        {[
          { val: 'all', label: 'Todos', activeBg: 'bg-primary' },
          { val: 'M', label: 'Varones', activeBg: 'bg-cyan-600' },
          { val: 'F', label: 'Mujeres', activeBg: 'bg-pink-500' },
        ].map(t => (
          <button
            key={t.val}
            onClick={() => setFilterGenero(t.val)}
            className={cn(
              "flex-1 py-1.5 rounded-lg font-bold text-xs transition-all border",
              filterGenero === t.val 
                ? `${t.activeBg} text-white border-transparent shadow-sm` 
                : "bg-white text-text-muted border-surface-dark"
            )}
          >
            {t.val === 'all' ? t.label : <span className="flex items-center justify-center gap-1"><SexBadge sex={t.val} /> {t.label}</span>}
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
          backgroundColor: isWinner
            ? '#22C55E'
            : isDraw
            ? '#EAB308'
            : isLoser
            ? '#f5f5f5'
            : getTeamBg(team),
          color: isWinner || isDraw ? '#fff' : isLoser ? '#ccc' : TEAM_COLORS[team],
          boxShadow: isWinner
            ? '0 0 0 3px #22C55E44'
            : isDraw
            ? '0 0 0 3px #EAB30844'
            : 'none',
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
        <span className="text-xs text-text-muted">{GENEROS.find(g => g.val === part.genero)?.label}</span>
      </div>
      <div className="p-4 flex items-center justify-between gap-2">
        <TeamBox
          team={part.eq1}
          isWinner={isEq1Win}
          isDraw={isEmpate}
          isLoser={!!(part.resultado && !isEq1Win && !isEmpate)}
        />
        <div className="text-center flex-shrink-0">
          <span className="font-black text-text-muted text-lg">VS</span>
        </div>
        <TeamBox
          team={part.eq2}
          isWinner={isEq2Win}
          isDraw={isEmpate}
          isLoser={!!(part.resultado && !isEq2Win && !isEmpate)}
        />
      </div>
    </div>
  );
}

function TabDeportes({ act, A, Q, db }) {
  const [filterGenero, setFilterGenero] = useState('all');

  const add = () => {
    const np = { id: Date.now(), deporte: 'Fútbol', genero: 'M', eq1: 'E1', eq2: 'E2', resultado: null };
    Q('partido_add', np, 'partidos', [...(act.partidos || []), np]);
  };
  const del = (id) => Q('partido_delete', { id }, 'partidos', (act.partidos || []).filter((p) => p.id !== id));
  const upd = (id, k, v) => {
    const newList = (act.partidos || []).map((p) => (p.id === id ? { ...p, [k]: v } : p));
    const p = newList.find(x => x.id === id);
    Q('partido_update', p, 'partidos', newList);
  };

  const allPartidos = act.partidos || [];
  const filtered = filterGenero === 'all' ? allPartidos : allPartidos.filter(p => p.genero === filterGenero);
  const byDeporte = DEPORTES.reduce((acc, d) => {
    const group = filtered.filter(p => p.deporte === d);
    if (group.length > 0) acc[d] = group;
    return acc;
  }, {});

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <Label style={{ margin: 0 }}>Partidos</Label>
          <HelpInfo 
            title="Puntajes de Deportes" 
            text="✅ Ganó: +4 pts | 🤝 Empate: +2 pts | ❌ Perdió: +1 pt. Agregá cada partido, elegí qué equipos jugaron y el resultado." 
          />
        </div>
        <button onClick={add} className="pill-btn bg-teal-50 text-teal-600">
          + Partido
        </button>
      </div>

      {/* Filtro género */}
      <div className="flex gap-2 mb-4">
        {[
          { val: 'all', label: 'Todos', activeBg: 'bg-primary' },
          { val: 'M', label: 'Varones', activeBg: 'bg-cyan-600' },
          { val: 'F', label: 'Mujeres', activeBg: 'bg-pink-500' },
        ].map(t => (
          <button
            key={t.val}
            onClick={() => setFilterGenero(t.val)}
            className={cn(
              "flex-1 py-1.5 rounded-lg font-bold text-xs transition-all border",
              filterGenero === t.val 
                ? `${t.activeBg} text-white border-transparent shadow-sm` 
                : "bg-white text-text-muted border-surface-dark"
            )}
          >
            {t.val === 'all' ? t.label : <span className="flex items-center justify-center gap-1"><SexBadge sex={t.val} /> {t.label}</span>}
          </button>
        ))}
      </div>

      {filtered.length === 0 && allPartidos.length > 0 ? (
        <Empty text="Sin partidos para este filtro" />
      ) : null}

      <div className="flex flex-col gap-6">
        {Object.entries(byDeporte).map(([deporte, parts]) => (
          <div key={deporte}>
            <div className="flex items-center gap-2 mb-2">
              <Gamepad2 className="w-4 h-4 text-primary" />
              <span className="font-black text-sm">{deporte}</span>
              <span className="text-xs text-text-muted">({parts.length} partido{parts.length !== 1 ? 's' : ''})</span>
            </div>
            <div className="flex flex-col gap-4">
              {parts.map((part) => (
                <PartidoCard
                  key={part.id}
                  part={part}
                  act={act}
                  A={A}
                  Q={Q}
                  db={db}
                  onDel={() => del(part.id)}
                  onUpd={(k, v) => upd(part.id, k, v)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PartidoCard({ part, onDel, onUpd, act, A, Q, db }) {
  const isEq1Win = part.resultado === 'eq1';
  const isEq2Win = part.resultado === 'eq2';
  const isEmpate = part.resultado === 'empate';

  const goles = (act.goles || []).filter(g => g.matchId === part.id);
  const score1 = goles.filter(g => g.team === part.eq1).length;
  const score2 = goles.filter(g => g.team === part.eq2).length;

  // Auto-update result based on score
  useEffect(() => {
    let newRes = 'empate'; // Default to empate even if 0-0
    if (score1 > score2) newRes = 'eq1';
    else if (score2 > score1) newRes = 'eq2';

    if (newRes !== part.resultado) {
      onUpd('resultado', newRes);
    }
  }, [score1, score2]);

  const addGoal = (team) => {
    const tipoMap = { 'Fútbol': 'f', 'Handball': 'h', 'Básquet': 'b' };
    const newGoal = {
      id: Date.now(),
      pid: null,
      tipo: tipoMap[part.deporte] || 'f',
      matchId: part.id,
      team: team,
      cant: 1
    };
    Q('goal_add', newGoal, 'goles', [...(act.goles || []), newGoal]);
  };

  const delGoal = (id) => {
    Q('goal_remove', { id }, 'goles', (act.goles || []).filter(g => g.id !== id));
  };

  const updGoal = (id, pid) => {
    const newList = (act.goles || []).map(g => g.id === id ? { ...g, pid } : g);
    Q('goal_update', { id, pid }, 'goles', newList);
  };

  const getTeamPlayers = (team) => {
    return db.participants.filter(p =>
      act.asistentes.includes(p.id) &&
      act.equipos?.[p.id] === team &&
      (part.genero === 'MX' || p.sexo === part.genero)
    );
  };

  const SPORT_ICONS = {
    'Fútbol': '⚽',
    'Handball': '🤾',
    'Básquet': '🏀',
    'Vóley': '🏐',
    'Otro': '🎲'
  };

  const GEN_CONFIG = {
    'M': { icon: <SexBadge sex="M" />, label: 'Varones' },
    'F': { icon: <SexBadge sex="F" />, label: 'Mujeres' },
    'MX': { icon: <div className="flex -space-x-1.5"><SexBadge sex="M" className="w-3.5 h-3.5 border border-white" /><SexBadge sex="F" className="w-3.5 h-3.5 border border-white" /></div>, label: 'Mixto' }
  };

  return (
    <div className="bg-white rounded-2xl border border-surface-dark overflow-hidden shadow-sm">
      <div className="p-2 bg-surface-dark border-b border-surface-dark flex flex-col gap-2">
        <div className="flex justify-between items-center px-1">
          <div className="flex gap-1 overflow-x-auto no-scrollbar py-0.5">
            {DEPORTES.map(d => (
              <button
                key={d}
                onClick={() => onUpd('deporte', d)}
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all active:scale-90",
                  part.deporte === d ? "bg-white shadow-md border-2 border-primary" : "bg-white/50 opacity-40 grayscale"
                )}
              >
                {SPORT_ICONS[d] || '❓'}
              </button>
            ))}
          </div>
          <button onClick={onDel} className="w-11 h-11 rounded-xl bg-red-100 border-none text-red-500 cursor-pointer flex-shrink-0 flex items-center justify-center ml-2">
            ✕
          </button>
        </div>

        <div className="flex gap-1 px-1">
          {['M', 'F', 'MX'].map(g => (
            <button
              key={g}
              onClick={() => onUpd('genero', g)}
              className={cn(
                "flex-1 py-1.5 rounded-lg flex items-center justify-center gap-2 font-bold text-[10px] transition-all border",
                part.genero === g ? "bg-white border-primary text-primary shadow-sm" : "bg-transparent border-transparent text-text-muted opacity-60"
              )}
            >
              {GEN_CONFIG[g].icon}
              {GEN_CONFIG[g].label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-11 items-center gap-1 mb-4">
          {/* EQ 1 */}
          <div className="col-span-4 flex flex-col gap-2">
            <select
              value={part.eq1}
              onChange={(e) => onUpd('eq1', e.target.value)}
              className="input mb-0 font-black text-lg text-center p-2 rounded-xl border-2"
              style={{ backgroundColor: getTeamBg(part.eq1), color: TEAM_COLORS[part.eq1], borderColor: isEq1Win ? TEAM_COLORS[part.eq1] : 'transparent' }}
            >
              {TEAMS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <div className="flex items-center justify-center gap-2">
              <button onClick={() => addGoal(part.eq1)} className="w-10 h-10 rounded-full bg-primary text-white font-black text-xl flex items-center justify-center active:scale-95 transition-transform shadow-lg">+</button>
              <span className="text-3xl font-black w-8 text-center">{score1}</span>
            </div>
          </div>

          <div className="col-span-3 text-center flex flex-col items-center">
            <span className="font-black text-text-muted text-xs uppercase tracking-widest">VS</span>
            {isEmpate && <span className="text-[10px] font-bold text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full mt-1">EMPATE</span>}
            {!isEmpate && (isEq1Win || isEq2Win) && <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full mt-1">GANADOR</span>}
          </div>

          {/* EQ 2 */}
          <div className="col-span-4 flex flex-col gap-2">
            <select
              value={part.eq2}
              onChange={(e) => onUpd('eq2', e.target.value)}
              className="input mb-0 font-black text-lg text-center p-2 rounded-xl border-2"
              style={{ backgroundColor: getTeamBg(part.eq2), color: TEAM_COLORS[part.eq2], borderColor: isEq2Win ? TEAM_COLORS[part.eq2] : 'transparent' }}
            >
              {TEAMS.filter((t) => t !== part.eq1).map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <div className="flex items-center justify-center gap-2">
              <span className="text-3xl font-black w-8 text-center">{score2}</span>
              <button onClick={() => addGoal(part.eq2)} className="w-10 h-10 rounded-full bg-primary text-white font-black text-xl flex items-center justify-center active:scale-95 transition-transform shadow-lg">+</button>
            </div>
          </div>
        </div>

        {/* Scorers List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[part.eq1, part.eq2].map((team, idx) => (
            <div key={team} className="flex flex-col gap-1">
              <div className="text-[9px] font-bold text-text-muted uppercase mb-1">Goleadores {team}</div>
              {goles.filter(g => g.team === team).map((g, gi) => (
                <div key={g.id} className="flex gap-1 items-center">
                  <select
                    value={g.pid || ''}
                    onChange={(e) => updGoal(g.id, Number(e.target.value) || null)}
                    className="flex-1 text-[10px] p-1 border rounded bg-surface-dark outline-none font-bold"
                  >
                    <option value="">— Quién? —</option>
                    {getTeamPlayers(team).map(p => (
                      <option key={p.id} value={p.id}>{p.nombre} {p.apellido[0]}.</option>
                    ))}
                  </select>
                  <button onClick={() => delGoal(g.id)} className="w-5 h-5 rounded bg-red-100 text-red-500 text-[10px] flex items-center justify-center border-none">✕</button>
                </div>
              ))}
              {goles.filter(g => g.team === team).length === 0 && <div className="text-[10px] text-text-muted italic">Sin goles</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}



function TabInvitados({ act, A, db, onSaveParticipant, onUpdateAct }) {
  const add = () => A('invitaciones', [...(act.invitaciones || []), { id: Date.now(), invitador: null, invitado_id: null }]);
  const del = (id) => A('invitaciones', (act.invitaciones || []).filter((i) => i.id !== id));
  const upd = (id, k, v) => A('invitaciones', (act.invitaciones || []).map((i) => (i.id === id ? { ...i, [k]: v } : i)));

  const [quickAdd, setQuickAdd] = useState(null);
  const initQuick = (invId, invitadorId) => setQuickAdd({ invId, nombre: '', apellido: '', sexo: 'M', fechaNacimiento: '', invitadorId });

  const confirmQuick = async () => {
    if (!quickAdd?.nombre.trim()) return;
    const newP = {
      ...newPart(),
      id: db.nextPid,
      nombre: quickAdd.nombre,
      apellido: quickAdd.apellido,
      sexo: quickAdd.sexo,
      fechaNacimiento: quickAdd.fechaNacimiento,
    };
    await onSaveParticipant(newP, true, quickAdd.invitadorId);
    upd(quickAdd.invId, 'invitado_id', newP.id);
    A('asistentes', [...act.asistentes, newP.id]);
    setQuickAdd(null);
  };

  return (
    <div>
      {quickAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-2xl p-5 pb-8 border border-surface-dark">
            <div className="font-black text-base mb-4 flex justify-between">
              <div className="flex items-center gap-2">
                <span>👋 Nuevo participante</span>
                <HelpInfo title="Nuevo Invitado" text="Al crear este participante, se agregará a la base de datos general y quedará marcado automáticamente como asistente en esta actividad y vinculado como el invitado del usuario seleccionado." />
              </div>
              <button onClick={() => setQuickAdd(null)} className="bg-none border-none text-red-500 cursor-pointer text-lg">
                ✕
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
              <div>
                <Label>Nombre</Label>
                <input
                  value={quickAdd.nombre}
                  onChange={(e) => setQuickAdd((q) => ({ ...q, nombre: e.target.value }))}
                  placeholder="Nombre"
                  className="input mb-0"
                  autoFocus
                />
              </div>
              <div>
                <Label>Apellido</Label>
                <input
                  value={quickAdd.apellido}
                  onChange={(e) => setQuickAdd((q) => ({ ...q, apellido: e.target.value }))}
                  placeholder="Apellido"
                  className="input mb-0"
                />
              </div>
              <div>
                <Label>Fecha de Nacimiento</Label>
                <input
                  value={quickAdd.fechaNacimiento}
                  onChange={(e) => setQuickAdd((q) => ({ ...q, fechaNacimiento: e.target.value }))}
                  type="date"
                  className="input mb-0"
                />
              </div>
              <div>
                <Label>Sexo</Label>
                <div className="flex gap-2">
                  {[
                    ['M', <span className="flex items-center justify-center gap-1"><SexBadge sex="M" /> Varón</span>],
                    ['F', <span className="flex items-center justify-center gap-1"><SexBadge sex="F" /> Mujer</span>],
                  ].map(([v, l]) => (
                    <button
                      key={v}
                      onClick={() => setQuickAdd((q) => ({ ...q, sexo: v }))}
                      className="flex-1 py-3 rounded-lg border-none cursor-pointer font-bold text-xs"
                      style={{
                        backgroundColor: quickAdd.sexo === v ? '#4342FF' : '#e5e5e5',
                        color: quickAdd.sexo === v ? 'white' : '#666',
                      }}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={confirmQuick} className="w-full py-4 bg-primary text-white font-bold text-base rounded-xl border-none cursor-pointer mt-4">
              ✓ Agregar y vincular como invitado
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <Label style={{ margin: 0 }}>Invitaciones</Label>
          <HelpInfo 
            title="Puntajes de Invitados" 
            text="👤 Quien invita: +5 pts | 🆕 Invitado nuevo: +3 pts. Si el invitado es nuevo, primero agregalo como participante con el botón 'Nuevo'." 
          />
        </div>
        <button onClick={add} className="pill-btn bg-teal-50 text-teal-600">
          + Agregar
        </button>
      </div>
      <div className="flex flex-col gap-3 mt-3">
        {(act.invitaciones || []).map((inv) => {
          const invitado = db.participants.find((p) => p.id === inv.invitado_id);
          return (
            <div key={inv.id} className="bg-white rounded-xl border border-surface-dark overflow-hidden">
              <div className="p-3 flex justify-between items-center border-b border-surface-dark">
                <Label style={{ margin: 0 }}>Invitación</Label>
                <button onClick={() => del(inv.id)} className="bg-none border-none text-red-500 cursor-pointer">
                  ✕
                </button>
              </div>
              <div className="p-3">
                <Label>¿Quién invitó? (+5 pts)</Label>
                <select
                  value={inv.invitador || ''}
                  onChange={(e) => upd(inv.id, 'invitador', Number(e.target.value) || null)}
                  className="input mb-4"
                >
                  <option value="">— Seleccionar —</option>
                  {db.participants.filter((p) => act.asistentes.includes(p.id)).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} {p.apellido}
                    </option>
                  ))}
                </select>

                <div className="flex justify-between items-center mb-2">
                  <Label style={{ margin: 0 }}>Invitado (+3 pts)</Label>
                  <button
                    onClick={() => initQuick(inv.id, inv.invitador)}
                    className="pill-btn bg-indigo-50 text-primary text-xs border border-primary/30 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Nuevo
                  </button>
                </div>

                {invitado ? (
                  <div className="flex items-center gap-3 bg-surface-dark rounded-lg p-3 border border-primary/30">
                    <Avatar p={invitado} size={34} />
                    <div className="flex-1">
                      <div className="font-bold text-sm">{invitado.nombre} {invitado.apellido}</div>
                      <div className="text-xs text-text-muted"><SexBadge sex={invitado.sexo} /> · {getEdad(invitado.fechaNacimiento)}a</div>
                    </div>
                    <button
                      onClick={() => upd(inv.id, 'invitado_id', null)}
                      className="bg-none border-none text-text-muted cursor-pointer text-sm"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <select
                    value={''}
                    onChange={(e) => upd(inv.id, 'invitado_id', Number(e.target.value) || null)}
                    className="input mb-0 border-primary/30"
                  >
                    <option value="">— Seleccionar participante —</option>
                    {db.participants.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} {p.apellido}
                      </option>
                    ))}
                  </select>
                )}
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
    if (k === 'pid') {
      Q('goal_update', { id, pid: v }, 'goles', newList);
    } else {
      A('goles', newList);
    }
  };
  const scorers = db.participants.filter((p) => act.asistentes.includes(p.id));

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Label style={{ margin: 0 }}>Goles</Label>
          <HelpInfo title="Puntaje de Goles" text="⚽ Cada gol suma +1 punto para el ranking anual individual (bonus anual)." />
        </div>
        <button onClick={add} className="pill-btn bg-yellow-50 text-yellow-600">
          + Gol
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {(act.goles || []).map((g) => (
          <div key={g.id} className="bg-white rounded-xl p-3 border border-surface-dark flex gap-2 items-center">
            <div className="flex-2 flex flex-col">
              <select
                value={g.pid || ''}
                onChange={(e) => upd(g.id, 'pid', Number(e.target.value) || null)}
                className="input mb-0 text-sm p-2"
              >
                <option value="">— Goleador —</option>
                {scorers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} {p.apellido}
                  </option>
                ))}
              </select>
              {g.matchId && (
                <span className="text-[9px] font-bold text-primary mt-1 px-1">
                  MATCH {g.team}
                </span>
              )}
            </div>
            <div className="flex gap-1">
              {[
                ['f', 'F'],
                ['h', 'H'],
                ['b', 'B'],
                ].map(([t, label]) => (
                  <button
                    key={t}
                    onClick={() => upd(g.id, 'tipo', t)}
                    className="w-11 h-11 rounded-xl cursor-pointer text-sm font-bold flex items-center justify-center"
                  >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => upd(g.id, 'cant', Math.max(1, g.cant - 1))} className="small-btn">
                −
              </button>
              <span className="font-black text-lg w-6 text-center">{g.cant}</span>
              <button onClick={() => upd(g.id, 'cant', g.cant + 1)} className="small-btn">
                +
              </button>
            </div>
            {g.matchId ? (
              <div className="w-11 h-11 flex items-center justify-center text-text-muted opacity-30" title="Eliminar desde pestaña Deportes">
                <Lock className="w-4 h-4" />
              </div>
            ) : (
              <button onClick={() => del(g.id)} className="bg-none border-none text-red-500 cursor-pointer text-base w-11 h-11 flex items-center justify-center">
                ✕
              </button>
            )}
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
        <select
          value={item.pid || ''}
          onChange={(e) => onUpd('pid', Number(e.target.value) || null)}
          className="input mb-0 flex-1 text-sm p-2"
        >
          <option value="">— Jugador —</option>
          {db.participants.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre} {p.apellido}
            </option>
          ))}
        </select>
        <span style={{ color, fontWeight: 900 }}>{color === '#22C55E' ? '+' : '−'}</span>
        <button onClick={() => onUpd('puntos', Math.max(1, item.puntos - 1))} className="small-btn">
          −
        </button>
        <span className="font-black text-lg w-5 text-center">{item.puntos}</span>
        <button onClick={() => onUpd('puntos', item.puntos + 1)} className="small-btn">
          +
        </button>
        <button onClick={onDel} className="bg-none border-none text-red-500 cursor-pointer text-base">
          ✕
        </button>
      </div>
      <input
        value={item.motivo}
        onChange={(e) => onUpd('motivo', e.target.value)}
        placeholder="Motivo..."
        className="input mb-0 text-xs"
      />
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <Label style={{ margin: 0, color: '#22C55E' }}>⭐ Extras</Label>
          <HelpInfo title="Puntos Extra" text="Asigná puntos positivos por buena conducta, participación destacada o tareas especiales." />
        </div>
        <button onClick={addE} className="pill-btn bg-green-50 text-green-600">
          + Agregar
        </button>
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
          <HelpInfo title="Descuentos" text="Restá puntos por mala conducta o incumplimiento de reglas." />
        </div>
        <button onClick={addD} className="pill-btn bg-red-50 text-red-500">
          + Agregar
        </button>
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

function Avatar({ p, size = 36 }) {
  const initials = `${p.nombre?.[0] || ''}${p.apellido?.[0] || ''}`.toUpperCase();
  const colors = ['#FF6B6B', '#4ECDC4', '#FFD93D', '#A78BFA', '#FF9F43', '#26C6DA', '#F06292', '#66BB6A'];
  const c = colors[(p.id || 0) % colors.length];
  return (
    <div
      className="rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center"
      style={{
        width: size,
        height: size,
        backgroundColor: c + '22',
        border: `2px solid ${c}44`,
      }}
    >
      {p.foto ? (
        <img src={p.foto} className="w-full h-full object-cover" />
      ) : (
        <span style={{ fontSize: size * 0.36, fontWeight: 900, color: c }}>{initials || '?'}</span>
      )}
    </div>
  );
}

function PlayerDetail({ player, activities, participants, onEdit, onClose }) {
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
              <span className="flex items-center gap-2">
                <SexBadge sex={player.sexo} />
                <span className={player.sexo === 'M' ? 'text-cyan-300 font-bold' : 'text-pink-300 font-bold'}>
                  {player.sexo === 'M' ? 'Varón' : 'Mujer'}
                </span>
              </span>
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

function HelpInfo({ title, text }) {
  const [open, setOpen] = useState(false);
  if (!text) return null;
  return (
    <>
      <button 
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
        className="w-6 h-6 rounded-lg flex items-center justify-center bg-gray-100 text-gray-500 hover:bg-primary/10 hover:text-primary transition-all active:scale-90"
      >
        <Info className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div 
          className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-6 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div 
            className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <div className="font-black text-sm text-primary flex items-center gap-2 uppercase tracking-wider">
                <Info className="w-4 h-4" />
                {title || 'Información'}
              </div>
              <button onClick={() => setOpen(false)} className="w-11 h-11 rounded-full flex items-center justify-center bg-gray-100 text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-sm text-text-muted leading-relaxed font-medium">
              {text}
            </div>
            <button 
              onClick={() => setOpen(false)}
              className="w-full mt-6 py-3 bg-primary text-white font-bold text-sm rounded-2xl shadow-lg shadow-primary/25 active:scale-[0.98] transition-all"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-background z-50 overflow-y-auto pb-5">
      <div className="bg-surface-dark p-4 border-b border-surface-dark flex items-center gap-3 sticky top-0">
        <button
          onClick={onClose}
          className="w-11 h-11 rounded-xl bg-surface-dark border border-surface-dark text-dark text-lg cursor-pointer flex items-center justify-center"
        >
          ←
        </button>
        <div className="font-black text-lg">{title}</div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function PageHeader({ title, sub }) {
  return (
    <div className="bg-surface-dark p-3 pb-2 border-b border-surface-dark">
      <div className="text-2xl font-black" style={{ fontFamily: 'ClashGrotesk, sans-serif' }}>ACTIVADOS</div>
      <h2 className="text-lg font-bold mt-1">{title}</h2>
      <div className="text-sm text-text-muted mt-0.5">{sub}</div>
    </div>
  );
}

function Section({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {Icon && <Icon className="w-5 h-5 text-primary" />}
      <div className="font-bold text-base">{title}</div>
    </div>
  );
}

function Label({ children, style }) {
  return (
    <div
      className="text-xs text-text-muted font-bold uppercase tracking-wide mb-2"
      style={style}
    >
      {children}
    </div>
  );
}

function Empty({ text }) {
  return <div className="text-center py-8 text-text-muted text-sm">{text}</div>;
}

function InfoCard({ text }) {
  return (
    <div className="bg-surface-dark rounded-lg p-3 text-sm text-text-muted border border-surface-dark leading-relaxed">
      {text}
    </div>
  );
}

function Chip({ icon: Icon, val, label }) {
  return (
    <div className="bg-surface-dark rounded-lg px-2 py-1 text-xs font-bold text-text-muted flex items-center gap-1">
      {Icon && <Icon className="w-3 h-3" />}
      {val} <span className="opacity-50">{label}</span>
    </div>
  );
}

function PillCheck({ label, icon: Icon, active, onClick, color }) {
  return (
    <button
      onClick={onClick}
      className="px-2 py-1 rounded-lg cursor-pointer text-sm flex items-center gap-1"
      style={{
        border: `1px solid ${active ? color + '66' : '#e5e5e5'}`,
        backgroundColor: active ? color + '33' : '#f5f5f5',
        color: active ? color : '#999',
      }}
    >
      {Icon ? <Icon className="w-3.5 h-3.5" /> : label}
    </button>
  );
}

function SegmentedButtons({ options, value, onChange }) {
  return (
    <div className="flex gap-2 mb-3">
      {options.map(({ val, label, color }) => (
        <button
          key={val}
          onClick={() => onChange(val)}
          className="flex-1 py-3 rounded-lg border-none cursor-pointer font-bold text-sm"
          style={{
            backgroundColor: value === val ? (color || '#4342FF') : '#e5e5e5',
            color: value === val ? (color ? 'black' : 'white') : '#666',
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function formatDate(d) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${day} ${['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][parseInt(m) - 1]} ${y}`;
}
