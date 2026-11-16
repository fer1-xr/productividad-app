/**
 * Planificación semanal basada en "Los 7 hábitos de la gente altamente efectiva".
 *
 * Proceso (Hábito 3 — Primero lo primero):
 *  1. Conectar con la misión personal (Hábito 2).
 *  2. Identificar los roles.
 *  3. Elegir 1–2 metas por rol para la semana (las "piedras grandes", Cuadrante II).
 *  4. Programar primero esas metas en el horario.
 *  5. Afilar la sierra (Hábito 7) en el rol de desarrollo personal.
 *  6. Evaluar al final de la semana.
 */
import { addDaysISO, mondayOf, toISODate, uid, weekdayIndex } from './utils'

/* ------------------------------------------------------------------ */
/* Tipos                                                               */
/* ------------------------------------------------------------------ */

export type RoleColor = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

export interface Role {
  id: string
  name: string
  color: RoleColor
}

export interface PlannerTask {
  id: string
  text: string
  done: boolean
}

export interface WeeklyGoal {
  id: string
  /** Lunes de la semana (YYYY-MM-DD) */
  weekStart: string
  roleId: string
  /** Cada rol tiene 2 metas por semana (0 y 1) */
  slot: 0 | 1
  title: string
  tasks: PlannerTask[]
  /** Sólo se usa cuando la meta no tiene tareas */
  done: boolean
}

export interface TimeBlock {
  id: string
  weekStart: string
  /** 0 = Lunes … 6 = Domingo */
  day: number
  /** Índice de franja de 30 min desde las 07:00 (0 … 31) */
  start: number
  /** Cantidad de franjas de 30 min */
  span: number
  roleId: string
  goalId?: string
  title: string
  done: boolean
}

/* ------------------------------------------------------------------ */
/* Horario                                                             */
/* ------------------------------------------------------------------ */

export const DAY_START_HOUR = 7
export const SLOT_COUNT = 32 // 07:00 → 22:30

