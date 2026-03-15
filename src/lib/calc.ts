import { PTS, TEAMS } from './constants';

export function actPts(pid: number, a: any, participants: any[]) {
  const p = participants.find(x => x.id === pid);
  if (!p) return 0;
  
  const team = a.equipos?.[pid] as string | undefined;
  const here = a.asistentes.includes(pid);
  let pts = 0;
  
  if (here) {
    pts += PTS.asistencia;
    if (a.puntuales.includes(pid)) pts += PTS.puntualidad;
    if (a.biblias.includes(pid)) pts += PTS.biblia;
    
    const isSocial = (a.socials || []).includes(pid);

    if (isSocial) {
      // Social mode adds 4th place points for each game
      for (const _j of (a.juegos || [])) {
        pts += PTS.rec[4] || 0;
      }
    } else if (team) {
      for (const j of (a.juegos || [])) {
        const r = j.pos?.[team] as number | undefined;
        if (r) {
          // @ts-ignore
          pts += PTS.rec[r] || 0;
        }
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
    if ((a.invitaciones || []).some((i: any) => i.invitador === pid)) pts += PTS.invito;
    if ((a.invitaciones || []).some((i: any) => i.invitado_id === pid)) pts += PTS.invitado;
  }
  
  for (const e of (a.extras || [])) {
    if (e.pid === pid || (team && e.team === team)) pts += (e.puntos as number);
  }
  for (const d of (a.descuentos || [])) {
    if (d.pid === pid || (team && d.team === team)) pts -= (d.puntos as number);
  }
  
  return pts;
}

export function actGoles(pid: number, a: any) {
  return (a.goles || []).filter((g: any) => g.pid === pid).reduce((s: number, g: any) => s + g.cant, 0);
}

export function calcPts(pid: number, activities: any[], participants: any[]) {
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

export function calcDayTeamPts(a: any, participants: any[]) {
  const acc: Record<string, number> = {};
  TEAMS.forEach(t => acc[t] = 0);
  for (const [pidStr, team] of Object.entries(a.equipos || {})) {
    const pid = Number(pidStr);
    if (!a.asistentes.includes(pid)) continue;
    const t = team as string;
    if (acc[t] !== undefined) {
      acc[t] = (acc[t] || 0) + actPts(pid, a, participants);
    }
  }
  return acc;
}
