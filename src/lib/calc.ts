import { PTS, TEAMS } from './constants';

export function actPts(pid, a, participants) {
  const p = participants.find(x => x.id === pid);
  if (!p) return 0;
  
  const team = a.equipos?.[pid];
  const here = a.asistentes.includes(pid);
  let pts = 0;
  
  if (here) {
    pts += PTS.asistencia;
    if (a.puntuales.includes(pid)) pts += PTS.puntualidad;
    if (a.biblias.includes(pid)) pts += PTS.biblia;
    
    if (team) {
      for (const j of (a.juegos || [])) {
        const r = j.pos?.[team];
        if (r) pts += PTS.rec[r] || 0;
      }
      for (const part of (a.partidos || [])) {
        if (part.genero === "M" && p.sexo !== "M") continue;
        if (part.genero === "F" && p.sexo !== "F") continue;
        if (part.eq1 !== team && part.eq2 !== team) continue;
        if (!part.resultado) continue;
        if (part.resultado === "empate") pts += PTS.dep.empato;
        else {
          const w = part.resultado === "eq1" ? part.eq1 : part.eq2;
          pts += w === team ? PTS.dep.gano : PTS.dep.perdio;
        }
      }
    }
    if ((a.invitaciones || []).some(i => i.invitador === pid)) pts += PTS.invito;
  }
  
  if ((a.invitaciones || []).some(i => i.invitado_id === pid)) pts += PTS.invitado;
  for (const e of (a.extras || [])) if (e.pid === pid) pts += e.puntos;
  for (const d of (a.descuentos || [])) if (d.pid === pid) pts -= d.puntos;
  
  return pts;
}

export function actGoles(pid, a) {
  return (a.goles || []).filter(g => g.pid === pid).reduce((s, g) => s + g.cant, 0);
}

export function calcPts(pid, activities, participants) {
  let total = 0, gf = 0, gh = 0, gb = 0, acts = 0;
  
  for (const a of activities) {
    if (a.asistentes.includes(pid)) acts++;
    total += actPts(pid, a, participants);
    for (const g of (a.goles || [])) {
      if (g.pid === pid) {
        if (g.tipo === "f") gf += g.cant;
        else if (g.tipo === "h") gh += g.cant;
        else gb += g.cant;
      }
    }
  }
  
  return { total: total + gf + gh + gb, gf, gh, gb, acts };
}

export function calcDayTeamPts(a, participants) {
  const acc = { E1: 0, E2: 0, E3: 0, E4: 0 };
  for (const [pidStr, team] of Object.entries(a.equipos || {})) {
    const pid = Number(pidStr);
    if (!a.asistentes.includes(pid)) continue;
    acc[team] = (acc[team] || 0) + actPts(pid, a, participants);
  }
  return acc;
}