export function slotTime(slot: number) {
  const mins = DAY_START_HOUR * 60 + slot * 30
  return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`
}

export function blockRange(b: Pick<TimeBlock, 'start' | 'span'>) {
  return `${slotTime(b.start)} – ${slotTime(b.start + b.span)}`
}

export function formatSpan(span: number) {
  const h = Math.floor(span / 2)
  const m = (span % 2) * 30
  return h ? `${h} h${m ? ` ${m} min` : ''}` : `${m} min`
}

/** Franja actual (o null fuera del horario 07:00–23:00). */
export function currentSlot(now = new Date()) {
  const mins = now.getHours() * 60 + now.getMinutes() - DAY_START_HOUR * 60
  if (mins < 0) return null
  const slot = Math.floor(mins / 30)
  return slot < SLOT_COUNT ? slot : null
}

/* ------------------------------------------------------------------ */
/* Colores por rol (orden categórico fijo — el color sigue al rol)     */
/* ------------------------------------------------------------------ */

export const ROLE_COLOR_CLASS: Record<RoleColor, { dot: string; bar: string; soft: string; strong: string }> = {
  1: { dot: 'bg-series-1', bar: 'border-l-series-1', soft: 'bg-series-1/15', strong: 'bg-series-1' },
  2: { dot: 'bg-series-2', bar: 'border-l-series-2', soft: 'bg-series-2/15', strong: 'bg-series-2' },
  3: { dot: 'bg-series-3', bar: 'border-l-series-3', soft: 'bg-series-3/15', strong: 'bg-series-3' },
  4: { dot: 'bg-series-4', bar: 'border-l-series-4', soft: 'bg-series-4/15', strong: 'bg-series-4' },
  5: { dot: 'bg-series-5', bar: 'border-l-series-5', soft: 'bg-series-5/15', strong: 'bg-series-5' },
  6: { dot: 'bg-series-6', bar: 'border-l-series-6', soft: 'bg-series-6/15', strong: 'bg-series-6' },
  7: { dot: 'bg-series-7', bar: 'border-l-series-7', soft: 'bg-series-7/15', strong: 'bg-series-7' },
  8: { dot: 'bg-series-8', bar: 'border-l-series-8', soft: 'bg-series-8/15', strong: 'bg-series-8' },
}

/* ------------------------------------------------------------------ */
/* Rendimiento                                                         */
/* ------------------------------------------------------------------ */

export interface Performance {
  /** Porcentaje 0–100, o null si no hay nada planificado */
  pct: number | null
  done: number
  total: number
  tasksDone: number
  tasksTotal: number
  blocksDone: number
  blocksTotal: number
  goalsDone: number
  goalsTotal: number
  /** % que debería estar hecho a la fecha (100 en semanas pasadas, 0 en futuras) */
  expected: number | null
  /** La semana todavía no terminó */
  inProgress: boolean
}

/** Fracción transcurrida de la semana (en horas de 07:00 a 23:00). */
export function weekElapsed(weekStart: string, now = new Date()) {
  const current = mondayOf(now)
  if (weekStart < current) return 1
  if (weekStart > current) return 0
  const mins = now.getHours() * 60 + now.getMinutes() - DAY_START_HOUR * 60
  const slots = Math.max(0, Math.min(SLOT_COUNT, mins / 30))
  return (weekdayIndex(now) * SLOT_COUNT + slots) / (7 * SLOT_COUNT)
}

export function isGoalDone(g: WeeklyGoal) {
  return g.tasks.length ? g.tasks.every((t) => t.done) : g.done
}

function activeGoals(goals: WeeklyGoal[], weekStart: string, roleId?: string) {
  return goals.filter((g) => g.weekStart === weekStart && (!roleId || g.roleId === roleId) && g.title.trim())
}

/**
 * Rendimiento = (tareas completadas + bloques cumplidos) / (tareas + bloques programados).
 * Una meta sin tareas cuenta como una tarea.
 */
export function performance(
  goals: WeeklyGoal[],
  blocks: TimeBlock[],
  weekStart: string,
  roleId?: string,
): Performance {
  const g = activeGoals(goals, weekStart, roleId)
  let tasksDone = 0
  let tasksTotal = 0
  for (const goal of g) {
    if (goal.tasks.length) {
      tasksTotal += goal.tasks.length
      tasksDone += goal.tasks.filter((t) => t.done).length
    } else {
      tasksTotal += 1
      tasksDone += goal.done ? 1 : 0
    }
  }
  const b = blocks.filter((x) => x.weekStart === weekStart && (!roleId || x.roleId === roleId))
  const blocksDone = b.filter((x) => x.done).length
  const done = tasksDone + blocksDone
  const total = tasksTotal + b.length

  // Ritmo esperado: bloques cuyo horario ya pasó + parte proporcional de las tareas
  const elapsed = weekElapsed(weekStart)
  const nowSlot = elapsed * 7 * SLOT_COUNT
  const blocksDue = b.filter((x) => x.day * SLOT_COUNT + x.start + x.span <= nowSlot).length
  const expected = total ? Math.round(((blocksDue + tasksTotal * elapsed) / total) * 100) : null

  return {
    pct: total ? Math.round((done / total) * 100) : null,
    expected,
    inProgress: elapsed > 0 && elapsed < 1,
    done,
    total,
    tasksDone,
    tasksTotal,
    blocksDone,
    blocksTotal: b.length,
    goalsDone: g.filter(isGoalDone).length,
    goalsTotal: g.length,
  }
}

export type PerfLevel = 'excellent' | 'on_track' | 'attention' | 'in_progress' | 'planned' | 'none'

/**
 * Nivel comparando lo cumplido con lo esperado a la fecha.
 * En semanas pasadas lo esperado es 100%, así que equivale a 80% / 50%.
 */
export function perfLevel(p: Pick<Performance, 'pct' | 'expected'>): PerfLevel {
  if (p.pct === null || p.expected === null) return 'none'
  if (p.expected === 0) return p.pct > 0 ? 'excellent' : 'planned'
  const ratio = p.pct / p.expected
  if (ratio >= 0.8) return 'excellent'
  if (p.expected < 20) return 'in_progress' // aún es pronto para juzgar
  if (ratio >= 0.5) return 'on_track'
  return 'attention'
}

export const PERF_LEVEL_LABEL: Record<PerfLevel, string> = {
  excellent: 'Excelente',
  on_track: 'En camino',
  attention: 'Requiere atención',
  in_progress: 'En curso',
  planned: 'Planificada',
  none: 'Sin planificar',
}

/* ------------------------------------------------------------------ */
/* Semana                                                              */
/* ------------------------------------------------------------------ */

export function weekLabel(weekStart: string) {
  const end = addDaysISO(weekStart, 6)
  const [, sm, sd] = weekStart.split('-').map(Number)
  const [ey, em, ed] = end.split('-').map(Number)
  const month = (m: number, y: number) => new Date(y, m - 1, 1).toLocaleDateString('es', { month: 'long' })
  return sm === em
    ? `Semana del ${sd} al ${ed} de ${month(em, ey)}`
    : `Semana del ${sd} de ${month(sm, ey)} al ${ed} de ${month(em, ey)}`
}

/* ------------------------------------------------------------------ */
/* Datos de ejemplo                                                    */
/* ------------------------------------------------------------------ */

export const DEFAULT_ROLES: Role[] = [
  { id: 'r1', name: 'Individuo – Desarrollo personal', color: 1 },
  { id: 'r2', name: 'Pareja / Esposo', color: 2 },
  { id: 'r3', name: 'Familia', color: 3 },
  { id: 'r4', name: 'Profesional', color: 4 },
  { id: 'r5', name: 'Finanzas', color: 5 },
  { id: 'r6', name: 'Aprendizaje', color: 6 },
  { id: 'r7', name: 'Vida social', color: 7 },
  { id: 'r8', name: 'Comunidad / Espiritual', color: 8 },
]

export const DEFAULT_MISSION =
  'Vivir con integridad, cuidar mi salud y a mi familia, aportar valor con mi trabajo y seguir aprendiendo cada día.'

type GoalTpl = { role: string; slot: 0 | 1; title: string; tasks: string[] }
type BlockTpl = { day: number; time: string; span: number; role: string; goal?: string; title: string }

const GOAL_TEMPLATE: GoalTpl[] = [
  { role: 'r1', slot: 0, title: 'Afilar la sierra: ejercicio 4 veces', tasks: ['Correr lunes', 'Gimnasio miércoles', 'Gimnasio viernes', 'Caminata sábado'] },
  { role: 'r1', slot: 1, title: 'Leer 50 páginas', tasks: ['Capítulos 1–3', 'Capítulos 4–6'] },
  { role: 'r2', slot: 0, title: 'Cita en pareja', tasks: ['Reservar restaurante', 'Salir el viernes'] },
  { role: 'r2', slot: 1, title: 'Conversación sin distracciones', tasks: [] },
  { role: 'r3', slot: 0, title: 'Almuerzo familiar del domingo', tasks: ['Hacer las compras', 'Preparar el almuerzo'] },
  { role: 'r3', slot: 1, title: 'Llamar a mis padres', tasks: [] },
  { role: 'r4', slot: 0, title: 'Terminar la propuesta del proyecto', tasks: ['Borrador', 'Revisión con el equipo', 'Enviar al cliente'] },
  { role: 'r4', slot: 1, title: 'Planificar el trimestre', tasks: ['Definir objetivos', 'Repartir responsabilidades'] },
  { role: 'r5', slot: 0, title: 'Revisar presupuesto semanal', tasks: ['Registrar gastos', 'Comparar con el presupuesto'] },
  { role: 'r6', slot: 0, title: 'Curso de inglés: 2 clases', tasks: ['Clase del martes', 'Clase del jueves'] },
  { role: 'r7', slot: 0, title: 'Encuentro con amigos', tasks: [] },
  { role: 'r8', slot: 0, title: 'Voluntariado del sábado', tasks: [] },
]

const BLOCK_TEMPLATE: BlockTpl[] = [
  { day: 0, time: '07:00', span: 2, role: 'r1', goal: 'r1-0', title: 'Correr' },
  { day: 2, time: '07:00', span: 2, role: 'r1', goal: 'r1-0', title: 'Gimnasio' },
  { day: 4, time: '07:00', span: 2, role: 'r1', goal: 'r1-0', title: 'Gimnasio' },
  { day: 5, time: '08:00', span: 2, role: 'r1', goal: 'r1-0', title: 'Caminata' },
  { day: 1, time: '07:00', span: 1, role: 'r1', goal: 'r1-1', title: 'Lectura' },
  { day: 3, time: '07:00', span: 1, role: 'r1', goal: 'r1-1', title: 'Lectura' },
  ...[0, 1, 2, 3, 4].map((day) => ({ day, time: '09:00', span: 8, role: 'r4', title: 'Trabajo' })),
  { day: 0, time: '13:00', span: 3, role: 'r4', goal: 'r4-0', title: 'Propuesta: borrador' },
  { day: 2, time: '13:00', span: 2, role: 'r4', goal: 'r4-0', title: 'Revisión con el equipo' },
  { day: 3, time: '14:00', span: 3, role: 'r4', goal: 'r4-1', title: 'Plan trimestral' },
  { day: 1, time: '18:30', span: 2, role: 'r6', goal: 'r6-0', title: 'Clase de inglés' },
  { day: 3, time: '18:30', span: 2, role: 'r6', goal: 'r6-0', title: 'Clase de inglés' },
  { day: 2, time: '21:00', span: 1, role: 'r3', goal: 'r3-1', title: 'Llamar a mis padres' },
  { day: 4, time: '20:00', span: 4, role: 'r2', goal: 'r2-0', title: 'Cita en pareja' },
  { day: 1, time: '21:00', span: 1, role: 'r2', goal: 'r2-1', title: 'Conversación' },
  { day: 5, time: '10:30', span: 5, role: 'r8', goal: 'r8-0', title: 'Voluntariado' },
  { day: 5, time: '19:00', span: 4, role: 'r7', goal: 'r7-0', title: 'Encuentro con amigos' },
  { day: 6, time: '12:00', span: 4, role: 'r3', goal: 'r3-0', title: 'Almuerzo familiar' },
  { day: 6, time: '18:00', span: 1, role: 'r5', goal: 'r5-0', title: 'Revisar presupuesto' },
  { day: 6, time: '19:00', span: 2, role: 'r1', title: 'Planificación semanal' },
]

function slotOf(time: string) {
  const [h, m] = time.split(':').map(Number)
  return (h * 60 + m - DAY_START_HOUR * 60) / 30
}

/** PRNG determinista para que la demo sea estable. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Probabilidad de cumplimiento por rol en semanas pasadas (para el historial). */
const ROLE_RELIABILITY: Record<string, number> = {
  r1: 0.85, r2: 0.7, r3: 0.9, r4: 0.8, r5: 0.45, r6: 0.6, r7: 0.55, r8: 0.35,
}

function buildWeek(weekStart: string, mode: 'past' | 'current', rand: () => number) {
  const today = new Date()
  const todayIdx = (today.getDay() + 6) % 7
  const nowSlot = currentSlot(today) ?? (today.getHours() < DAY_START_HOUR ? -1 : SLOT_COUNT)

  const isPast = (day: number, endSlot: number) =>
    mode === 'past' || day < todayIdx || (day === todayIdx && endSlot <= nowSlot)

  const goalIds: Record<string, string> = {}
  const goals: WeeklyGoal[] = GOAL_TEMPLATE.map((t) => {
    const id = uid()
    goalIds[`${t.role}-${t.slot}`] = id
    return {
      id,
      weekStart,
      roleId: t.role,
      slot: t.slot,
      title: t.title,
      tasks: t.tasks.map((text) => ({ id: uid(), text, done: false })),
      done: false,
    }
  })

  const blocks: TimeBlock[] = BLOCK_TEMPLATE.map((t) => {
    const start = slotOf(t.time)
    const reliability = ROLE_RELIABILITY[t.role]
    const done = isPast(t.day, start + t.span) && rand() < (mode === 'past' ? reliability : Math.min(1, reliability + 0.15))
    return {
      id: uid(),
      weekStart,
      day: t.day,
      start,
      span: t.span,
      roleId: t.role,
      goalId: t.goal ? goalIds[t.goal] : undefined,
      title: t.title,
      done,
    }
  })

  // Marcar tareas: en semanas pasadas según la fiabilidad del rol; en la actual, según el avance de la semana
  const weekProgress = mode === 'past' ? 1 : (todayIdx + 0.5) / 7
  for (const g of goals) {
    const p = ROLE_RELIABILITY[g.roleId] * (mode === 'past' ? 1 : 1.1)
    if (g.tasks.length) {
      g.tasks.forEach((task, i) => {
        const due = (i + 1) / g.tasks.length <= weekProgress + 0.15
        task.done = due && rand() < p
      })
    } else {
      g.done = weekProgress > 0.6 && rand() < p
    }
  }

  return { goals, blocks }
}

export function seedPlanner() {
  const rand = mulberry32(42)
  const current = mondayOf()
  const goals: WeeklyGoal[] = []
  const blocks: TimeBlock[] = []
  for (let w = 5; w >= 1; w--) {
    const week = buildWeek(addDaysISO(current, -7 * w), 'past', rand)
    goals.push(...week.goals)
    blocks.push(...week.blocks)
  }
  const week = buildWeek(current, 'current', rand)
  goals.push(...week.goals)
  blocks.push(...week.blocks)
  return { roles: DEFAULT_ROLES, mission: DEFAULT_MISSION, weeklyGoals: goals, blocks }
}

export function todayISO() {
  return toISODate()
}
