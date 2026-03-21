import { db } from '../../lib/db';
import { participants, activityParticipants, goles, extras, invitaciones } from '../../lib/schema';
import { eq, or } from 'drizzle-orm';
import { eventBus } from '../../lib/eventBus';

export async function GET() {
  const result = await db.select().from(participants);
  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function POST({ request }: { request: Request }) {
  try {
    const body = await request.json();
    const { data, isNew, invitadorId } = body;
    
    if (isNew) {
      delete data.id;
      const participantData = {
        ...data,
        invitadoPor: invitadorId || null,
      };
      const result = await db.insert(participants).values(participantData).returning({ id: participants.id });
      eventBus.emit('data-changed');
      return new Response(JSON.stringify({ id: result[0].id }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      await db.update(participants).set(data).where(eq(participants.id, data.id));
      eventBus.emit('data-changed');
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function DELETE({ request }: { request: Request }) {
  try {
    const body = await request.json();
    const { id } = body;

    // Manual cascade deletes
    await db.delete(activityParticipants).where(eq(activityParticipants.participantId, id));
    await db.delete(goles).where(eq(goles.participantId, id));
    await db.delete(extras).where(eq(extras.participantId, id));
    await db.delete(invitaciones).where(
      or(
        eq(invitaciones.invitadorId, id),
        eq(invitaciones.invitadoId, id)
      )
    );

    await db.delete(participants).where(eq(participants.id, id));
    eventBus.emit('data-changed');
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
