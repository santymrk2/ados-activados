import { d as db, a as activities, b as activityParticipants, j as juegos, c as juegoPosiciones, p as partidos, g as goles, e as extras, i as invitaciones } from '../../chunks/db_bwZZVIx4.mjs';
import { eq, inArray } from 'drizzle-orm';
import { e as eventBus } from '../../chunks/eventBus_BuEbhIyL.mjs';
export { renderers } from '../../renderers.mjs';

async function GET() {
  try {
    const allActs = await db.select().from(activities);
    if (allActs.length === 0) return new Response("[]", { status: 200, headers: { "Content-Type": "application/json" } });
    const actIds = allActs.map((a) => a.id);
    const ap = await db.select().from(activityParticipants).where(inArray(activityParticipants.activityId, actIds));
    const jj = await db.select().from(juegos).where(inArray(juegos.activityId, actIds));
    const jjIds = jj.map((j) => j.id);
    const jp = jjIds.length > 0 ? await db.select().from(juegoPosiciones).where(inArray(juegoPosiciones.juegoId, jjIds)) : [];
    const part = await db.select().from(partidos).where(inArray(partidos.activityId, actIds));
    const gol = await db.select().from(goles).where(inArray(goles.activityId, actIds));
    const ext = await db.select().from(extras).where(inArray(extras.activityId, actIds));
    const inv = await db.select().from(invitaciones).where(inArray(invitaciones.activityId, actIds));
    const parsed = allActs.map((a) => {
      const actAp = ap.filter((x) => x.activityId === a.id);
      const equipos = {};
      actAp.forEach((x) => {
        if (x.equipo) equipos[x.participantId] = x.equipo;
      });
      const actJuegos = jj.filter((x) => x.activityId === a.id).map((j) => {
        const pos = {};
        jp.filter((x) => x.juegoId === j.id).forEach((x) => {
          pos[x.equipo] = x.posicion;
        });
        return { id: j.id, nombre: j.nombre, pos };
      });
      return {
        id: a.id,
        fecha: a.fecha,
        titulo: a.titulo || "",
        asistentes: actAp.map((x) => x.participantId),
        puntuales: actAp.filter((x) => x.esPuntual).map((x) => x.participantId),
        biblias: actAp.filter((x) => x.tieneBiblia).map((x) => x.participantId),
        equipos,
        juegos: actJuegos,
        partidos: part.filter((x) => x.activityId === a.id).map((p) => ({
          id: p.id,
          deporte: p.deporte,
          genero: p.genero,
          eq1: p.eq1,
          eq2: p.eq2,
          resultado: p.resultado
        })),
        goles: gol.filter((x) => x.activityId === a.id).map((x) => ({ pid: x.participantId, tipo: x.tipo, cant: x.cant })),
        extras: ext.filter((x) => x.activityId === a.id && x.tipo === "extra").map((x) => ({ pid: x.participantId, puntos: x.puntos })),
        descuentos: ext.filter((x) => x.activityId === a.id && x.tipo === "descuento").map((x) => ({ pid: x.participantId, puntos: x.puntos })),
        invitaciones: inv.filter((x) => x.activityId === a.id).map((x) => ({ invitador: x.invitadorId, invitado_id: x.invitadoId }))
      };
    });
    return new Response(JSON.stringify(parsed), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
async function POST({ request }) {
  try {
    const body = await request.json();
    const { data, isNew } = body;
    let currentActId = data.id;
    if (isNew) {
      const result = await db.insert(activities).values({
        fecha: data.fecha,
        titulo: data.titulo || ""
      }).returning({ id: activities.id });
      currentActId = result[0].id;
    } else {
      await db.update(activities).set({
        fecha: data.fecha,
        titulo: data.titulo || ""
      }).where(eq(activities.id, currentActId));
      await db.delete(activityParticipants).where(eq(activityParticipants.activityId, currentActId));
      await db.delete(juegos).where(eq(juegos.activityId, currentActId));
      await db.delete(partidos).where(eq(partidos.activityId, currentActId));
      await db.delete(goles).where(eq(goles.activityId, currentActId));
      await db.delete(extras).where(eq(extras.activityId, currentActId));
      await db.delete(invitaciones).where(eq(invitaciones.activityId, currentActId));
    }
    if (data.asistentes && data.asistentes.length > 0) {
      const apData = data.asistentes.map((pid) => ({
        activityId: currentActId,
        participantId: pid,
        equipo: data.equipos && data.equipos[pid] ? data.equipos[pid] : null,
        esPuntual: (data.puntuales || []).includes(pid),
        tieneBiblia: (data.biblias || []).includes(pid)
      }));
      await db.insert(activityParticipants).values(apData);
    }
    if (data.juegos && data.juegos.length > 0) {
      for (const j of data.juegos) {
        const jRes = await db.insert(juegos).values({
          activityId: currentActId,
          nombre: j.nombre || ""
        }).returning({ id: juegos.id });
        const jId = jRes[0].id;
        if (j.pos && Object.keys(j.pos).length > 0) {
          const jpData = Object.entries(j.pos).map(([eqName, p]) => ({
            juegoId: jId,
            equipo: eqName,
            posicion: p
          }));
          await db.insert(juegoPosiciones).values(jpData);
        }
      }
    }
    if (data.partidos && data.partidos.length > 0) {
      const partData = data.partidos.map((p) => ({
        activityId: currentActId,
        deporte: p.deporte || "Fútbol",
        genero: p.genero || "M",
        eq1: p.eq1,
        eq2: p.eq2,
        resultado: p.resultado
      }));
      await db.insert(partidos).values(partData);
    }
    if (data.goles && data.goles.length > 0) {
      const gData = data.goles.map((g) => ({
        activityId: currentActId,
        participantId: g.pid,
        tipo: g.tipo,
        cant: g.cant
      }));
      await db.insert(goles).values(gData);
    }
    const extrasData = [];
    if (data.extras && data.extras.length > 0) {
      data.extras.forEach((e) => {
        extrasData.push({ activityId: currentActId, participantId: e.pid, tipo: "extra", puntos: e.puntos });
      });
    }
    if (data.descuentos && data.descuentos.length > 0) {
      data.descuentos.forEach((e) => {
        extrasData.push({ activityId: currentActId, participantId: e.pid, tipo: "descuento", puntos: e.puntos });
      });
    }
    if (extrasData.length > 0) {
      await db.insert(extras).values(extrasData);
    }
    if (data.invitaciones && data.invitaciones.length > 0) {
      const invData = data.invitaciones.map((i) => ({
        activityId: currentActId,
        invitadorId: i.invitador,
        invitadoId: i.invitado_id
      }));
      await db.insert(invitaciones).values(invData);
    }
    eventBus.emit("data-changed");
    return new Response(JSON.stringify({ id: currentActId, success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
async function DELETE({ request }) {
  try {
    const body = await request.json();
    const { id } = body;
    await db.delete(activities).where(eq(activities.id, id));
    eventBus.emit("data-changed");
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  DELETE,
  GET,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
