import { d as db, f as participants } from '../../chunks/db_C0-HGAsM.mjs';
import { eq } from 'drizzle-orm';
import { e as eventBus } from '../../chunks/eventBus_BuEbhIyL.mjs';
export { renderers } from '../../renderers.mjs';

const SEED_PARTICIPANTS = [
  { id: 1, nombre: "Ana Luz", apellido: "Aquino", fechaNacimiento: "2007-01-15", sexo: "F", foto: "" },
  { id: 2, nombre: "Gian Franco", apellido: "Carbone", fechaNacimiento: "2010-05-20", sexo: "M", foto: "" },
  { id: 3, nombre: "Tomás", apellido: "Barrera", fechaNacimiento: "2011-08-10", sexo: "M", foto: "" },
  { id: 4, nombre: "Rodrigo", apellido: "Rolón", fechaNacimiento: "2013-02-28", sexo: "M", foto: "" },
  { id: 5, nombre: "Jonás", apellido: "Corvalán", fechaNacimiento: "2013-04-15", sexo: "M", foto: "" },
  { id: 6, nombre: "Felipe", apellido: "Morinico", fechaNacimiento: "2012-11-22", sexo: "M", foto: "" },
  { id: 7, nombre: "Alma", apellido: "Ochnicki", fechaNacimiento: "2013-07-08", sexo: "F", foto: "" },
  { id: 8, nombre: "Candela", apellido: "Ayala", fechaNacimiento: "2012-09-30", sexo: "F", foto: "" },
  { id: 9, nombre: "Catalina", apellido: "Sánchez", fechaNacimiento: "2014-12-05", sexo: "F", foto: "" },
  { id: 10, nombre: "Catalina", apellido: "Flores", fechaNacimiento: "2012-03-18", sexo: "F", foto: "" },
  { id: 11, nombre: "Victoria", apellido: "Gumpp", fechaNacimiento: "2013-06-12", sexo: "F", foto: "" },
  { id: 12, nombre: "Ludmila", apellido: "Sánchez", fechaNacimiento: "2013-10-25", sexo: "F", foto: "" },
  { id: 13, nombre: "Sara", apellido: "Vargas", fechaNacimiento: "2014-01-08", sexo: "F", foto: "" },
  { id: 14, nombre: "Agostina", apellido: "López", fechaNacimiento: "2011-04-20", sexo: "F", foto: "" },
  { id: 15, nombre: "Priscila", apellido: "Espíndola", fechaNacimiento: "2013-08-14", sexo: "F", foto: "" },
  { id: 16, nombre: "Manuel", apellido: "Vargas", fechaNacimiento: "2014-07-02", sexo: "M", foto: "" },
  { id: 17, nombre: "Tobías", apellido: "Ludueña", fechaNacimiento: "2009-11-30", sexo: "M", foto: "" },
  { id: 18, nombre: "Oriana", apellido: "Cabrera", fechaNacimiento: "2008-02-18", sexo: "F", foto: "" },
  { id: 19, nombre: "Thiago", apellido: "Lencina", fechaNacimiento: "2010-09-05", sexo: "M", foto: "" },
  { id: 20, nombre: "Octavio", apellido: "Cabrera", fechaNacimiento: "2012-06-28", sexo: "M", foto: "" },
  { id: 21, nombre: "Mauro", apellido: "Suárez", fechaNacimiento: "2009-03-12", sexo: "M", foto: "" },
  { id: 22, nombre: "Marco", apellido: "Pella Sycz", fechaNacimiento: "2009-08-22", sexo: "M", foto: "" },
  { id: 23, nombre: "Candelaria", apellido: "Mendoza", fechaNacimiento: "2013-01-10", sexo: "F", foto: "" },
  { id: 24, nombre: "Thiago", apellido: "Villena", fechaNacimiento: "2013-05-17", sexo: "M", foto: "" },
  { id: 25, nombre: "Valentino", apellido: "Gómez", fechaNacimiento: "2012-10-08", sexo: "M", foto: "" },
  { id: 26, nombre: "Mateo", apellido: "Rolón", fechaNacimiento: "2014-04-03", sexo: "M", foto: "" },
  { id: 27, nombre: "Emma", apellido: "Ochandorena", fechaNacimiento: "2013-09-25", sexo: "F", foto: "" },
  { id: 28, nombre: "Abril", apellido: "Rodríguez", fechaNacimiento: "2012-07-14", sexo: "F", foto: "" },
  { id: 29, nombre: "Renzo", apellido: "Rodríguez", fechaNacimiento: "2011-12-20", sexo: "M", foto: "" },
  { id: 30, nombre: "Lautaro", apellido: "Gómez", fechaNacimiento: "2010-03-05", sexo: "M", foto: "" }
];

async function GET() {
  const result = await db.select().from(participants);
  if (result.length === 0) {
    try {
      await db.insert(participants).values(SEED_PARTICIPANTS);
      const newResult = await db.select().from(participants);
      return new Response(JSON.stringify(newResult), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } catch (e) {
    }
  }
  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
async function POST({ request }) {
  try {
    const body = await request.json();
    const { data, isNew, invitadorId } = body;
    if (isNew) {
      delete data.id;
      const participantData = {
        ...data,
        invitadoPor: invitadorId || null
      };
      const result = await db.insert(participants).values(participantData).returning({ id: participants.id });
      eventBus.emit("data-changed");
      return new Response(JSON.stringify({ id: result[0].id }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } else {
      await db.update(participants).set(data).where(eq(participants.id, data.id));
      eventBus.emit("data-changed");
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
async function DELETE({ request }) {
  try {
    const body = await request.json();
    const { id } = body;
    await db.delete(participants).where(eq(participants.id, id));
    eventBus.emit("data-changed");
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
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
