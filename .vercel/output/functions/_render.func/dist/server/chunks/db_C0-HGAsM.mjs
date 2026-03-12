import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

const participants = sqliteTable("participants", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nombre: text("nombre").notNull(),
  apellido: text("apellido").notNull(),
  fechaNacimiento: text("fecha_nacimiento"),
  sexo: text("sexo").notNull().default("M"),
  foto: text("foto"),
  invitadoPor: integer("invitado_por")
});
const activities = sqliteTable("activities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  fecha: text("fecha").notNull(),
  titulo: text("titulo")
});
const activityParticipants = sqliteTable("activity_participants", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  activityId: integer("activity_id").notNull().references(() => activities.id, { onDelete: "cascade" }),
  participantId: integer("participant_id").notNull().references(() => participants.id, { onDelete: "cascade" }),
  equipo: text("equipo"),
  // e.g. "E1", "E2" or null
  esPuntual: integer("es_puntual", { mode: "boolean" }).default(false),
  tieneBiblia: integer("tiene_biblia", { mode: "boolean" }).default(false)
});
const juegos = sqliteTable("juegos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  activityId: integer("activity_id").notNull().references(() => activities.id, { onDelete: "cascade" }),
  nombre: text("nombre")
});
const juegoPosiciones = sqliteTable("juego_posiciones", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  juegoId: integer("juego_id").notNull().references(() => juegos.id, { onDelete: "cascade" }),
  equipo: text("equipo").notNull(),
  posicion: integer("posicion").notNull()
});
const partidos = sqliteTable("partidos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  activityId: integer("activity_id").notNull().references(() => activities.id, { onDelete: "cascade" }),
  deporte: text("deporte").notNull(),
  genero: text("genero").notNull(),
  eq1: text("eq1").notNull(),
  eq2: text("eq2").notNull(),
  resultado: text("resultado")
  // "eq1", "eq2", "empate" or null
});
const goles = sqliteTable("goles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  activityId: integer("activity_id").notNull().references(() => activities.id, { onDelete: "cascade" }),
  participantId: integer("participant_id").references(() => participants.id, { onDelete: "cascade" }),
  matchId: integer("match_id"),
  // Optional link to a partido
  team: text("team"),
  // e.g. "E1", "E2"
  tipo: text("tipo").notNull(),
  // "f" (futbol), "h" (handball), "b" (basquet)
  cant: integer("cant").notNull().default(1)
});
const extras = sqliteTable("extras", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  activityId: integer("activity_id").notNull().references(() => activities.id, { onDelete: "cascade" }),
  participantId: integer("participant_id").notNull().references(() => participants.id, { onDelete: "cascade" }),
  tipo: text("tipo").notNull(),
  // "extra" or "descuento"
  puntos: integer("puntos").notNull()
});
const invitaciones = sqliteTable("invitaciones", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  activityId: integer("activity_id").notNull().references(() => activities.id, { onDelete: "cascade" }),
  invitadorId: integer("invitador_id").references(() => participants.id, { onDelete: "cascade" }),
  invitadoId: integer("invitado_id").notNull().references(() => participants.id, { onDelete: "cascade" })
});

const schema = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  activities,
  activityParticipants,
  extras,
  goles,
  invitaciones,
  juegoPosiciones,
  juegos,
  participants,
  partidos
}, Symbol.toStringTag, { value: 'Module' }));

const client = createClient({
  // @ts-ignore
  url: "libsql://activados-santymrk2.aws-us-east-1.turso.io",
  // @ts-ignore
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzMyNTQ1MjIsImlkIjoiMDE5Y2RlMzQtOTYwMS03NjhjLWIzNDktZjBiNDhjMDcwOWRhIiwicmlkIjoiNWQ4NTJhN2EtNjYxNS00YTk3LTk1YTEtMzYwN2FiY2RiNmQ1In0.qJAsrApwMBv7sy5s_rTIGnsdX68FyqEJY92UOP1uIthe7gepp7Oa7_f7gpaOidnUc25ZNJ11l333afgcGxNmDA"
});
const db = drizzle(client, { schema });

export { activities as a, activityParticipants as b, juegoPosiciones as c, db as d, extras as e, participants as f, goles as g, invitaciones as i, juegos as j, partidos as p };
