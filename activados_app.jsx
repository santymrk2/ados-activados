import { useState, useEffect, useMemo, useRef } from "react";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const TEAMS = ["E1","E2","E3","E4"];
const TC = { E1:"#FF6B6B", E2:"#4ECDC4", E3:"#FFD93D", E4:"#A78BFA" };
const TB = { E1:"#2A1010", E2:"#0A2220", E3:"#2A2200", E4:"#1A1230" };
const MEDALS = ["🥇","🥈","🥉","4°","5°","6°","7°","8°","9°","10°"];
const DEPORTES = ["Fútbol","Handball","Básquet","Vóley","Otro"];
const GENEROS = [{ val:"M", label:"♂ Varones" },{ val:"F", label:"♀ Mujeres" },{ val:"X", label:"⚥ Mixto" }];
const PTS = {
  asistencia:3, puntualidad:2, biblia:2, invito:5, invitado:3,
  rec:{ 1:10, 2:7, 3:4, 4:2 },
  dep:{ gano:4, empato:2, perdio:1 },
};

const newAct = () => ({
  id:null, fecha:new Date().toISOString().slice(0,10), titulo:"",
  equipos:{}, asistentes:[], puntuales:[], biblias:[],
  juegos:[], partidos:[], invitaciones:[], goles:[], extras:[], descuentos:[],
});
const newPart = () => ({ id:null, nombre:"", apellido:"", sexo:"M", edad:"", foto:"" });

// ─── CALC ENGINE ─────────────────────────────────────────────────────────────
function actPts(pid, a, participants) {
  const p = participants.find(x=>x.id===pid);
  if (!p) return 0;
  const team = a.equipos?.[pid];
  const here = a.asistentes.includes(pid);
  let pts = 0;
  if (here) {
    pts += PTS.asistencia;
    if (a.puntuales.includes(pid)) pts += PTS.puntualidad;
    if (a.biblias.includes(pid))   pts += PTS.biblia;
    if (team) {
      for (const j of (a.juegos||[])) { const r=j.pos?.[team]; if(r) pts+=PTS.rec[r]||0; }
      for (const part of (a.partidos||[])) {
        if (part.genero==="M" && p.sexo!=="M") continue;
        if (part.genero==="F" && p.sexo!=="F") continue;
        if (part.eq1!==team && part.eq2!==team) continue;
        if (!part.resultado) continue;
        if (part.resultado==="empate") pts+=PTS.dep.empato;
        else { const w=part.resultado==="eq1"?part.eq1:part.eq2; pts+=w===team?PTS.dep.gano:PTS.dep.perdio; }
      }
    }
    if ((a.invitaciones||[]).some(i=>i.invitador===pid)) pts+=PTS.invito;
  }
  if ((a.invitaciones||[]).some(i=>i.invitado_id===pid)) pts+=PTS.invitado;
  for (const e of (a.extras||[]))     if(e.pid===pid) pts+=e.puntos;
  for (const d of (a.descuentos||[])) if(d.pid===pid) pts-=d.puntos;
  return pts;
}

function actGoles(pid, a) {
  return (a.goles||[]).filter(g=>g.pid===pid).reduce((s,g)=>s+g.cant,0);
}

function calcPts(pid, activities, participants) {
  let total=0, gf=0, gh=0, gb=0, acts=0;
  for (const a of activities) {
    if (a.asistentes.includes(pid)) acts++;
    total += actPts(pid, a, participants);
    for (const g of (a.goles||[])) if(g.pid===pid) {
      if(g.tipo==="f") gf+=g.cant; else if(g.tipo==="h") gh+=g.cant; else gb+=g.cant;
    }
  }
  return { total:total+gf+gh+gb, gf, gh, gb, acts };
}

function calcDayTeamPts(a, participants) {
  const acc={E1:0,E2:0,E3:0,E4:0};
  for (const [pidStr,team] of Object.entries(a.equipos||{})) {
    const pid=Number(pidStr);
    if (!a.asistentes.includes(pid)) continue;
    acc[team]=(acc[team]||0)+actPts(pid,a,participants);
  }
  return acc;
}

