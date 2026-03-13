import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';

export const participants = sqliteTable('participants', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nombre: text('nombre').notNull(),
  apellido: text('apellido').notNull(),
  fechaNacimiento: text('fecha_nacimiento'),
  sexo: text('sexo').notNull().default('M'),
  foto: text('foto'),
  invitadoPor: integer('invitado_por'),
});

export const activities = sqliteTable('activities', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  fecha: text('fecha').notNull(),
  titulo: text('titulo'),
  cantEquipos: integer('cant_equipos').notNull().default(4),
});

export const activityParticipants = sqliteTable('activity_participants', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  activityId: integer('activity_id').notNull().references(() => activities.id, { onDelete: 'cascade' }),
  participantId: integer('participant_id').notNull().references(() => participants.id, { onDelete: 'cascade' }),
  equipo: text('equipo'), // e.g. "E1", "E2" or null
  esPuntual: integer('es_puntual', { mode: 'boolean' }).default(false),
  tieneBiblia: integer('tiene_biblia', { mode: 'boolean' }).default(false),
});

export const juegos = sqliteTable('juegos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  activityId: integer('activity_id').notNull().references(() => activities.id, { onDelete: 'cascade' }),
  nombre: text('nombre'),
});

export const juegoPosiciones = sqliteTable('juego_posiciones', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  juegoId: integer('juego_id').notNull().references(() => juegos.id, { onDelete: 'cascade' }),
  equipo: text('equipo').notNull(),
  posicion: integer('posicion').notNull(),
});

export const partidos = sqliteTable('partidos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  activityId: integer('activity_id').notNull().references(() => activities.id, { onDelete: 'cascade' }),
  deporte: text('deporte').notNull(),
  genero: text('genero').notNull(),
  eq1: text('eq1').notNull(),
  eq2: text('eq2').notNull(),
  resultado: text('resultado'), // "eq1", "eq2", "empate" or null
});

export const goles = sqliteTable('goles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  activityId: integer('activity_id').notNull().references(() => activities.id, { onDelete: 'cascade' }),
  participantId: integer('participant_id').references(() => participants.id, { onDelete: 'cascade' }),
  matchId: integer('match_id'), // Optional link to a partido
  team: text('team'), // e.g. "E1", "E2"
  tipo: text('tipo').notNull(), // "f" (futbol), "h" (handball), "b" (basquet)
  cant: integer('cant').notNull().default(1),
});

export const extras = sqliteTable('extras', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  activityId: integer('activity_id').notNull().references(() => activities.id, { onDelete: 'cascade' }),
  participantId: integer('participant_id').references(() => participants.id, { onDelete: 'cascade' }),
  team: text('team'),
  tipo: text('tipo').notNull(), // "extra" or "descuento"
  puntos: integer('puntos').notNull(),
  motivo: text('motivo'),
});

export const invitaciones = sqliteTable('invitaciones', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  activityId: integer('activity_id').notNull().references(() => activities.id, { onDelete: 'cascade' }),
  invitadorId: integer('invitador_id').references(() => participants.id, { onDelete: 'cascade' }),
  invitadoId: integer('invitado_id').notNull().references(() => participants.id, { onDelete: 'cascade' }),
});
