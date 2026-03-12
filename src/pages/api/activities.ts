import { db } from '../../lib/db';
import * as schema from '../../lib/schema';
import { eq, inArray, and } from 'drizzle-orm';
import { eventBus } from '../../lib/eventBus';

export async function GET() {
  try {
    const allActs = await db.select().from(schema.activities);
    if (allActs.length === 0) return new Response('[]', { status: 200, headers: {'Content-Type': 'application/json'} });

    const actIds = allActs.map(a => a.id);
    const ap = await db.select().from(schema.activityParticipants).where(inArray(schema.activityParticipants.activityId, actIds));
    const jj = await db.select().from(schema.juegos).where(inArray(schema.juegos.activityId, actIds));
    const jjIds = jj.map(j => j.id);
    const jp = jjIds.length > 0 ? await db.select().from(schema.juegoPosiciones).where(inArray(schema.juegoPosiciones.juegoId, jjIds)) : [];
    const part = await db.select().from(schema.partidos).where(inArray(schema.partidos.activityId, actIds));
    const gol = await db.select().from(schema.goles).where(inArray(schema.goles.activityId, actIds));
    const ext = await db.select().from(schema.extras).where(inArray(schema.extras.activityId, actIds));
    const inv = await db.select().from(schema.invitaciones).where(inArray(schema.invitaciones.activityId, actIds));

    const parsed = allActs.map(a => {
      const actAp = ap.filter(x => x.activityId === a.id);
      const equipos: any = {};
      actAp.forEach(x => { if (x.equipo) equipos[x.participantId] = x.equipo; });

      const actJuegos = jj.filter(x => x.activityId === a.id).map(j => {
        const pos: any = {};
        jp.filter(x => x.juegoId === j.id).forEach(x => { pos[x.equipo] = x.posicion; });
        return { id: j.id, nombre: j.nombre, pos };
      });

      return {
        id: a.id,
        fecha: a.fecha,
        titulo: a.titulo || '',
        asistentes: actAp.map(x => x.participantId),
        puntuales: actAp.filter(x => x.esPuntual).map(x => x.participantId),
        biblias: actAp.filter(x => x.tieneBiblia).map(x => x.participantId),
        equipos,
        juegos: actJuegos,
        partidos: part.filter(x => x.activityId === a.id).map(p => ({
          id: p.id, deporte: p.deporte, genero: p.genero, eq1: p.eq1, eq2: p.eq2, resultado: p.resultado
        })),
        goles: gol.filter(x => x.activityId === a.id).map(x => ({
          id: x.id,
          pid: x.participantId,
          tipo: x.tipo,
          cant: x.cant,
          matchId: x.matchId,
          team: x.team
        })),
        extras: ext.filter(x => x.activityId === a.id && x.tipo === 'extra').map(x => ({ pid: x.participantId, puntos: x.puntos })),
        descuentos: ext.filter(x => x.activityId === a.id && x.tipo === 'descuento').map(x => ({ pid: x.participantId, puntos: x.puntos })),
        invitaciones: inv.filter(x => x.activityId === a.id).map(x => ({ invitador: x.invitadorId, invitado_id: x.invitadoId })),
      };
    });

    return new Response(JSON.stringify(parsed), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function POST({ request }: { request: Request }) {
  try {
    const body = await request.json();
    const { data, isNew } = body;
    
    let currentActId = data.id;

    if (isNew) {
      const result = await db.insert(schema.activities).values({
        fecha: data.fecha,
        titulo: data.titulo || '',
      }).returning({ id: schema.activities.id });
      currentActId = result[0].id;
    } else {
      await db.update(schema.activities).set({
        fecha: data.fecha,
        titulo: data.titulo || '',
      }).where(eq(schema.activities.id, currentActId));

      // Limpiar todo lo anterior
      await db.delete(schema.activityParticipants).where(eq(schema.activityParticipants.activityId, currentActId));
      await db.delete(schema.juegos).where(eq(schema.juegos.activityId, currentActId)); // Se lleva las posiciones por cascade, o las borramos si hace falta
      await db.delete(schema.partidos).where(eq(schema.partidos.activityId, currentActId));
      await db.delete(schema.goles).where(eq(schema.goles.activityId, currentActId));
      await db.delete(schema.extras).where(eq(schema.extras.activityId, currentActId));
      await db.delete(schema.invitaciones).where(eq(schema.invitaciones.activityId, currentActId));
    }

    // Insertar asistentes
    if (data.asistentes && data.asistentes.length > 0) {
      const apData = data.asistentes.map((pid: number) => ({
        activityId: currentActId,
        participantId: pid,
        equipo: data.equipos && data.equipos[pid] ? data.equipos[pid] : null,
        esPuntual: (data.puntuales || []).includes(pid),
        tieneBiblia: (data.biblias || []).includes(pid),
      }));
      await db.insert(schema.activityParticipants).values(apData);
    }

    // Insertar juegos
    if (data.juegos && data.juegos.length > 0) {
      for (const j of data.juegos) {
        const jRes = await db.insert(schema.juegos).values({
          activityId: currentActId,
          nombre: j.nombre || '',
        }).returning({ id: schema.juegos.id });
        const jId = jRes[0].id;
        
        if (j.pos && Object.keys(j.pos).length > 0) {
          const jpData = Object.entries(j.pos).map(([eqName, p]: [string, any]) => ({
            juegoId: jId,
            equipo: eqName,
            posicion: p,
          }));
          await db.insert(schema.juegoPosiciones).values(jpData);
        }
      }
    }

    // Partidos y Goles (con mapeo de IDs para mantener la relación)
    const matchIdMap: Record<number | string, number> = {};

    if (data.partidos && data.partidos.length > 0) {
      for (const p of data.partidos) {
        const pRes = await db.insert(schema.partidos).values({
          activityId: currentActId,
          deporte: p.deporte || 'Fútbol',
          genero: p.genero || 'M',
          eq1: p.eq1,
          eq2: p.eq2,
          resultado: p.resultado,
        }).returning({ id: schema.partidos.id });
        
        if (p.id) {
          matchIdMap[p.id] = pRes[0].id;
        }
      }
    }

    // Goles
    if (data.goles && data.goles.length > 0) {
      const gData = data.goles.map((g: any) => ({
        activityId: currentActId,
        participantId: g.pid || null,
        matchId: g.matchId ? (matchIdMap[g.matchId] || null) : null,
        team: g.team || null,
        tipo: g.tipo,
        cant: g.cant,
      }));
      await db.insert(schema.goles).values(gData);
    }

    // Extras
    const extrasData: any[] = [];
    if (data.extras && data.extras.length > 0) {
      data.extras.forEach((e: any) => {
        extrasData.push({ activityId: currentActId, participantId: e.pid, tipo: 'extra', puntos: e.puntos });
      });
    }
    if (data.descuentos && data.descuentos.length > 0) {
      data.descuentos.forEach((e: any) => {
        extrasData.push({ activityId: currentActId, participantId: e.pid, tipo: 'descuento', puntos: e.puntos });
      });
    }
    if (extrasData.length > 0) {
      await db.insert(schema.extras).values(extrasData);
    }

    // Invitaciones
    if (data.invitaciones && data.invitaciones.length > 0) {
      const invData = data.invitaciones.map((i: any) => ({
        activityId: currentActId,
        invitadorId: i.invitador,
        invitadoId: i.invitado_id,
      }));
      await db.insert(schema.invitaciones).values(invData);
    }

    eventBus.emit('data-changed');

    return new Response(JSON.stringify({ id: currentActId, success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function PATCH({ request }: { request: Request }) {
  try {
    const body = await request.json();
    const { activityId, type, data } = body;

    if (!activityId) throw new Error('Activity ID is required');

    switch (type) {
      case 'attendance': {
        const { participantId, value } = data;
        if (value) {
          await db.insert(schema.activityParticipants).values({
            activityId,
            participantId,
          }).onConflictDoNothing();
        } else {
          await db.delete(schema.activityParticipants)
            .where(and(
              eq(schema.activityParticipants.activityId, activityId),
              eq(schema.activityParticipants.participantId, participantId)
            ));
        }
        break;
      }
      case 'puntuales': {
        const { participantId, value } = data;
        await db.update(schema.activityParticipants)
          .set({ esPuntual: value })
          .where(and(
            eq(schema.activityParticipants.activityId, activityId),
            eq(schema.activityParticipants.participantId, participantId)
          ));
        break;
      }
      case 'biblias': {
        const { participantId, value } = data;
        await db.update(schema.activityParticipants)
          .set({ tieneBiblia: value })
          .where(and(
            eq(schema.activityParticipants.activityId, activityId),
            eq(schema.activityParticipants.participantId, participantId)
          ));
        break;
      }
      case 'team': {
        const { participantId, team } = data;
        await db.update(schema.activityParticipants)
          .set({ equipo: team })
          .where(and(
            eq(schema.activityParticipants.activityId, activityId),
            eq(schema.activityParticipants.participantId, participantId)
          ));
        break;
      }
      case 'goal_add': {
        const result = await db.insert(schema.goles).values({
          activityId,
          participantId: data.pid,
          tipo: data.tipo,
          cant: data.cant || 1,
          team: data.team || null,
          matchId: data.matchId || null,
        }).returning({ id: schema.goles.id });
        return new Response(JSON.stringify({ success: true, id: result[0].id }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      case 'goal_remove': {
        // En este caso, removemos por id de gol si viene, o el ultimo del usuario
        if (data.id) {
          await db.delete(schema.goles).where(eq(schema.goles.id, data.id));
        } else {
          // Fallback: remover uno del tipo para ese pid
          const existing = await db.select().from(schema.goles)
            .where(and(
              eq(schema.goles.activityId, activityId),
              eq(schema.goles.participantId, data.pid),
              eq(schema.goles.tipo, data.tipo)
            ))
            .limit(1);
          if (existing.length > 0) {
            await db.delete(schema.goles).where(eq(schema.goles.id, existing[0].id));
          }
        }
        break;
      }
      case 'goal_update': {
        const { id, pid } = data;
        await db.update(schema.goles)
          .set({ participantId: pid })
          .where(eq(schema.goles.id, id));
        break;
      }
      case 'extra_toggle': {
        const { participantId, tipo, puntos, value } = data;
        if (value) {
          await db.insert(schema.extras).values({
            activityId,
            participantId,
            tipo,
            puntos,
          });
        } else {
          await db.delete(schema.extras)
            .where(and(
              eq(schema.extras.activityId, activityId),
              eq(schema.extras.participantId, participantId),
              eq(schema.extras.tipo, tipo)
            ));
        }
        break;
      }
      case 'game_add': {
        await db.insert(schema.juegos).values({
          activityId,
          nombre: data.nombre || '',
        });
        break;
      }
      case 'game_delete': {
        await db.delete(schema.juegos).where(eq(schema.juegos.id, data.id));
        break;
      }
      case 'game_pos': {
        const { juegoId, pos } = data;
        // Limpiar posiciones anteriores del juego
        await db.delete(schema.juegoPosiciones).where(eq(schema.juegoPosiciones.juegoId, juegoId));
        // Insertar nuevas
        if (pos && Object.keys(pos).length > 0) {
          const jpData = Object.entries(pos).map(([eqName, p]: [string, any]) => ({
            juegoId,
            equipo: eqName,
            posicion: p,
          }));
          await db.insert(schema.juegoPosiciones).values(jpData);
        }
        break;
      }
      case 'partido_add': {
        await db.insert(schema.partidos).values({
          activityId,
          deporte: data.deporte,
          genero: data.genero,
          eq1: data.eq1,
          eq2: data.eq2,
          resultado: data.resultado,
        });
        break;
      }
      case 'partido_update': {
        await db.update(schema.partidos)
          .set({ 
            resultado: data.resultado,
            eq1: data.eq1,
            eq2: data.eq2,
            deporte: data.deporte,
            genero: data.genero
          })
          .where(eq(schema.partidos.id, data.id));
        break;
      }
      case 'partido_delete': {
        await db.delete(schema.partidos).where(eq(schema.partidos.id, data.id));
        break;
      }
      default:
        throw new Error('Invalid update type');
    }

    eventBus.emit('data-changed');

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function DELETE({ request }: { request: Request }) {
  try {
    const body = await request.json();
    const { id } = body;
    await db.delete(schema.activities).where(eq(schema.activities.id, id));
    
    eventBus.emit('data-changed');
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