// ─── STORAGE ─────────────────────────────────────────────────────────────────
const STORAGE_KEY = "activados_v4";
const SEED_DB = {"participants":[{"id":1,"nombre":"Ana Luz","apellido":"Aquino","edad":"18","sexo":"F","foto":""},{"id":2,"nombre":"Gian Franco","apellido":"Carbone","edad":"15","sexo":"M","foto":""},{"id":3,"nombre":"Tomás","apellido":"Barrera","edad":"14","sexo":"M","foto":""},{"id":4,"nombre":"Rodrigo","apellido":"Rolón","edad":"12","sexo":"M","foto":""},{"id":5,"nombre":"Jonás","apellido":"Corvalán","edad":"12","sexo":"M","foto":""},{"id":6,"nombre":"Felipe","apellido":"Morinico","edad":"13","sexo":"M","foto":""},{"id":7,"nombre":"Alma","apellido":"Ochnicki","edad":"12","sexo":"F","foto":""},{"id":8,"nombre":"Candela","apellido":"Ayala","edad":"13","sexo":"F","foto":""},{"id":9,"nombre":"Catalina","apellido":"Sánchez","edad":"11","sexo":"F","foto":""},{"id":10,"nombre":"Catalina","apellido":"Flores","edad":"13","sexo":"F","foto":""},{"id":11,"nombre":"Victoria","apellido":"Gumpp","edad":"12","sexo":"F","foto":""},{"id":12,"nombre":"Ludmila","apellido":"Sánchez","edad":"12","sexo":"F","foto":""},{"id":13,"nombre":"Sara","apellido":"Vargas","edad":"11","sexo":"F","foto":""},{"id":14,"nombre":"Agostina","apellido":"López","edad":"14","sexo":"F","foto":""},{"id":15,"nombre":"Priscila","apellido":"Espíndola","edad":"12","sexo":"F","foto":""},{"id":16,"nombre":"Manuel","apellido":"Vargas","edad":"11","sexo":"M","foto":""},{"id":17,"nombre":"Tobías","apellido":"Ludueña","edad":"16","sexo":"M","foto":""},{"id":18,"nombre":"Oriana","apellido":"Cabrera","edad":"17","sexo":"F","foto":""},{"id":19,"nombre":"Thiago","apellido":"Lencina","edad":"15","sexo":"M","foto":""},{"id":20,"nombre":"Octavio","apellido":"Cabrera","edad":"13","sexo":"M","foto":""},{"id":21,"nombre":"Mauro","apellido":"Suárez","edad":"16","sexo":"M","foto":""},{"id":22,"nombre":"Marco","apellido":"Pella Sycz","edad":"16","sexo":"M","foto":""},{"id":23,"nombre":"Candelaria","apellido":"Mendoza","edad":"12","sexo":"F","foto":""},{"id":24,"nombre":"Thiago","apellido":"Villena","edad":"12","sexo":"M","foto":""},{"id":25,"nombre":"Enzo","apellido":"Alegre","edad":"14","sexo":"M","foto":""},{"id":26,"nombre":"Estella","apellido":"Canteros","edad":"15","sexo":"F","foto":""},{"id":27,"nombre":"Lizz","apellido":"Ayala","edad":"14","sexo":"F","foto":""},{"id":28,"nombre":"Liz","apellido":"Canteros","edad":"11","sexo":"F","foto":""},{"id":29,"nombre":"Santiago","apellido":"Álvarez","edad":"11","sexo":"M","foto":""},{"id":30,"nombre":"Bianca","apellido":"Petrina","edad":"17","sexo":"F","foto":""},{"id":31,"nombre":"Magalí","apellido":"Benítez","edad":"13","sexo":"F","foto":""},{"id":32,"nombre":"Katia","apellido":"Petrina","edad":"15","sexo":"F","foto":""},{"id":33,"nombre":"Matías Nahuel","apellido":"Castillo","edad":"12","sexo":"M","foto":""},{"id":34,"nombre":"Antonella","apellido":"Morrone","edad":"14","sexo":"F","foto":""},{"id":35,"nombre":"Maximo","apellido":"Maidana","edad":"14","sexo":"M","foto":""},{"id":36,"nombre":"Esteban","apellido":"Ayala","edad":"13","sexo":"M","foto":""},{"id":37,"nombre":"Lucas","apellido":"Holm","edad":"14","sexo":"M","foto":""},{"id":38,"nombre":"Fiamma","apellido":"Padoani","edad":"15","sexo":"F","foto":""},{"id":39,"nombre":"Malena","apellido":"Vivas","edad":"13","sexo":"F","foto":""},{"id":40,"nombre":"Enzo","apellido":"Castillo","edad":"14","sexo":"M","foto":""},{"id":41,"nombre":"Julieta","apellido":"Vivas","edad":"12","sexo":"F","foto":""},{"id":42,"nombre":"Sophia","apellido":"Carbone","edad":"15","sexo":"F","foto":""},{"id":43,"nombre":"Román","apellido":"Núñez","edad":"14","sexo":"M","foto":""},{"id":44,"nombre":"Martina","apellido":"Del Prado","edad":"12","sexo":"F","foto":""},{"id":45,"nombre":"Joaquín","apellido":"Romero","edad":"14","sexo":"M","foto":""},{"id":46,"nombre":"Josué","apellido":"Vilaja","edad":"17","sexo":"M","foto":""},{"id":47,"nombre":"Constanza","apellido":"Zequeira","edad":"15","sexo":"F","foto":""},{"id":48,"nombre":"Gonzalo","apellido":"Cortez","edad":"12","sexo":"M","foto":""},{"id":49,"nombre":"Laureano","apellido":"Aguilera","edad":"14","sexo":"M","foto":""},{"id":50,"nombre":"Milena","apellido":"Anta","edad":"14","sexo":"F","foto":""},{"id":51,"nombre":"Nerea","apellido":"Anta","edad":"12","sexo":"F","foto":""},{"id":52,"nombre":"Lucas","apellido":"Ojeda","edad":"17","sexo":"M","foto":""},{"id":53,"nombre":"Santiago","apellido":"Ledesma","edad":"17","sexo":"M","foto":""},{"id":54,"nombre":"Alexander","apellido":"","edad":"15","sexo":"M","foto":""},{"id":55,"nombre":"Gabriela","apellido":"Ojeda","edad":"13","sexo":"F","foto":""},{"id":56,"nombre":"Santiago","apellido":"Mercado","edad":"18","sexo":"M","foto":""},{"id":57,"nombre":"Briana","apellido":"Apolinario","edad":"13","sexo":"F","foto":""},{"id":58,"nombre":"Benja","apellido":"Apolinario","edad":"11","sexo":"M","foto":""},{"id":59,"nombre":"Valentina","apellido":"Romero","edad":"12","sexo":"F","foto":""},{"id":60,"nombre":"Maite","apellido":"Balvín","edad":"14","sexo":"F","foto":""},{"id":61,"nombre":"Natalia","apellido":"Balvín","edad":"12","sexo":"F","foto":""},{"id":62,"nombre":"Karen","apellido":"López","edad":"18","sexo":"F","foto":""},{"id":63,"nombre":"Joaquín","apellido":"Gabilán","edad":"15","sexo":"M","foto":""},{"id":64,"nombre":"Juana","apellido":"Bozzola","edad":"15","sexo":"F","foto":""},{"id":65,"nombre":"Mayra","apellido":"Aguirre","edad":"14","sexo":"F","foto":""},{"id":66,"nombre":"Jonathan","apellido":"Fernández","edad":"14","sexo":"M","foto":""},{"id":67,"nombre":"Valentina","apellido":"Benítez","edad":"12","sexo":"F","foto":""},{"id":68,"nombre":"Camila","apellido":"Silva","edad":"17","sexo":"F","foto":""},{"id":69,"nombre":"Valentino","apellido":"Aguirre","edad":"11","sexo":"M","foto":""},{"id":70,"nombre":"Facundo","apellido":"Chipana","edad":"15","sexo":"M","foto":""},{"id":71,"nombre":"Edi","apellido":"Chipana","edad":"15","sexo":"M","foto":""},{"id":72,"nombre":"Brian","apellido":"Pereyra","edad":"12","sexo":"M","foto":""},{"id":73,"nombre":"Amira","apellido":"Almirón","edad":"12","sexo":"F","foto":""},{"id":74,"nombre":"Morena","apellido":"Escalante","edad":"12","sexo":"F","foto":""},{"id":75,"nombre":"Débora","apellido":"Tuli","edad":"15","sexo":"F","foto":""},{"id":76,"nombre":"Ailin","apellido":"Tuli","edad":"12","sexo":"F","foto":""},{"id":77,"nombre":"Valentina","apellido":"Tuli","edad":"12","sexo":"F","foto":""},{"id":78,"nombre":"Misael","apellido":"Quintana","edad":"13","sexo":"M","foto":""},{"id":79,"nombre":"Ignacio","apellido":"Velázquez","edad":"14","sexo":"M","foto":""},{"id":80,"nombre":"Virginia","apellido":"Nuske","edad":"12","sexo":"F","foto":""},{"id":81,"nombre":"Agustina","apellido":"Mena","edad":"13","sexo":"F","foto":""},{"id":82,"nombre":"Agostina","apellido":"Báez","edad":"14","sexo":"F","foto":""},{"id":83,"nombre":"Santiago","apellido":"Báez","edad":"12","sexo":"M","foto":""},{"id":84,"nombre":"María Luján","apellido":"Lastra","edad":"14","sexo":"F","foto":""},{"id":85,"nombre":"Agostina","apellido":"Rodríguez","edad":"12","sexo":"F","foto":""},{"id":86,"nombre":"Elvis","apellido":"Atto","edad":"14","sexo":"M","foto":""},{"id":87,"nombre":"Maylén","apellido":"Miranda","edad":"13","sexo":"F","foto":""},{"id":88,"nombre":"Sofía","apellido":"Ochnicki","edad":"11","sexo":"F","foto":""},{"id":89,"nombre":"Malena","apellido":"Stodola","edad":"12","sexo":"F","foto":""},{"id":90,"nombre":"Francisco","apellido":"Ponce","edad":"12","sexo":"M","foto":""},{"id":91,"nombre":"Josefa","apellido":"Taboada","edad":"13","sexo":"F","foto":""},{"id":92,"nombre":"Julieta","apellido":"Díaz","edad":"14","sexo":"F","foto":""},{"id":93,"nombre":"Sofía","apellido":"Arce","edad":"14","sexo":"F","foto":""},{"id":94,"nombre":"Lucía","apellido":"Cubilla","edad":"14","sexo":"F","foto":""},{"id":95,"nombre":"Sofía","apellido":"Baginay","edad":"12","sexo":"F","foto":""},{"id":96,"nombre":"Ramón","apellido":"Paredes","edad":"14","sexo":"M","foto":""},{"id":97,"nombre":"Dilan","apellido":"Díaz","edad":"11","sexo":"M","foto":""},{"id":98,"nombre":"Lucas","apellido":"Ávalos","edad":"12","sexo":"M","foto":""},{"id":99,"nombre":"Brisa","apellido":"Salguero","edad":"12","sexo":"F","foto":""},{"id":100,"nombre":"Brisa","apellido":"Domínguez","edad":"12","sexo":"F","foto":""}],"activities":[],"nextPid":101,"nextAid":1};
const emptyDB = () => JSON.parse(JSON.stringify(SEED_DB));

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [db, setDB] = useState(null);
  const [view, setView] = useState("dashboard");
  const [modal, setModal] = useState(null);

  useEffect(() => {
    (async () => {
      try { const r=await window.storage.get(STORAGE_KEY); setDB(r?JSON.parse(r.value):emptyDB()); }
      catch { setDB(emptyDB()); }
    })();
  }, []);

  const save = async (newDB) => {
    setDB(newDB);
    try { await window.storage.set(STORAGE_KEY, JSON.stringify(newDB)); } catch {}
  };

  if (!db) return <Loader />;

  const openActivityView = (act) => setModal({ type:"actview", data:act });
  const openActivityEdit = (act) => setModal({ type:"actedit", data:act||newAct() });
  const openParticipant  = (p)   => setModal({ type:"participant", data:p||newPart() });

  return (
    <div style={{ fontFamily:"'Nunito','Segoe UI',sans-serif", background:"#0A0A18", minHeight:"100vh", color:"#F0F0FF", paddingBottom:72 }}>
      {modal?.type==="actview"     && <ActivityView    db={db} act={modal.data} onEdit={()=>setModal({type:"actedit",data:modal.data})} onClose={()=>setModal(null)} />}
      {modal?.type==="actedit"     && <ActivityForm    db={db} save={save} initial={modal.data} onClose={()=>setModal(null)} />}
      {modal?.type==="participant" && <ParticipantForm db={db} save={save} initial={modal.data} onClose={()=>setModal(null)} />}
      {!modal && <>
        {view==="dashboard"    && <Dashboard    db={db} />}
        {view==="activities"   && <ActivitiesList db={db} save={save} onView={openActivityView} onNew={()=>openActivityEdit(null)} onEdit={openActivityEdit} />}
        {view==="participants" && <ParticipantsList db={db} save={save} onNew={()=>openParticipant(null)} onEdit={openParticipant} />}
        <BottomNav view={view} setView={setView} />
      </>}
    </div>
  );
}

function BottomNav({ view, setView }) {
  return (
    <nav style={{ position:"fixed", bottom:0, left:0, right:0, background:"#10102A", borderTop:"1px solid #20203A", display:"flex", zIndex:200 }}>
      {[{ key:"dashboard",icon:"🏆",label:"Dashboard" },{ key:"activities",icon:"📅",label:"Actividades" },{ key:"participants",icon:"👥",label:"Jugadores" }]
        .map(({ key,icon,label }) => (
          <button key={key} onClick={()=>setView(key)} style={{ flex:1, background:"none", border:"none", cursor:"pointer", padding:"10px 4px 6px", color:view===key?"#A78BFA":"#444", fontFamily:"inherit" }}>
            <div style={{ fontSize:22 }}>{icon}</div>
            <div style={{ fontSize:10, fontWeight:800 }}>{label}</div>
          </button>
        ))}
    </nav>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ db }) {
  const { participants, activities } = db;
  const rankings = useMemo(() =>
    participants.map(p=>({ ...p, ...calcPts(p.id, activities, participants) }))
      .sort((a,b)=>b.total-a.total), [db]);
  const lastActs = [...activities].sort((a,b)=>b.fecha.localeCompare(a.fecha)).slice(0,4);

  return (
    <div>
      <div style={{ background:"linear-gradient(160deg,#1A1235 0%,#0A0A18 60%)", padding:"28px 20px 20px", borderBottom:"1px solid #1E1E3A" }}>
        <div style={{ fontSize:11, letterSpacing:4, color:"#A78BFA", fontWeight:800, textTransform:"uppercase" }}>⚡ ACTIVADOS</div>
        <h1 style={{ margin:"4px 0 0", fontSize:28, fontWeight:900, letterSpacing:-1 }}>Dashboard</h1>
        <div style={{ display:"flex", gap:10, marginTop:16 }}>
          {[{ n:participants.length,label:"Jugadores" },{ n:activities.length,label:"Actividades" },{ n:activities.reduce((s,a)=>s+a.asistentes.length,0),label:"Asistencias" }]
            .map(({ n,label }) => (
              <div key={label} style={{ background:"#1A1A30", borderRadius:12, padding:"10px 8px", flex:1, textAlign:"center", border:"1px solid #2A2A4A" }}>
                <div style={{ fontSize:22, fontWeight:900, color:"#A78BFA" }}>{n}</div>
                <div style={{ fontSize:10, color:"#666", fontWeight:700 }}>{label}</div>
              </div>
            ))}
        </div>
      </div>
      <div style={{ padding:"16px 16px 0" }}>
        <Section icon="🏅" title="Ranking Individual" />
        {rankings.length===0 ? <Empty text="Aún no hay participantes" /> : (
          <div style={{ display:"grid", gap:8, marginBottom:20 }}>
            {rankings.map((p,i) => <RankRow key={p.id} p={p} pos={i+1} activities={activities} showPts />)}
          </div>
        )}
        {lastActs.length>0 && <>
          <Section icon="📅" title="Últimas Actividades" />
          <div style={{ display:"grid", gap:8, marginBottom:20 }}>
            {lastActs.map(a=>(
              <div key={a.id} style={{ background:"#12122A", borderRadius:12, padding:"12px 14px", border:"1px solid #2A2A4A", display:"flex", justifyContent:"space-between" }}>
                <div>
                  <div style={{ fontWeight:800 }}>{a.titulo||formatDate(a.fecha)}</div>
                  <div style={{ fontSize:12, color:"#666", marginTop:2 }}>{formatDate(a.fecha)} · {a.asistentes.length} presentes</div>
                </div>
                <div style={{ fontSize:12, color:"#A78BFA", fontWeight:700 }}>{a.juegos.length}j · {(a.partidos||[]).length}p</div>
              </div>
            ))}
          </div>
        </>}
      </div>
    </div>
  );
}

function RankRow({ p, pos, activities, showPts }) {
  const teamsPlayed = [...new Set((activities||[]).flatMap(a=>a.asistentes.includes(p.id)&&a.equipos?.[p.id]?[a.equipos[p.id]]:[]))];
  return (
    <div style={{ background:"#12122A", borderRadius:12, padding:"10px 14px", display:"flex", alignItems:"center", gap:10, border:`1px solid ${pos<=3?"#A78BFA44":"#1E1E3A"}`, position:"relative", overflow:"hidden" }}>
      {pos<=3 && <div style={{ position:"absolute", inset:0, background:"#A78BFA08" }} />}
      <div style={{ width:30, textAlign:"center", fontWeight:900, fontSize:pos<=3?22:13, color:pos<=3?"#A78BFA":"#555", zIndex:1, flexShrink:0 }}>{MEDALS[pos-1]||pos}</div>
      <Avatar p={p} size={34} />
      <div style={{ flex:1, zIndex:1, minWidth:0 }}>
        <div style={{ fontWeight:800, fontSize:14, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{p.nombre} {p.apellido}</div>
        <div style={{ fontSize:10, marginTop:1, display:"flex", gap:5, flexWrap:"wrap" }}>
          {teamsPlayed.map(t=><span key={t} style={{ color:TC[t], fontWeight:700, background:TB[t], borderRadius:5, padding:"1px 5px" }}>{t}</span>)}
          <span style={{ color:"#555" }}>{p.acts} act.</span>
          {p.gf>0&&<span style={{ color:"#888" }}>⚽{p.gf}</span>}
          {p.gh>0&&<span style={{ color:"#888" }}>🤾{p.gh}</span>}
          {p.gb>0&&<span style={{ color:"#888" }}>🏀{p.gb}</span>}
        </div>
      </div>
      {showPts && <div style={{ fontWeight:900, fontSize:22, color:"#fff", zIndex:1 }}>{p.total}</div>}
    </div>
  );
}

// ─── ACTIVITY VIEW ────────────────────────────────────────────────────────────
function ActivityView({ db, act, onEdit, onClose }) {
  const { participants } = db;
  const dayPts = useMemo(() => calcDayTeamPts(act, participants), [act]);
  const teamRank = TEAMS.map(t=>({ team:t, pts:dayPts[t]||0 })).sort((a,b)=>b.pts-a.pts);
  const maxTeamPts = Math.max(...teamRank.map(t=>t.pts), 1);

  const playerRank = useMemo(() =>
    act.asistentes.map(pid=>{
      const p=participants.find(x=>x.id===pid);
      if(!p) return null;
      return { ...p, pts:actPts(pid,act,participants), goles:actGoles(pid,act) };
    }).filter(Boolean).sort((a,b)=>b.pts-a.pts), [act]);

  const scorerRank = useMemo(() =>
    playerRank.filter(p=>p.goles>0).sort((a,b)=>b.goles-a.goles), [playerRank]);

  const [tab, setTab] = useState(0);
  const TABS = ["🏆 Equipos","🏅 Ranking","🥅 Goleadores","⚽ Partidos"];

  return (
    <div style={{ background:"#0A0A18", minHeight:"100vh", paddingBottom:20 }}>
      <div style={{ background:"linear-gradient(135deg,#1A1235,#0A0A18)", padding:"20px 16px 0", borderBottom:"1px solid #1E1E3A", position:"sticky", top:0, zIndex:50 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
          <button onClick={onClose} style={{ background:"#1A1A30", border:"none", borderRadius:10, width:36, height:36, color:"#fff", fontSize:18, cursor:"pointer" }}>←</button>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:900, fontSize:18 }}>{act.titulo||"Actividad"}</div>
            <div style={{ fontSize:12, color:"#888" }}>{formatDate(act.fecha)} · {act.asistentes.length} presentes</div>
          </div>
          <button onClick={onEdit} style={{ background:"#1A1A30", border:"1px solid #3A3A5A", borderRadius:10, padding:"8px 14px", color:"#A78BFA", fontFamily:"inherit", fontWeight:800, fontSize:13, cursor:"pointer" }}>✏️ Editar</button>
        </div>
        <div style={{ display:"flex" }}>
          {TABS.map((t,i)=>(
            <button key={i} onClick={()=>setTab(i)} style={{ flex:1, padding:"9px 4px", background:"none", border:"none", cursor:"pointer", color:tab===i?"#A78BFA":"#555", fontFamily:"inherit", fontWeight:800, fontSize:10, borderBottom:tab===i?"2px solid #A78BFA":"2px solid transparent" }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{ padding:"20px 16px" }}>
        {tab===0 && (
          <div>
            <div style={{ display:"grid", gap:8, marginBottom:20 }}>
              {teamRank.map(({ team,pts },i)=>(
                <div key={team} style={{ background:TB[team], border:`2px solid ${TC[team]}${i===0?"":"44"}`, borderRadius:14, padding:"14px 16px", display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ fontSize:24 }}>{MEDALS[i]}</div>
                  <div style={{ fontWeight:900, color:TC[team], fontSize:18 }}>{team}</div>
                  <div style={{ flex:1, background:"#0A0A18", borderRadius:100, height:8, overflow:"hidden" }}>
                    <div style={{ width:`${(pts/maxTeamPts)*100}%`, height:"100%", background:TC[team], borderRadius:100 }} />
                  </div>
                  <div style={{ fontWeight:900, fontSize:22 }}>{pts}</div>
                </div>
              ))}
            </div>
            {(act.juegos||[]).length>0&&<>
              <div style={{ fontWeight:800, fontSize:14, color:"#888", marginBottom:10 }}>🎮 Juegos Mixtos</div>
              {(act.juegos||[]).map((j,gi)=>{
                const sorted=TEAMS.map(t=>({ t, pos:j.pos?.[t]||99 })).filter(x=>x.pos!==99).sort((a,b)=>a.pos-b.pos);
                return (
                  <div key={j.id} style={{ background:"#12122A", borderRadius:12, border:"1px solid #2A2A4A", marginBottom:10, overflow:"hidden" }}>
                    <div style={{ padding:"10px 14px", borderBottom:"1px solid #1E1E3A", fontWeight:800 }}>{j.nombre||`Juego ${gi+1}`}</div>
                    <div style={{ display:"flex" }}>
                      {sorted.map(({ t,pos })=>(
                        <div key={t} style={{ flex:1, padding:"10px 4px", textAlign:"center", background:pos===1?TB[t]:"transparent", borderRight:"1px solid #1E1E3A" }}>
                          <div style={{ fontSize:18 }}>{MEDALS[pos-1]}</div>
                          <div style={{ fontWeight:900, color:TC[t], fontSize:14 }}>{t}</div>
                          <div style={{ fontSize:11, color:"#555" }}>+{PTS.rec[pos]}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </>}
          </div>
        )}

        {tab===1 && (
          <div>
            <InfoCard text="Posiciones del día · puntos no visibles" />
            <div style={{ display:"grid", gap:8, marginTop:12 }}>
              {playerRank.map((p,i)=>(
                <div key={p.id} style={{ background:"#12122A", borderRadius:12, padding:"10px 14px", display:"flex", alignItems:"center", gap:10, border:`1px solid ${i<3?"#A78BFA44":"#1E1E3A"}`, position:"relative", overflow:"hidden" }}>
                  {i<3&&<div style={{ position:"absolute", inset:0, background:"#A78BFA08" }} />}
                  <div style={{ width:30, textAlign:"center", fontWeight:900, fontSize:i<3?22:13, color:i<3?"#A78BFA":"#555", zIndex:1, flexShrink:0 }}>{MEDALS[i]}</div>
                  <Avatar p={p} size={34} />
                  <div style={{ flex:1, zIndex:1 }}>
                    <div style={{ fontWeight:800 }}>{p.nombre} {p.apellido}</div>
                    <div style={{ fontSize:11, color:"#555", marginTop:1 }}>
                      {act.equipos?.[p.id]&&<span style={{ color:TC[act.equipos[p.id]], fontWeight:700 }}>{act.equipos[p.id]} · </span>}
                      {act.puntuales.includes(p.id)?"⏰ ":""}{act.biblias.includes(p.id)?"📖":""}
                    </div>
                  </div>
                </div>
              ))}
              {playerRank.length===0&&<Empty text="Sin asistentes" />}
            </div>
          </div>
        )}

        {tab===2 && (
          <div>
            <InfoCard text="Goleadores del día · cantidades no visibles" />
            {scorerRank.length===0 ? <Empty text="Sin goles registrados" /> : (
              <div style={{ display:"grid", gap:8, marginTop:12 }}>
                {scorerRank.map((p,i)=>{
                  const gs=(act.goles||[]).filter(g=>g.pid===p.id);
                  const tipos=[...new Set(gs.map(g=>g.tipo))];
                  return (
                    <div key={p.id} style={{ background:"#12122A", borderRadius:12, padding:"10px 14px", display:"flex", alignItems:"center", gap:10, border:`1px solid ${i<3?"#FFD93D44":"#1E1E3A"}` }}>
                      <div style={{ width:30, textAlign:"center", fontWeight:900, fontSize:i<3?22:13, color:i<3?"#FFD93D":"#555", flexShrink:0 }}>{MEDALS[i]}</div>
                      <Avatar p={p} size={34} />
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:800 }}>{p.nombre} {p.apellido}</div>
                        <div style={{ fontSize:11, color:"#555", marginTop:1 }}>
                          {tipos.map(t=>t==="f"?"⚽":t==="h"?"🤾":"🏀").join(" ")}
                          {act.equipos?.[p.id]&&<span style={{ color:TC[act.equipos[p.id]], marginLeft:6 }}>{act.equipos[p.id]}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab===3 && (
          <div>
            {(act.partidos||[]).length===0 ? <Empty text="Sin partidos registrados" /> : (
              <div style={{ display:"grid", gap:12 }}>
                {(act.partidos||[]).map(part=>{
                  const winner=part.resultado==="eq1"?part.eq1:part.resultado==="eq2"?part.eq2:null;
                  const icon={"Fútbol":"⚽","Handball":"🤾","Básquet":"🏀","Vóley":"🏐","Otro":"🏆"}[part.deporte]||"🏆";
                  return (
                    <div key={part.id} style={{ background:"#12122A", borderRadius:14, border:"1px solid #2A2A4A", overflow:"hidden" }}>
                      <div style={{ padding:"8px 14px", background:"#10102A", borderBottom:"1px solid #1E1E3A", display:"flex", gap:8 }}>
                        <span>{icon}</span><span style={{ fontWeight:800, fontSize:13 }}>{part.deporte}</span>
                        <span style={{ fontSize:11, color:"#666" }}>· {GENEROS.find(g=>g.val===part.genero)?.label}</span>
                      </div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr auto 1fr", alignItems:"center", padding:"16px 14px" }}>
                        <div style={{ textAlign:"center" }}>
                          <div style={{ fontWeight:900, fontSize:22, color:TC[part.eq1], opacity:winner&&winner!==part.eq1?0.35:1 }}>{part.eq1}</div>
                          {winner===part.eq1&&<div style={{ fontSize:11, color:"#22C55E", fontWeight:800 }}>GANÓ ✓</div>}
                        </div>
                        <div style={{ textAlign:"center", padding:"0 12px" }}>
                          {part.resultado==="empate"
                            ? <span style={{ fontWeight:900, fontSize:13, color:"#FFD93D" }}>EMPATE</span>
                            : <span style={{ fontWeight:900, fontSize:18, color:"#555" }}>VS</span>}
                        </div>
                        <div style={{ textAlign:"center" }}>
                          <div style={{ fontWeight:900, fontSize:22, color:TC[part.eq2], opacity:winner&&winner!==part.eq2?0.35:1 }}>{part.eq2}</div>
                          {winner===part.eq2&&<div style={{ fontSize:11, color:"#22C55E", fontWeight:800 }}>GANÓ ✓</div>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ACTIVITIES LIST ──────────────────────────────────────────────────────────
function ActivitiesList({ db, save, onView, onNew, onEdit }) {
  const sorted = useMemo(()=>[...db.activities].sort((a,b)=>b.fecha.localeCompare(a.fecha)),[db]);
  const del = (id,e) => { e.stopPropagation(); if(confirm("¿Eliminar?")) save({ ...db, activities:db.activities.filter(a=>a.id!==id) }); };

  return (
    <div>
      <PageHeader title="Actividades" sub={`${db.activities.length} registradas`} />
      <div style={{ padding:"16px" }}>
        <button onClick={onNew} style={primaryBtn}>+ Nueva Actividad</button>
        {sorted.length===0 ? <Empty text="No hay actividades todavía" /> : (
          <div style={{ display:"grid", gap:10 }}>
            {sorted.map(a=>(
              <div key={a.id} onClick={()=>onView(a)} style={{ background:"#12122A", borderRadius:14, border:"1px solid #2A2A4A", overflow:"hidden", cursor:"pointer" }}>
                <div style={{ padding:"14px 14px 10px", display:"flex", justifyContent:"space-between" }}>
                  <div>
                    <div style={{ fontWeight:900, fontSize:16 }}>{a.titulo||"Sin título"}</div>
                    <div style={{ fontSize:12, color:"#666", marginTop:2 }}>{formatDate(a.fecha)}</div>
                  </div>
                  <div style={{ display:"flex", gap:6 }}>
                    <button onClick={e=>{e.stopPropagation();onEdit(a);}} style={{ background:"#1A1A30", border:"none", borderRadius:8, width:30, height:30, cursor:"pointer", fontSize:13 }}>✏️</button>
                    <button onClick={e=>del(a.id,e)} style={{ background:"#FF6B6B22", border:"none", borderRadius:8, width:30, height:30, cursor:"pointer", fontSize:13 }}>🗑️</button>
                  </div>
                </div>
                <div style={{ padding:"8px 14px", display:"flex", gap:8, borderTop:"1px solid #1E1E3A", flexWrap:"wrap" }}>
                  <Chip icon="👥" val={a.asistentes.length} label="asist." />
                  <Chip icon="🎮" val={a.juegos.length} label="juegos" />
                  <Chip icon="⚽" val={(a.partidos||[]).length} label="partidos" />
                  <Chip icon="🥅" val={(a.goles||[]).reduce((s,g)=>s+g.cant,0)} label="goles" />
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:4, padding:"0 14px 12px" }}>
                  {TEAMS.map(t=>{
                    const n=Object.entries(a.equipos||{}).filter(([pid,eq])=>eq===t&&a.asistentes.includes(Number(pid))).length;
                    return <div key={t} style={{ background:TB[t], borderRadius:8, padding:"6px 4px", textAlign:"center", border:`1px solid ${TC[t]}44` }}>
                      <div style={{ fontSize:10, color:TC[t], fontWeight:800 }}>{t}</div>
                      <div style={{ fontSize:11, color:"#555" }}>{n} jug.</div>
                    </div>;
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

// ─── PARTICIPANTS LIST ────────────────────────────────────────────────────────
function ParticipantsList({ db, save, onNew, onEdit }) {
  const [search, setSearch] = useState("");
  const list = useMemo(() =>
    db.participants
      .map(p=>({ ...p, ...calcPts(p.id, db.activities, db.participants) }))
      .filter(p=>!search||`${p.nombre} ${p.apellido}`.toLowerCase().includes(search.toLowerCase()))
      .sort((a,b)=>b.total-a.total), [db, search]);
  const del = (id) => { if(confirm("¿Eliminar?")) save({ ...db, participants:db.participants.filter(p=>p.id!==id) }); };

  return (
    <div>
      <PageHeader title="Jugadores" sub={`${db.participants.length} registrados`} />
      <div style={{ padding:"0 16px 16px" }}>
        <button onClick={onNew} style={{ ...primaryBtn, background:"linear-gradient(135deg,#4ECDC4,#2AA198)", marginBottom:12 }}>+ Agregar Jugador</button>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Buscar..." style={inputStyle()} />
        {list.length===0 ? <Empty text="No hay jugadores" /> : (
          <div style={{ display:"grid", gap:8 }}>
            {list.map((p,i)=>{
              const teamsPlayed=[...new Set(db.activities.flatMap(a=>a.asistentes.includes(p.id)&&a.equipos?.[p.id]?[a.equipos[p.id]]:[]))];
              return (
                <div key={p.id} style={{ background:"#12122A", borderRadius:12, padding:"12px 14px", border:"1px solid #1E1E3A", display:"flex", alignItems:"center", gap:10 }}>
                  <Avatar p={p} size={42} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:800, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{p.nombre} {p.apellido}</div>
                    <div style={{ fontSize:11, color:"#555", marginTop:2, display:"flex", gap:5, flexWrap:"wrap" }}>
                      <span>{p.sexo==="M"?"♂":"♀"} · {p.edad}a · {p.acts} act.</span>
                      {teamsPlayed.map(t=><span key={t} style={{ color:TC[t], fontWeight:700 }}>{t}</span>)}
                    </div>
                  </div>
                  <div style={{ textAlign:"right", flexShrink:0 }}><div style={{ fontWeight:900, fontSize:20 }}>{p.total}</div><div style={{ fontSize:9, color:"#555" }}>pts</div></div>
                  <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                    <button onClick={()=>onEdit(p)} style={{ background:"#1A1A30", border:"none", borderRadius:8, width:30, height:30, cursor:"pointer", fontSize:13 }}>✏️</button>
                    <button onClick={()=>del(p.id)} style={{ background:"#FF6B6B22", border:"none", borderRadius:8, width:30, height:30, cursor:"pointer", fontSize:13 }}>🗑️</button>
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

// ─── PARTICIPANT FORM ─────────────────────────────────────────────────────────
function ParticipantForm({ db, save, initial, onClose }) {
  const [form, setForm] = useState({ ...newPart(), ...initial });
  const fileRef = useRef();
  const F = (k,v) => setForm(f=>({ ...f, [k]:v }));

  const handlePhoto = (file) => {
    if(!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const size = 160; canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext("2d");
        const min = Math.min(img.width, img.height);
        ctx.drawImage(img, (img.width-min)/2, (img.height-min)/2, min, min, 0, 0, size, size);
        F("foto", canvas.toDataURL("image/jpeg", 0.75));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const submit = () => {
    if(!form.nombre.trim()) return alert("Ingresá el nombre");
    const isNew=!form.id, p=isNew?{ ...form, id:db.nextPid }:form;
    save({ ...db, participants:isNew?[...db.participants,p]:db.participants.map(x=>x.id===p.id?p:x), nextPid:isNew?db.nextPid+1:db.nextPid });
    onClose();
  };

  return (
    <Modal title={form.id?"Editar Jugador":"Nuevo Jugador"} onClose={onClose}>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", marginBottom:20 }}>
        <div onClick={()=>fileRef.current?.click()} style={{ width:96, height:96, borderRadius:"50%", background:"#1A1A30", border:"3px solid #3A3A5A", cursor:"pointer", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center" }}>
          {form.foto ? <img src={form.foto} style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : <span style={{ fontSize:40 }}>👤</span>}
        </div>
        <div style={{ display:"flex", gap:8, marginTop:8 }}>
          <button onClick={()=>fileRef.current?.click()} style={{ ...pillBtnStyle, background:"#1A1A30", color:"#A78BFA", border:"1px solid #3A3A5A" }}>📷 Subir foto</button>
          {form.foto&&<button onClick={()=>F("foto","")} style={{ ...pillBtnStyle, background:"#2A1010", color:"#FF6B6B" }}>✕ Quitar</button>}
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={e=>handlePhoto(e.target.files[0])} />
      </div>
      <Label>Nombre</Label>
      <input value={form.nombre} onChange={e=>F("nombre",e.target.value)} style={inputStyle()} placeholder="Nombre" />
      <Label>Apellido</Label>
      <input value={form.apellido} onChange={e=>F("apellido",e.target.value)} style={inputStyle()} placeholder="Apellido" />
      <Label>Edad</Label>
      <input value={form.edad} onChange={e=>F("edad",e.target.value)} type="number" style={inputStyle()} placeholder="Edad" />
      <Label>Sexo</Label>
      <SegmentedButtons options={[{ val:"M",label:"♂ Varón" },{ val:"F",label:"♀ Mujer" }]} value={form.sexo} onChange={v=>F("sexo",v)} />
      <SaveBtn onClick={submit} label={form.id?"Guardar Cambios":"Agregar Jugador"} />
    </Modal>
  );
}

// ─── ACTIVITY FORM ────────────────────────────────────────────────────────────
function ActivityForm({ db, save, initial, onClose }) {
  const [act, setAct] = useState({ ...newAct(), ...initial });
  const [tab, setTab] = useState(0);
  const A = (k,v) => setAct(a=>({ ...a, [k]:v }));
  const TABS = ["📋","👥","🎽","🎮","⚽","🤝","🥅","⭐"];
  const TLABELS = ["Info","Asistencia","Equipos","Juegos","Deportes","Invitados","Goles","Extras"];

  const submit = () => {
    const isNew=!act.id, saved=isNew?{ ...act, id:db.nextAid }:act;
    save({ ...db, activities:isNew?[...db.activities,saved]:db.activities.map(x=>x.id===saved.id?saved:x), nextAid:isNew?db.nextAid+1:db.nextAid });
    onClose();
  };

  return (
    <div style={{ background:"#0A0A18", minHeight:"100vh", paddingBottom:80 }}>
      <div style={{ background:"#10102A", padding:"16px 16px 0", borderBottom:"1px solid #1E1E3A", position:"sticky", top:0, zIndex:50 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
          <button onClick={onClose} style={{ background:"#1A1A30", border:"none", borderRadius:10, width:36, height:36, color:"#fff", fontSize:18, cursor:"pointer" }}>←</button>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:900, fontSize:17 }}>{act.id?"Editar":"Nueva"} Actividad</div>
            <div style={{ fontSize:11, color:"#666" }}>{act.titulo||"Sin título"} · {formatDate(act.fecha)}</div>
          </div>
          <button onClick={submit} style={{ background:"#A78BFA", border:"none", borderRadius:12, padding:"8px 18px", color:"#fff", fontFamily:"inherit", fontWeight:900, fontSize:14, cursor:"pointer" }}>Guardar</button>
        </div>
        <div style={{ display:"flex" }}>
          {TABS.map((t,i)=>(
            <button key={i} onClick={()=>setTab(i)} title={TLABELS[i]} style={{ flex:1, padding:"8px 4px", background:"none", border:"none", cursor:"pointer", color:tab===i?"#A78BFA":"#555", fontFamily:"inherit", fontWeight:800, fontSize:18, borderBottom:tab===i?"2px solid #A78BFA":"2px solid transparent" }}>{t}</button>
          ))}
        </div>
      </div>
      <div style={{ padding:"20px 16px" }}>
        {tab===0 && <TabInfo act={act} A={A} />}
        {tab===1 && <TabAsistencia act={act} A={A} db={db} />}
        {tab===2 && <TabEquipos act={act} A={A} db={db} />}
        {tab===3 && <TabJuegos act={act} A={A} />}
        {tab===4 && <TabDeportes act={act} A={A} />}
        {tab===5 && <TabInvitados act={act} A={A} db={db} save={save} />}
        {tab===6 && <TabGoles act={act} A={A} db={db} />}
        {tab===7 && <TabExtras act={act} A={A} db={db} />}
      </div>
      <div style={{ position:"fixed", bottom:16, left:16, right:16, display:"flex", gap:10 }}>
        {tab>0&&<button onClick={()=>setTab(t=>t-1)} style={{ flex:1, ...arrowBtnStyle }}>← {TLABELS[tab-1]}</button>}
        {tab<TABS.length-1&&<button onClick={()=>setTab(t=>t+1)} style={{ flex:1, ...arrowBtnStyle, background:"#A78BFA" }}>{TLABELS[tab+1]} →</button>}
        {tab===TABS.length-1&&<button onClick={submit} style={{ flex:1, ...arrowBtnStyle, background:"#22C55E" }}>✓ Guardar</button>}
      </div>
    </div>
  );
}

function TabInfo({ act, A }) {
  return (
    <div style={{ display:"grid", gap:14 }}>
      <Label>Fecha</Label>
      <input type="date" value={act.fecha} onChange={e=>A("fecha",e.target.value)} style={{ ...inputStyle(), fontSize:16 }} />
      <Label>Título (opcional)</Label>
      <input value={act.titulo} onChange={e=>A("titulo",e.target.value)} placeholder="Ej: Actividad Mayo" style={inputStyle()} />
      <InfoCard text="Flujo: Asistencia → Equipos → Juegos → Deportes. Los equipos se asignan por actividad." />
    </div>
  );
}

function TabAsistencia({ act, A, db }) {
  const toggle = (key,id) => { const c=act[key]||[]; A(key,c.includes(id)?c.filter(x=>x!==id):[...c,id]); };
  const sorted = [...db.participants].sort((a,b)=>`${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`));
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <Label style={{ margin:0 }}>{act.asistentes.length}/{db.participants.length} presentes</Label>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={()=>A("asistentes",[])} style={{ ...pillBtnStyle, background:"#2A1010", color:"#FF6B6B" }}>Limpiar</button>
          <button onClick={()=>A("asistentes",sorted.map(p=>p.id))} style={{ ...pillBtnStyle, background:"#0A2220", color:"#4ECDC4" }}>Todos ✓</button>
        </div>
      </div>
      {sorted.length===0&&<Empty text="Primero agregá jugadores" />}
      <div style={{ display:"grid", gap:5 }}>
        {sorted.map(p=>{
          const here=act.asistentes.includes(p.id), punct=act.puntuales.includes(p.id), bib=act.biblias.includes(p.id), team=act.equipos?.[p.id];
          return (
            <div key={p.id} style={{ background:here?"#12122A":"#0D0D1A", borderRadius:10, border:`1px solid ${here?(TC[team]||"#A78BFA44"):"#1E1E3A"}` }}>
              <div style={{ display:"flex", alignItems:"center", padding:"9px 12px", gap:10 }}>
                <div onClick={()=>toggle("asistentes",p.id)} style={{ width:22, height:22, borderRadius:6, background:here?(TC[team]||"#A78BFA"):"#1A1A30", border:`2px solid ${here?(TC[team]||"#A78BFA"):"#444"}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0 }}>
                  {here&&<span style={{ color:"#000", fontSize:11, fontWeight:900 }}>✓</span>}
                </div>
                <Avatar p={p} size={28} />
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:800, fontSize:13, color:here?"#fff":"#444" }}>{p.nombre} {p.apellido}</div>
                  <div style={{ fontSize:10, color:"#555" }}>{p.sexo==="M"?"♂":"♀"} · {p.edad}a</div>
                </div>
                {here&&<div style={{ display:"flex", gap:5, alignItems:"center" }}>
                  {team&&<span style={{ fontSize:10, fontWeight:800, color:TC[team], background:TB[team], borderRadius:5, padding:"2px 6px" }}>{team}</span>}
                  <PillCheck label="⏰" active={punct} onClick={()=>toggle("puntuales",p.id)} color="#FFD93D" />
                  <PillCheck label="📖" active={bib} onClick={()=>toggle("biblias",p.id)} color="#4ECDC4" />
                </div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TabEquipos({ act, A, db }) {
  const present = db.participants.filter(p=>act.asistentes.includes(p.id))
    .sort((a,b)=>`${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`));

  const setTeam = (pid,team) => {
    const eq={ ...(act.equipos||{}) };
    if(eq[pid]===team) delete eq[pid]; else eq[pid]=team;
    A("equipos", eq);
  };

  const autoBalance = (resetAll=false) => {
    const eq = resetAll ? {} : { ...(act.equipos||{}) };
    const counts = {};
    TEAMS.forEach(t=>{ counts[t]={M:0,F:0,total:0}; });
    if (!resetAll) present.forEach(p=>{ const t=eq[p.id]; if(t){ counts[t][p.sexo]++; counts[t].total++; }});
    const unassigned = present.filter(p=>!eq[p.id]);
    const masc=unassigned.filter(p=>p.sexo==="M"), fem=unassigned.filter(p=>p.sexo==="F");
    [...masc,...fem].forEach(p=>{
      const best=[...TEAMS].sort((a,b)=>counts[a][p.sexo]-counts[b][p.sexo]||counts[a].total-counts[b].total)[0];
      eq[p.id]=best; counts[best][p.sexo]++; counts[best].total++;
    });
    A("equipos", eq);
  };

  const teamStats = TEAMS.map(t=>({
    team:t,
    total:present.filter(p=>act.equipos?.[p.id]===t).length,
    m:present.filter(p=>act.equipos?.[p.id]===t&&p.sexo==="M").length,
    f:present.filter(p=>act.equipos?.[p.id]===t&&p.sexo==="F").length,
  }));
  const unassigned = present.filter(p=>!act.equipos?.[p.id]).length;

  return (
    <div>
      {present.length===0&&<InfoCard text="Primero marcá asistencia (pestaña 👥)." />}
      {present.length>0&&<>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8, marginBottom:12 }}>
          {teamStats.map(({ team,total,m,f })=>(
            <div key={team} style={{ background:TB[team], border:`2px solid ${TC[team]}44`, borderRadius:10, padding:"10px 4px", textAlign:"center" }}>
              <div style={{ color:TC[team], fontWeight:900, fontSize:13 }}>{team}</div>
              <div style={{ fontSize:22, fontWeight:900 }}>{total}</div>
              <div style={{ fontSize:9, color:"#888" }}>♂{m} ♀{f}</div>
            </div>
          ))}
        </div>
        <div style={{ display:"flex", gap:8, marginBottom:14 }}>
          {unassigned>0&&<button onClick={()=>autoBalance(false)} style={{ ...pillBtnStyle, background:"#1A1A3A", color:"#A78BFA", flex:1, fontSize:12 }}>⚡ Completar ({unassigned} sin asignar)</button>}
          <button onClick={()=>autoBalance(true)} style={{ ...pillBtnStyle, background:"#2A1A30", color:"#FF6B6B", flex:unassigned>0?0:1, fontSize:12 }}>🔀 Redistribuir todo</button>
        </div>
        {unassigned===0&&<div style={{ background:"#0A2A10", border:"1px solid #22C55E44", borderRadius:10, padding:"8px 14px", fontSize:12, color:"#22C55E", marginBottom:12 }}>✓ Todos asignados · ♂ y ♀ balanceados automáticamente</div>}
        <div style={{ display:"grid", gap:5 }}>
          {present.map(p=>{
            const cur=act.equipos?.[p.id];
            return (
              <div key={p.id} style={{ background:"#12122A", borderRadius:10, padding:"8px 12px", border:`1px solid ${cur?TC[cur]+"55":"#1E1E3A"}`, display:"flex", alignItems:"center", gap:10 }}>
                <Avatar p={p} size={30} />
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:800, fontSize:13 }}>{p.nombre} {p.apellido}</div>
                  <div style={{ fontSize:10, color:"#555" }}>{p.sexo==="M"?"♂":"♀"} · {p.edad}a</div>
                </div>
                <div style={{ display:"flex", gap:4 }}>
                  {TEAMS.map(t=>(
                    <button key={t} onClick={()=>setTeam(p.id,t)} style={{ width:34, height:28, borderRadius:7, border:`1px solid ${TC[t]}44`, cursor:"pointer", background:cur===t?TC[t]:TB[t], color:cur===t?"#000":"#666", fontWeight:900, fontSize:11, fontFamily:"inherit" }}>{t}</button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </>}
    </div>
  );
}

function TabJuegos({ act, A }) {
  const add = () => A("juegos",[...act.juegos,{ id:Date.now(), nombre:"", pos:{} }]);
  const del = (id) => A("juegos",act.juegos.filter(j=>j.id!==id));
  const updN = (id,v) => A("juegos",act.juegos.map(j=>j.id===id?{ ...j,nombre:v }:j));
  const updPos = (jid,team,pos) => {
    A("juegos",act.juegos.map(j=>{
      if(j.id!==jid) return j;
      const newPos={...j.pos};
      const prev=Object.entries(newPos).find(([t,p])=>p===pos&&t!==team);
      if(prev) newPos[prev[0]]=newPos[team];
      if(newPos[team]===pos) delete newPos[team]; else newPos[team]=pos;
      return { ...j, pos:Object.fromEntries(Object.entries(newPos).filter(([,v])=>v!=null)) };
    }));
  };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <Label style={{ margin:0 }}>Juegos · 1°=10 2°=7 3°=4 4°=2 pts</Label>
        <button onClick={add} style={{ ...pillBtnStyle, background:"#1A1A3A", color:"#A78BFA" }}>+ Juego</button>
      </div>
      {act.juegos.length===0&&<InfoCard text="Tocá + Juego para agregar. Luego asigná posiciones tocando los equipos." />}
      <div style={{ display:"grid", gap:16 }}>
        {act.juegos.map((j,gi)=><JuegoCard key={j.id} j={j} gi={gi} onNombre={v=>updN(j.id,v)} onDel={()=>del(j.id)} onPos={(team,pos)=>updPos(j.id,team,pos)} />)}
      </div>
    </div>
  );
}

function JuegoCard({ j, gi, onNombre, onDel, onPos }) {
  const posToTeam={};
  Object.entries(j.pos||{}).forEach(([t,p])=>{ posToTeam[p]=t; });
  const placed=Object.keys(j.pos||{});
  const unplaced=TEAMS.filter(t=>!placed.includes(t));

  return (
    <div style={{ background:"#12122A", borderRadius:14, border:"1px solid #2A2A4A", overflow:"hidden" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px 10px", borderBottom:"1px solid #1E1E3A" }}>
        <div style={{ background:"#A78BFA22", borderRadius:8, width:28, height:28, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, color:"#A78BFA" }}>{gi+1}</div>
        <input value={j.nombre} onChange={e=>onNombre(e.target.value)} placeholder="Nombre del juego..." style={{ ...inputStyle(), margin:0, flex:1 }} />
        <button onClick={onDel} style={{ background:"#FF6B6B22", border:"none", borderRadius:8, width:28, height:28, color:"#FF6B6B", cursor:"pointer" }}>✕</button>
      </div>
      <div style={{ padding:"12px 14px" }}>
        {/* Podium slots */}
        <div style={{ display:"grid", gap:6, marginBottom:12 }}>
          {[1,2,3,4].map(pos=>{
            const team=posToTeam[pos];
            const medals=["🥇","🥈","🥉","4°"];
            return (
              <div key={pos} onClick={()=>team&&onPos(team,pos)} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", background:team?TB[team]:"#0D0D1A", borderRadius:10, border:`2px solid ${team?TC[team]:"#2A2A3A"}`, cursor:team?"pointer":"default", minHeight:46 }}>
                <div style={{ width:42, display:"flex", alignItems:"center", gap:6 }}>
                  <span style={{ fontSize:20 }}>{medals[pos-1]}</span>
                  <span style={{ fontSize:11, color:"#444", fontWeight:700 }}>+{PTS.rec[pos]}</span>
                </div>
                {team ? (
                  <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <span style={{ fontWeight:900, fontSize:20, color:TC[team] }}>{team}</span>
                    <span style={{ fontSize:11, color:"#444" }}>toca para quitar</span>
                  </div>
                ) : <span style={{ color:"#2A2A4A", fontSize:13 }}>— tocar equipo de abajo para asignar</span>}
              </div>
            );
          })}
        </div>
        {/* Unplaced chips */}
        {unplaced.length>0&&(
          <div>
            <div style={{ fontSize:11, color:"#555", fontWeight:700, marginBottom:8, textTransform:"uppercase", letterSpacing:1 }}>Sin posición — toca para asignar al siguiente lugar</div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {unplaced.map(t=>{
                const nextPos=[1,2,3,4].find(p=>!posToTeam[p]);
                return <button key={t} onClick={()=>nextPos&&onPos(t,nextPos)} style={{ padding:"10px 22px", borderRadius:10, border:`2px solid ${TC[t]}`, cursor:"pointer", background:TB[t], color:TC[t], fontWeight:900, fontSize:18, fontFamily:"inherit" }}>{t}</button>;
              })}
            </div>
          </div>
        )}
        {unplaced.length===0&&<div style={{ fontSize:12, color:"#22C55E", textAlign:"center", paddingTop:4 }}>✓ Todos posicionados</div>}
      </div>
    </div>
  );
}

function TabDeportes({ act, A }) {
  const add = () => A("partidos",[...(act.partidos||[]),{ id:Date.now(), deporte:"Fútbol", genero:"M", eq1:"E1", eq2:"E2", resultado:null }]);
  const del = (id) => A("partidos",(act.partidos||[]).filter(p=>p.id!==id));
  const upd = (id,k,v) => A("partidos",(act.partidos||[]).map(p=>p.id===id?{ ...p,[k]:v }:p));

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <Label style={{ margin:0 }}>Partidos · Ganó=+4 Empate=+2 Perdió=+1</Label>
        <button onClick={add} style={{ ...pillBtnStyle, background:"#1A1A3A", color:"#4ECDC4" }}>+ Partido</button>
      </div>
      {(act.partidos||[]).length===0&&<InfoCard text="Agregá cada partido. Elegí qué equipos jugaron y el resultado." />}
      <div style={{ display:"grid", gap:14 }}>
        {(act.partidos||[]).map(part=><PartidoCard key={part.id} part={part} onDel={()=>del(part.id)} onUpd={(k,v)=>upd(part.id,k,v)} />)}
      </div>
    </div>
  );
}

function PartidoCard({ part, onDel, onUpd }) {
  const icon={"Fútbol":"⚽","Handball":"🤾","Básquet":"🏀","Vóley":"🏐","Otro":"🏆"};
  return (
    <div style={{ background:"#12122A", borderRadius:14, border:"1px solid #2A2A4A", overflow:"hidden" }}>
      <div style={{ padding:"10px 14px", background:"#10102A", borderBottom:"1px solid #1E1E3A", display:"flex", gap:8, alignItems:"center" }}>
        <select value={part.deporte} onChange={e=>onUpd("deporte",e.target.value)} style={{ ...inputStyle(), margin:0, flex:1, padding:"7px 10px" }}>
          {DEPORTES.map(d=><option key={d} value={d}>{icon[d]} {d}</option>)}
        </select>
        <select value={part.genero} onChange={e=>onUpd("genero",e.target.value)} style={{ ...inputStyle(), margin:0, flex:1, padding:"7px 10px" }}>
          {GENEROS.map(g=><option key={g.val} value={g.val}>{g.label}</option>)}
        </select>
        <button onClick={onDel} style={{ background:"#FF6B6B22", border:"none", borderRadius:8, width:30, height:30, color:"#FF6B6B", cursor:"pointer", flexShrink:0 }}>✕</button>
      </div>
      <div style={{ padding:"14px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr auto 1fr", alignItems:"center", gap:8, marginBottom:14 }}>
          <select value={part.eq1} onChange={e=>onUpd("eq1",e.target.value)} style={{ ...inputStyle(), margin:0, background:TB[part.eq1], color:TC[part.eq1], fontWeight:900, fontSize:18, textAlign:"center", padding:"10px 4px" }}>
            {TEAMS.map(t=><option key={t} value={t}>{t}</option>)}
          </select>
          <span style={{ fontWeight:900, color:"#555", textAlign:"center" }}>VS</span>
          <select value={part.eq2} onChange={e=>onUpd("eq2",e.target.value)} style={{ ...inputStyle(), margin:0, background:TB[part.eq2], color:TC[part.eq2], fontWeight:900, fontSize:18, textAlign:"center", padding:"10px 4px" }}>
            {TEAMS.filter(t=>t!==part.eq1).map(t=><option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6 }}>
          {[["eq1",`✓ ${part.eq1}`],["empate","= Empate"],["eq2",`✓ ${part.eq2}`]].map(([val,label])=>(
            <button key={val} onClick={()=>onUpd("resultado",part.resultado===val?null:val)} style={{
              padding:"11px 4px", borderRadius:10, cursor:"pointer", fontWeight:900, fontSize:12, fontFamily:"inherit",
              background:part.resultado===val?"#22C55E":"#0D0D1A", color:part.resultado===val?"#000":"#555",
              border:`2px solid ${part.resultado===val?"#22C55E88":"#2A2A4A"}`,
            }}>{label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

function TabInvitados({ act, A, db, save }) {
  const add = () => A("invitaciones",[...(act.invitaciones||[]),{ id:Date.now(), invitador:null, invitado_id:null }]);
  const del = (id) => A("invitaciones",(act.invitaciones||[]).filter(i=>i.id!==id));
  const upd = (id,k,v) => A("invitaciones",(act.invitaciones||[]).map(i=>i.id===id?{ ...i,[k]:v }:i));

  // Quick-add new participant inline
  const [quickAdd, setQuickAdd] = useState(null); // { invId, nombre, apellido, sexo, edad }
  const initQuick = (invId) => setQuickAdd({ invId, nombre:"", apellido:"", sexo:"M", edad:"" });

  const confirmQuick = () => {
    if (!quickAdd?.nombre.trim()) return;
    const newP = { ...newPart(), id: db.nextPid, nombre: quickAdd.nombre, apellido: quickAdd.apellido, sexo: quickAdd.sexo, edad: quickAdd.edad };
    // Save new participant to DB
    save({ ...db, participants:[...db.participants, newP], nextPid: db.nextPid+1 });
    // Link them as invitado and add to asistentes automatically
    upd(quickAdd.invId, "invitado_id", newP.id);
    A("asistentes", [...act.asistentes, newP.id]);
    setQuickAdd(null);
  };

  return (
    <div>
      {/* Quick-add mini modal */}
      {quickAdd && (
        <div style={{ position:"fixed", inset:0, background:"#000000AA", zIndex:200, display:"flex", alignItems:"flex-end" }}>
          <div style={{ background:"#12122A", width:"100%", borderRadius:"20px 20px 0 0", padding:"20px 16px 32px", border:"1px solid #2A2A4A" }}>
            <div style={{ fontWeight:900, fontSize:16, marginBottom:16, display:"flex", justifyContent:"space-between" }}>
              <span>👋 Nuevo participante</span>
              <button onClick={()=>setQuickAdd(null)} style={{ background:"none", border:"none", color:"#FF6B6B", cursor:"pointer", fontSize:18 }}>✕</button>
            </div>
            <InfoCard text="El invitado se agregará como participante y quedará marcado como asistente en esta actividad." />
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:12 }}>
              <div>
                <Label>Nombre</Label>
                <input value={quickAdd.nombre} onChange={e=>setQuickAdd(q=>({ ...q, nombre:e.target.value }))} placeholder="Nombre" style={{ ...inputStyle(), marginBottom:0 }} autoFocus />
              </div>
              <div>
                <Label>Apellido</Label>
                <input value={quickAdd.apellido} onChange={e=>setQuickAdd(q=>({ ...q, apellido:e.target.value }))} placeholder="Apellido" style={{ ...inputStyle(), marginBottom:0 }} />
              </div>
              <div>
                <Label>Edad</Label>
                <input value={quickAdd.edad} onChange={e=>setQuickAdd(q=>({ ...q, edad:e.target.value }))} type="number" placeholder="Edad" style={{ ...inputStyle(), marginBottom:0 }} />
              </div>
              <div>
                <Label>Sexo</Label>
                <div style={{ display:"flex", gap:6 }}>
                  {[["M","♂ Varón"],["F","♀ Mujer"]].map(([v,l])=>(
                    <button key={v} onClick={()=>setQuickAdd(q=>({ ...q, sexo:v }))} style={{ flex:1, padding:"11px 4px", borderRadius:10, border:"none", cursor:"pointer", background:quickAdd.sexo===v?"#A78BFA":"#1A1A30", color:quickAdd.sexo===v?"#fff":"#666", fontFamily:"inherit", fontWeight:800, fontSize:12 }}>{l}</button>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={confirmQuick} style={{ ...primaryBtn, marginTop:14, marginBottom:0 }}>
              ✓ Agregar y vincular como invitado
            </button>
          </div>
        </div>
      )}

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
        <Label style={{ margin:0 }}>Quien invita +5 · Invitado nuevo +3</Label>
        <button onClick={add} style={{ ...pillBtnStyle, background:"#0A2220", color:"#4ECDC4" }}>+ Agregar</button>
      </div>
      <InfoCard text="Si el invitado es nuevo, primero agregalo como participante con el botón 👋 Nuevo, luego aparecerá en la lista." />
      <div style={{ display:"grid", gap:10, marginTop:12 }}>
        {(act.invitaciones||[]).map(inv=>{
          const invitado = db.participants.find(p=>p.id===inv.invitado_id);
          return (
            <div key={inv.id} style={{ background:"#12122A", borderRadius:12, border:"1px solid #2A2A4A", overflow:"hidden" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", borderBottom:"1px solid #1E1E3A" }}>
                <Label style={{ margin:0 }}>Invitación</Label>
                <button onClick={()=>del(inv.id)} style={{ background:"none", border:"none", color:"#FF6B6B", cursor:"pointer" }}>✕</button>
              </div>
              <div style={{ padding:"12px 14px" }}>
                <Label>¿Quién invitó? (+5 pts)</Label>
                <select value={inv.invitador||""} onChange={e=>upd(inv.id,"invitador",Number(e.target.value)||null)} style={{ ...inputStyle(), marginBottom:14 }}>
                  <option value="">— Seleccionar —</option>
                  {db.participants.filter(p=>act.asistentes.includes(p.id)).map(p=>(
                    <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>
                  ))}
                </select>

                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                  <Label style={{ margin:0 }}>Invitado (+3 pts)</Label>
                  <button onClick={()=>initQuick(inv.id)} style={{ ...pillBtnStyle, background:"#1A1235", color:"#A78BFA", border:"1px solid #A78BFA44", fontSize:11 }}>👋 Nuevo participante</button>
                </div>

                {invitado ? (
                  // Selected — show card
                  <div style={{ display:"flex", alignItems:"center", gap:10, background:"#0D0D1A", borderRadius:10, padding:"10px 12px", border:`1px solid #A78BFA44` }}>
                    <Avatar p={invitado} size={32} />
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:800, fontSize:13 }}>{invitado.nombre} {invitado.apellido}</div>
                      <div style={{ fontSize:11, color:"#555" }}>{invitado.sexo==="M"?"♂":"♀"} · {invitado.edad}a</div>
                    </div>
                    <button onClick={()=>upd(inv.id,"invitado_id",null)} style={{ background:"none", border:"none", color:"#888", cursor:"pointer", fontSize:13 }}>✕</button>
                  </div>
                ) : (
                  <select value={""} onChange={e=>upd(inv.id,"invitado_id",Number(e.target.value)||null)} style={{ ...inputStyle(), marginBottom:0, border:"1px solid #A78BFA44" }}>
                    <option value="">— Seleccionar participante —</option>
                    {db.participants.map(p=>(
                      <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          );
        })}
        {(act.invitaciones||[]).length===0&&<Empty text="Sin invitados hoy" />}
      </div>
    </div>
  );
}

function TabGoles({ act, A, db }) {
  const add = () => A("goles",[...(act.goles||[]),{ id:Date.now(), pid:null, tipo:"f", cant:1 }]);
  const del = (id) => A("goles",(act.goles||[]).filter(g=>g.id!==id));
  const upd = (id,k,v) => A("goles",(act.goles||[]).map(g=>g.id===id?{ ...g,[k]:v }:g));
  const scorers=db.participants.filter(p=>act.asistentes.includes(p.id));
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <Label style={{ margin:0 }}>Goles · +1 pt por gol (bonus anual)</Label>
        <button onClick={add} style={{ ...pillBtnStyle, background:"#1A2A10", color:"#FFD93D" }}>+ Gol</button>
      </div>
      <div style={{ display:"grid", gap:8 }}>
        {(act.goles||[]).map(g=>(
          <div key={g.id} style={{ background:"#12122A", borderRadius:12, padding:"10px 12px", border:"1px solid #2A2A4A", display:"flex", gap:8, alignItems:"center" }}>
            <div style={{ flex:2 }}>
              <select value={g.pid||""} onChange={e=>upd(g.id,"pid",Number(e.target.value)||null)} style={{ ...inputStyle(), margin:0, fontSize:13, padding:"8px 10px" }}>
                <option value="">— Goleador —</option>
                {scorers.map(p=><option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
              </select>
            </div>
            <div style={{ display:"flex", gap:4 }}>
              {[["f","⚽"],["h","🤾"],["b","🏀"]].map(([t,ico])=>(
                <button key={t} onClick={()=>upd(g.id,"tipo",t)} style={{ width:34, height:34, borderRadius:8, border:`1px solid ${g.tipo===t?"#FFD93D44":"#2A2A4A"}`, cursor:"pointer", background:g.tipo===t?"#FFD93D22":"#0D0D1A", fontSize:18 }}>{ico}</button>
              ))}
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:4 }}>
              <button onClick={()=>upd(g.id,"cant",Math.max(1,g.cant-1))} style={smallBtnStyle}>−</button>
              <span style={{ fontWeight:900, fontSize:18, minWidth:22, textAlign:"center" }}>{g.cant}</span>
              <button onClick={()=>upd(g.id,"cant",g.cant+1)} style={smallBtnStyle}>+</button>
            </div>
            <button onClick={()=>del(g.id)} style={{ background:"none", border:"none", color:"#FF6B6B", cursor:"pointer", fontSize:16 }}>✕</button>
          </div>
        ))}
        {(act.goles||[]).length===0&&<Empty text="Sin goles" />}
      </div>
    </div>
  );
}

function TabExtras({ act, A, db }) {
  const addE=()=>A("extras",[...(act.extras||[]),{ id:Date.now(), pid:null, puntos:5, motivo:"" }]);
  const addD=()=>A("descuentos",[...(act.descuentos||[]),{ id:Date.now(), pid:null, puntos:5, motivo:"" }]);
  const delE=(id)=>A("extras",(act.extras||[]).filter(e=>e.id!==id));
  const delD=(id)=>A("descuentos",(act.descuentos||[]).filter(d=>d.id!==id));
  const updE=(id,k,v)=>A("extras",(act.extras||[]).map(e=>e.id===id?{ ...e,[k]:v }:e));
  const updD=(id,k,v)=>A("descuentos",(act.descuentos||[]).map(d=>d.id===id?{ ...d,[k]:v }:d));
  const Row=({ item, color, onDel, onUpd })=>(
    <div style={{ background:"#12122A", borderRadius:12, padding:"10px 14px", border:`1px solid ${color}33` }}>
      <div style={{ display:"flex", gap:8, marginBottom:8, alignItems:"center" }}>
        <select value={item.pid||""} onChange={e=>onUpd("pid",Number(e.target.value)||null)} style={{ ...inputStyle(), margin:0, flex:1, fontSize:13, padding:"8px 10px" }}>
          <option value="">— Jugador —</option>
          {db.participants.map(p=><option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
        </select>
        <span style={{ color, fontWeight:900 }}>{color==="#22C55E"?"+":"−"}</span>
        <button onClick={()=>onUpd("puntos",Math.max(1,item.puntos-1))} style={smallBtnStyle}>−</button>
        <span style={{ fontWeight:900, fontSize:18, minWidth:20, textAlign:"center" }}>{item.puntos}</span>
        <button onClick={()=>onUpd("puntos",item.puntos+1)} style={smallBtnStyle}>+</button>
        <button onClick={onDel} style={{ background:"none", border:"none", color:"#FF6B6B", cursor:"pointer", fontSize:16 }}>✕</button>
      </div>
      <input value={item.motivo} onChange={e=>onUpd("motivo",e.target.value)} placeholder="Motivo..." style={{ ...inputStyle(), margin:0, fontSize:12 }} />
    </div>
  );
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <Label style={{ margin:0, color:"#22C55E" }}>⭐ Extras</Label>
        <button onClick={addE} style={{ ...pillBtnStyle, background:"#162A16", color:"#22C55E" }}>+ Agregar</button>
      </div>
      <div style={{ display:"grid", gap:8, marginBottom:20 }}>
        {(act.extras||[]).map(e=><Row key={e.id} item={e} color="#22C55E" onDel={()=>delE(e.id)} onUpd={(k,v)=>updE(e.id,k,v)} />)}
        {(act.extras||[]).length===0&&<Empty text="Sin puntos extra" />}
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <Label style={{ margin:0, color:"#FF6B6B" }}>🔻 Descuentos</Label>
        <button onClick={addD} style={{ ...pillBtnStyle, background:"#2A1010", color:"#FF6B6B" }}>+ Agregar</button>
      </div>
      <div style={{ display:"grid", gap:8 }}>
        {(act.descuentos||[]).map(d=><Row key={d.id} item={d} color="#FF6B6B" onDel={()=>delD(d.id)} onUpd={(k,v)=>updD(d.id,k,v)} />)}
        {(act.descuentos||[]).length===0&&<Empty text="Sin descuentos" />}
      </div>
    </div>
  );
}

// ─── UI PRIMITIVES ────────────────────────────────────────────────────────────
function Avatar({ p, size=36 }) {
  const initials=`${p.nombre?.[0]||""}${p.apellido?.[0]||""}`.toUpperCase();
  const colors=["#FF6B6B","#4ECDC4","#FFD93D","#A78BFA","#FF9F43","#26C6DA","#F06292","#66BB6A"];
  const c=colors[(p.id||0)%colors.length];
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", overflow:"hidden", flexShrink:0, background:`${c}22`, border:`2px solid ${c}44`, display:"flex", alignItems:"center", justifyContent:"center" }}>
      {p.foto?<img src={p.foto} style={{ width:"100%", height:"100%", objectFit:"cover" }} />:<span style={{ fontSize:size*0.36, fontWeight:900, color:c }}>{initials||"?"}</span>}
    </div>
  );
}

const Loader=()=>(
  <div style={{ background:"#0A0A18", minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center" }}>
    <div style={{ textAlign:"center" }}><div style={{ fontSize:48 }}>⚡</div><div style={{ fontWeight:800, color:"#A78BFA", marginTop:12 }}>Cargando...</div></div>
  </div>
);
function Modal({ title, onClose, children }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"#0A0A18", overflowY:"auto", zIndex:300, paddingBottom:20 }}>
      <div style={{ background:"#10102A", padding:"16px 16px 12px", borderBottom:"1px solid #1E1E3A", display:"flex", alignItems:"center", gap:10, position:"sticky", top:0 }}>
        <button onClick={onClose} style={{ background:"#1A1A30", border:"none", borderRadius:10, width:36, height:36, color:"#fff", fontSize:18, cursor:"pointer" }}>←</button>
        <div style={{ fontWeight:900, fontSize:18 }}>{title}</div>
      </div>
      <div style={{ padding:"20px 16px" }}>{children}</div>
    </div>
  );
}
const PageHeader=({ title, sub })=>(
  <div style={{ background:"#10102A", padding:"20px 16px 14px", borderBottom:"1px solid #1E1E3A" }}>
    <div style={{ fontSize:11, letterSpacing:3, color:"#A78BFA", fontWeight:800, textTransform:"uppercase" }}>⚡ Activados</div>
    <h2 style={{ margin:"4px 0 0", fontSize:24, fontWeight:900 }}>{title}</h2>
    <div style={{ fontSize:12, color:"#555", marginTop:2 }}>{sub}</div>
  </div>
);
const Section=({ icon, title })=>(
  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
    <span style={{ fontSize:16 }}>{icon}</span><div style={{ fontWeight:900, fontSize:15 }}>{title}</div>
  </div>
);
const Label=({ children, style })=><div style={{ fontSize:11, color:"#888", fontWeight:700, letterSpacing:1, textTransform:"uppercase", marginBottom:6, ...style }}>{children}</div>;
const Empty=({ text })=><div style={{ textAlign:"center", padding:"32px 16px", color:"#444", fontSize:14 }}>{text}</div>;
const InfoCard=({ text })=><div style={{ background:"#1A1A2A", borderRadius:10, padding:"12px 14px", fontSize:13, color:"#888", border:"1px solid #2A2A3A", lineHeight:1.5 }}>{text}</div>;
const Chip=({ icon, val, label })=><div style={{ background:"#1A1A30", borderRadius:8, padding:"4px 10px", fontSize:11, color:"#888", fontWeight:700 }}>{icon} {val} <span style={{ color:"#444" }}>{label}</span></div>;
const PillCheck=({ label, active, onClick, color })=><button onClick={onClick} style={{ padding:"4px 8px", borderRadius:8, border:`1px solid ${active?color+"66":"#1E1E3A"}`, cursor:"pointer", background:active?`${color}33`:"#0D0D1A", fontSize:13, color:active?color:"#333" }}>{label}</button>;
const SaveBtn=({ onClick, label })=><button onClick={onClick} style={{ width:"100%", padding:"14px", background:"linear-gradient(135deg,#A78BFA,#6C63FF)", border:"none", borderRadius:14, color:"#fff", fontFamily:"inherit", fontWeight:900, fontSize:16, cursor:"pointer", marginTop:8 }}>{label}</button>;
function SegmentedButtons({ options, value, onChange }) {
  return (
    <div style={{ display:"flex", gap:6, marginBottom:12 }}>
      {options.map(({ val,label,color })=>(
        <button key={val} onClick={()=>onChange(val)} style={{ flex:1, padding:"10px", borderRadius:10, border:"none", cursor:"pointer", background:value===val?(color||"#A78BFA"):"#1A1A30", color:value===val?(color?"#000":"#fff"):"#666", fontFamily:"inherit", fontWeight:800, fontSize:13 }}>{label}</button>
      ))}
    </div>
  );
}
const inputStyle=()=>({ width:"100%", boxSizing:"border-box", padding:"11px 14px", background:"#12122A", border:"1px solid #2A2A4A", borderRadius:10, color:"#fff", fontFamily:"inherit", fontSize:14, outline:"none", marginBottom:12 });
const primaryBtn={ width:"100%", padding:"14px", background:"linear-gradient(135deg,#A78BFA,#6C63FF)", border:"none", borderRadius:14, color:"#fff", fontFamily:"inherit", fontWeight:900, fontSize:16, cursor:"pointer", marginBottom:16 };
const pillBtnStyle={ padding:"7px 14px", borderRadius:100, border:"none", cursor:"pointer", fontFamily:"inherit", fontWeight:800, fontSize:12 };
const arrowBtnStyle={ padding:"12px", background:"#1A1A30", border:"none", borderRadius:14, color:"#fff", fontFamily:"inherit", fontWeight:900, fontSize:13, cursor:"pointer" };
const smallBtnStyle={ width:26, height:26, borderRadius:8, background:"#1A1A30", border:"1px solid #3A3A5A", color:"#fff", fontWeight:900, fontSize:14, cursor:"pointer", fontFamily:"inherit" };
const formatDate=(d)=>{ if(!d) return ""; const [y,m,day]=d.split("-"); return `${day} ${["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"][parseInt(m)-1]} ${y}`; };
