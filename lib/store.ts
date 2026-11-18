'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { daysAgo, toISODate, uid } from './utils'
import { seedWellbeing, type DailyRitual, type ImportedNight, type WheelEntry } from './wellbeing'
import { seedPlanner, SLOT_COUNT, type PlannerTask, type Role, type TimeBlock, type WeeklyGoal } from './planner'

/* ------------------------------------------------------------------ */
/* Tipos                                                               */
/* ------------------------------------------------------------------ */

export type Frequency = 'daily' | 'weekly' | 'monthly'

export interface Habit {
  id: string
  name: string
  description: string
  frequency: Frequency
  category: string
  /** Fechas (YYYY-MM-DD) en que se completó */
  completions: string[]
  createdAt: string
}

export type TransactionType = 'income' | 'expense'

export interface Transaction {
  id: string
  description: string
  amount: number
  category: string
  type: TransactionType
  date: string
}

export type GoalType = 'annual' | 'monthly' | 'weekly'
export type Priority = 'low' | 'medium' | 'high'

export interface Goal {
  id: string
  title: string
  description: string
  type: GoalType
  progress: number
  priority: Priority
  dueDate: string
  /** Meta numérica: objetivo, valor inicial y aportes registrados */
  metric?: GoalMetric
  /** Pasos / hitos para llegar a la meta */
  steps?: GoalStep[]
}

export interface GoalEntry {
  id: string
  date: string
  amount: number
  note: string
}

export interface GoalMetric {
  target: number
  start: number
  unit: string
  entries: GoalEntry[]
}

export interface GoalStep {
  id: string
  text: string
  done: boolean
}

/** Valor actual de una meta numérica */
export function metricCurrent(m: GoalMetric) {
  return m.start + m.entries.reduce((a, e) => a + e.amount, 0)
}

/** El progreso se deriva de los aportes o de los pasos; si no, es manual. */
export function computeProgress(g: Goal) {
  if (g.metric && g.metric.target > 0) return Math.max(0, Math.min(100, Math.round((metricCurrent(g.metric) / g.metric.target) * 100)))
  if (g.steps && g.steps.length) return Math.round((g.steps.filter((x) => x.done).length / g.steps.length) * 100)
  return g.progress
}

const withProgress = (g: Goal): Goal => ({ ...g, progress: computeProgress(g) })

export type NoteCategory = 'note' | 'quote' | 'reminder'

export type Quadrant = 'q1' | 'q2' | 'q3' | 'q4'
export interface EisenhowerTask {
  id: string
  text: string
  done: boolean
}
export type EisenhowerMatrix = Record<Quadrant, EisenhowerTask[]>

export interface Note {
  id: string
  title: string
  content: string
  category: NoteCategory
  isPinned: boolean
  createdAt: string
}

/* ------------------------------------------------------------------ */
/* Datos de ejemplo                                                    */
/* ------------------------------------------------------------------ */

/** Historial más antiguo (desde el día `from` hasta el 150) con una probabilidad de cumplimiento, determinista. */
const history = (seed: number, prob: number, from: number) =>
  Array.from({ length: 151 - from }, (_, i) => i + from)
    .filter((i) => ((i * 9301 + seed * 49297) % 233280) / 233280 < prob)
    .map((i) => daysAgo(i))

const range = (n: number, skip: number[] = []) =>
  Array.from({ length: n }, (_, i) => i)
    .filter((i) => !skip.includes(i))
    .map((i) => daysAgo(i))

function seed() {
  const year = new Date().getFullYear()
  const habits: Habit[] = [
    {
      id: 'h1',
      name: 'Meditación',
      description: '10 minutos de meditación matutina',
      frequency: 'daily',
      category: 'Salud',
      completions: [...range(24), ...history(1, 0.8, 25)],
      createdAt: daysAgo(150),
    },
    {
      id: 'h2',
      name: 'Ejercicio',
      description: '30 minutos de actividad física',
      frequency: 'daily',
      category: 'Salud',
      completions: [...range(13, [0]), ...history(2, 0.6, 14)],
      createdAt: daysAgo(150),
    },
    {
      id: 'h3',
      name: 'Lectura',
      description: '30 minutos de lectura',
      frequency: 'daily',
      category: 'Aprendizaje',
      completions: [...range(8, [3]), ...history(3, 0.55, 9)],
      createdAt: daysAgo(150),
    },
    {
      id: 'h4',
      name: 'Planificar el día',
      description: 'Revisar agenda y prioridades',
      frequency: 'daily',
      category: 'Productividad',
      completions: [...range(6, [0, 2]), ...history(4, 0.45, 7)],
      createdAt: daysAgo(150),
    },
  ]

  const transactions: Transaction[] = [
    { id: 't1', description: 'Salario', amount: 3000, category: 'Salario', type: 'income', date: daysAgo(1) },
    { id: 't2', description: 'Supermercado', amount: 150, category: 'Alimentación', type: 'expense', date: daysAgo(2) },
    { id: 't3', description: 'Gimnasio', amount: 50, category: 'Salud', type: 'expense', date: daysAgo(3) },
    { id: 't4', description: 'Combustible', amount: 80, category: 'Transporte', type: 'expense', date: daysAgo(4) },
    { id: 't5', description: 'Internet y luz', amount: 120, category: 'Servicios', type: 'expense', date: daysAgo(5) },
    { id: 't6', description: 'Cine', amount: 35, category: 'Entretenimiento', type: 'expense', date: daysAgo(6) },
    { id: 't7', description: 'Proyecto freelance', amount: 450, category: 'Freelance', type: 'income', date: daysAgo(7) },
    { id: 't8', description: 'Restaurante', amount: 60, category: 'Alimentación', type: 'expense', date: daysAgo(8) },
  ]

  const goals: Goal[] = [
    {
      id: 'g1',
      title: 'Fondo de ahorro de 3.000.000',
      description: 'Fondo de emergencia y ahorro anual',
      type: 'annual',
      progress: 25,
      metric: {
        target: 3000000,
        start: 500000,
        unit: 'Gs',
        entries: [{ id: 'e1', date: daysAgo(20), amount: 250000, note: 'Aguinaldo' }],
      },
      priority: 'high',
      dueDate: `${year}-12-31`,
    },
    {
      id: 'g2',
      title: 'Completar certificación',
      description: 'Certificación profesional en línea',
      type: 'annual',
      progress: 40,
      steps: [
        { id: 's1', text: 'Inscribirme en el curso', done: true },
        { id: 's2', text: 'Módulo 1: fundamentos', done: true },
        { id: 's3', text: 'Módulo 2: práctica', done: false },
        { id: 's4', text: 'Proyecto final', done: false },
        { id: 's5', text: 'Rendir el examen', done: false },
      ],
      priority: 'high',
      dueDate: `${year}-12-15`,
    },
    {
      id: 'g3',
      title: 'Leer 2 libros',
      description: 'Objetivo de lectura del mes',
      type: 'monthly',
      progress: 50,
      priority: 'medium',
      dueDate: toISODate(new Date(year, new Date().getMonth() + 1, 0)),
    },
    {
      id: 'g4',
      title: 'Ejercicio 4 veces',
      description: 'Objetivo semanal de entrenamiento',
      type: 'weekly',
      progress: 75,
      priority: 'medium',
      dueDate: daysAgo(-3),
    },
  ]

  const notes: Note[] = [
    {
      id: 'n1',
      title: 'Hacer un gran trabajo',
      content: 'La única forma de hacer un gran trabajo es amar lo que haces. — Steve Jobs',
      category: 'quote',
      isPinned: true,
      createdAt: daysAgo(10),
    },
    {
      id: 'n2',
      title: 'Revisar objetivos',
      content: 'Revisar los objetivos mensuales y ajustarlos según sea necesario.',
      category: 'reminder',
      isPinned: false,
      createdAt: daysAgo(4),
    },
    {
      id: 'n3',
      title: 'Ideas para el nuevo proyecto',
      content: 'Crear una aplicación que combine todas las herramientas de productividad.',
      category: 'note',
      isPinned: false,
      createdAt: daysAgo(2),
    },
  ]

  const eisenhower: EisenhowerMatrix = { q1: [], q2: [], q3: [], q4: [] }

  return { habits, transactions, goals, notes, eisenhower, ...seedPlanner(), ...seedWellbeing() }
}

/* ------------------------------------------------------------------ */
/* Store                                                               */
/* ------------------------------------------------------------------ */

type WithoutId<T> = Omit<T, 'id'>

interface AppState {
  habits: Habit[]
  transactions: Transaction[]
  goals: Goal[]
  notes: Note[]
  roles: Role[]
  mission: string
  weeklyGoals: WeeklyGoal[]
  blocks: TimeBlock[]
  rituals: DailyRitual[]
  wheel: WheelEntry[]
  eisenhower: EisenhowerMatrix

  addHabit: (h: Omit<Habit, 'id' | 'completions' | 'createdAt'>) => void
  toggleHabit: (id: string, date?: string) => void
  deleteHabit: (id: string) => void

  addTransaction: (t: WithoutId<Transaction>) => void
  deleteTransaction: (id: string) => void

  addGoal: (g: WithoutId<Goal>) => void
  setGoalProgress: (id: string, progress: number) => void
  addGoalEntry: (goalId: string, entry: Omit<GoalEntry, 'id'>) => void
  deleteGoalEntry: (goalId: string, entryId: string) => void
  toggleGoalStep: (goalId: string, stepId: string) => void
  addGoalStep: (goalId: string, text: string) => void
  deleteGoalStep: (goalId: string, stepId: string) => void
  deleteGoal: (id: string) => void

  setMission: (text: string) => void
  renameRole: (id: string, name: string) => void
  saveWeeklyGoal: (g: Omit<WeeklyGoal, 'id'> & { id?: string }) => void
  deleteWeeklyGoal: (id: string) => void
  toggleWeeklyGoal: (id: string) => void
  togglePlannerTask: (goalId: string, taskId: string) => void
  copyGoalsFromWeek: (fromWeek: string, toWeek: string) => number
  saveBlock: (b: Omit<TimeBlock, 'id'> & { id?: string }) => void
  toggleBlock: (id: string) => void
  deleteBlock: (id: string) => void

  addNote: (n: Omit<Note, 'id' | 'createdAt'>) => void
  toggleNotePin: (id: string) => void
  deleteNote: (id: string) => void

  saveRitual: (r: Omit<DailyRitual, 'id'>) => void
  toggleMit: (date: string) => void
  saveWheel: (entry: WheelEntry) => void
  importSleep: (nights: ImportedNight[]) => { created: number; updated: number }

  addEisenhowerTask: (q: Quadrant, text: string) => void
  toggleEisenhowerTask: (q: Quadrant, id: string) => void
  updateEisenhowerTask: (q: Quadrant, id: string, text: string) => void
  deleteEisenhowerTask: (q: Quadrant, id: string) => void

  resetDemo: () => void
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...seed(),

      addHabit: (h) =>
        set((s) => ({ habits: [...s.habits, { ...h, id: uid(), completions: [], createdAt: toISODate() }] })),
      toggleHabit: (id, date = toISODate()) =>
        set((s) => ({
          habits: s.habits.map((h) =>
            h.id !== id
              ? h
              : {
                  ...h,
                  completions: h.completions.includes(date)
                    ? h.completions.filter((d) => d !== date)
                    : [...h.completions, date],
                },
          ),
        })),
      deleteHabit: (id) => set((s) => ({ habits: s.habits.filter((h) => h.id !== id) })),

      addTransaction: (t) => set((s) => ({ transactions: [{ ...t, id: uid() }, ...s.transactions] })),
      deleteTransaction: (id) => set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) })),

      addGoal: (g) => set((s) => ({ goals: [...s.goals, withProgress({ ...g, id: uid() })] })),
      addGoalEntry: (goalId, entry) =>
        set((s) => ({
          goals: s.goals.map((g) =>
            g.id === goalId && g.metric
              ? withProgress({ ...g, metric: { ...g.metric, entries: [...g.metric.entries, { ...entry, id: uid() }] } })
              : g,
          ),
        })),
      deleteGoalEntry: (goalId, entryId) =>
        set((s) => ({
          goals: s.goals.map((g) =>
            g.id === goalId && g.metric
              ? withProgress({ ...g, metric: { ...g.metric, entries: g.metric.entries.filter((e) => e.id !== entryId) } })
              : g,
          ),
        })),
      toggleGoalStep: (goalId, stepId) =>
        set((s) => ({
          goals: s.goals.map((g) =>
            g.id === goalId && g.steps
              ? withProgress({ ...g, steps: g.steps.map((x) => (x.id === stepId ? { ...x, done: !x.done } : x)) })
              : g,
          ),
        })),
      addGoalStep: (goalId, text) =>
        set((s) => ({
          goals: s.goals.map((g) =>
            g.id === goalId ? withProgress({ ...g, steps: [...(g.steps ?? []), { id: uid(), text, done: false }] }) : g,
          ),
        })),
      deleteGoalStep: (goalId, stepId) =>
        set((s) => ({
          goals: s.goals.map((g) => (g.id === goalId ? withProgress({ ...g, steps: (g.steps ?? []).filter((x) => x.id !== stepId) }) : g)),
        })),
      setGoalProgress: (id, progress) =>
        set((s) => ({
          goals: s.goals.map((g) => (g.id === id ? { ...g, progress: Math.max(0, Math.min(100, progress)) } : g)),
        })),
      deleteGoal: (id) => set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),

      setMission: (mission) => set({ mission }),
      renameRole: (id, name) => set((s) => ({ roles: s.roles.map((r) => (r.id === id ? { ...r, name } : r)) })),
      saveWeeklyGoal: ({ id, ...g }) =>
        set((s) =>
          id
            ? { weeklyGoals: s.weeklyGoals.map((x) => (x.id === id ? { ...g, id } : x)) }
            : { weeklyGoals: [...s.weeklyGoals, { ...g, id: uid() }] },
        ),
      deleteWeeklyGoal: (id) =>
        set((s) => ({
          weeklyGoals: s.weeklyGoals.filter((g) => g.id !== id),
          blocks: s.blocks.map((b) => (b.goalId === id ? { ...b, goalId: undefined } : b)),
        })),
      toggleWeeklyGoal: (id) =>
        set((s) => ({ weeklyGoals: s.weeklyGoals.map((g) => (g.id === id ? { ...g, done: !g.done } : g)) })),
      togglePlannerTask: (goalId, taskId) =>
        set((s) => ({
          weeklyGoals: s.weeklyGoals.map((g) =>
            g.id !== goalId
              ? g
              : { ...g, tasks: g.tasks.map((t: PlannerTask) => (t.id === taskId ? { ...t, done: !t.done } : t)) },
          ),
        })),
      copyGoalsFromWeek: (fromWeek, toWeek) => {
        const s = get()
        const taken = new Set(s.weeklyGoals.filter((g) => g.weekStart === toWeek).map((g) => `${g.roleId}-${g.slot}`))
        const copies = s.weeklyGoals
          .filter((g) => g.weekStart === fromWeek && g.title.trim() && !taken.has(`${g.roleId}-${g.slot}`))
          .map((g) => ({
            ...g,
            id: uid(),
            weekStart: toWeek,
            done: false,
            tasks: g.tasks.map((t) => ({ ...t, id: uid(), done: false })),
          }))
        set({ weeklyGoals: [...s.weeklyGoals, ...copies] })
        return copies.length
      },
      saveBlock: ({ id, ...b }) =>
        set((s) => {
          const clean = { ...b, span: Math.max(1, Math.min(b.span, SLOT_COUNT - b.start)) }
          return id
            ? { blocks: s.blocks.map((x) => (x.id === id ? { ...clean, id } : x)) }
            : { blocks: [...s.blocks, { ...clean, id: uid() }] }
        }),
      toggleBlock: (id) => set((s) => ({ blocks: s.blocks.map((b) => (b.id === id ? { ...b, done: !b.done } : b)) })),
      deleteBlock: (id) => set((s) => ({ blocks: s.blocks.filter((b) => b.id !== id) })),

      addNote: (n) => set((s) => ({ notes: [{ ...n, id: uid(), createdAt: toISODate() }, ...s.notes] })),
      toggleNotePin: (id) =>
        set((s) => ({ notes: s.notes.map((n) => (n.id === id ? { ...n, isPinned: !n.isPinned } : n)) })),
      deleteNote: (id) => set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),

      saveRitual: (r) =>
        set((s) => {
          const existing = s.rituals.find((x) => x.date === r.date)
          return existing
            ? { rituals: s.rituals.map((x) => (x.date === r.date ? { ...r, id: x.id } : x)) }
            : { rituals: [...s.rituals, { ...r, id: uid() }].sort((a, b) => a.date.localeCompare(b.date)) }
        }),
      toggleMit: (date) =>
        set((s) => ({ rituals: s.rituals.map((r) => (r.date === date ? { ...r, mitDone: !r.mitDone } : r)) })),
      importSleep: (nights) => {
        let created = 0
        let updated = 0
        const map = new Map(get().rituals.map((r) => [r.date, r]))
        for (const n of nights) {
          const prev = map.get(n.date)
          const sleep = { sleepHours: n.hours, sleepQuality: n.quality, wakeUps: n.wakeUps ?? prev?.wakeUps ?? 0, deepMinutes: n.deepMinutes, source: 'watch' as const }
          if (prev) {
            map.set(n.date, { ...prev, ...sleep })
            updated++
          } else {
            map.set(n.date, {
              id: uid(),
              date: n.date,
              ...sleep,
              energyMorning: null,
              energyEvening: null,
              focus: '',
              mit: '',
              mitDone: false,
              gratitude: [],
              word: '',
            })
            created++
          }
        }
        set({ rituals: Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date)) })
        return { created, updated }
      },
      saveWheel: (entry) =>
        set((s) => ({
          wheel: [...s.wheel.filter((w) => w.month !== entry.month), entry].sort((a, b) => a.month.localeCompare(b.month)),
        })),

      addEisenhowerTask: (q, text) =>
        set((s) => ({ eisenhower: { ...s.eisenhower, [q]: [...s.eisenhower[q], { id: uid(), text, done: false }] } })),
      toggleEisenhowerTask: (q, id) =>
        set((s) => ({
          eisenhower: { ...s.eisenhower, [q]: s.eisenhower[q].map((t) => (t.id === id ? { ...t, done: !t.done } : t)) },
        })),
      updateEisenhowerTask: (q, id, text) =>
        set((s) => ({
          eisenhower: { ...s.eisenhower, [q]: s.eisenhower[q].map((t) => (t.id === id ? { ...t, text } : t)) },
        })),
      deleteEisenhowerTask: (q, id) =>
        set((s) => ({ eisenhower: { ...s.eisenhower, [q]: s.eisenhower[q].filter((t) => t.id !== id) } })),

      resetDemo: () => set(seed()),
    }),
    {
      name: 'productividad-pro',
      version: 3,
      storage: createJSONStorage(() => localStorage),
      // v1 → v2: el cronograma de eventos se reemplaza por el planificador semanal
      migrate: (persisted, version) => {
        const state = { ...(persisted as Record<string, unknown>) }
        if (version < 2) {
          delete state.schedule
          Object.assign(state, seedPlanner())
        }
        // v2 → v3: cada cuadrante pasa de texto libre a lista de tareas (una por línea)
        if (version < 3 && state.eisenhower) {
          const old = state.eisenhower as Record<string, unknown>
          state.eisenhower = Object.fromEntries(
            Object.entries(old).map(([q, v]) => [
              q,
              typeof v === 'string'
                ? v.split('\n').map((l) => l.trim()).filter(Boolean).map((text) => ({ id: uid(), text, done: false }))
                : v,
            ]),
          )
        }
        return state as unknown as AppState
      },
      skipHydration: true,
    },
  ),
)

/* ------------------------------------------------------------------ */
/* Selectores / helpers derivados                                      */
/* ------------------------------------------------------------------ */

/** Días consecutivos completados terminando hoy (o ayer si hoy aún no). */
export function habitStreak(h: Habit) {
  const set = new Set(h.completions)
  let streak = 0
  let offset = set.has(daysAgo(0)) ? 0 : 1
  while (set.has(daysAgo(offset))) {
    streak++
    offset++
  }
  return streak
}

export function goalStatus(g: Goal): 'not_started' | 'in_progress' | 'completed' {
  if (g.progress >= 100) return 'completed'
  if (g.progress <= 0) return 'not_started'
  return 'in_progress'
}

export const GOAL_TYPE_LABEL: Record<GoalType, string> = {
  annual: 'Anual',
  monthly: 'Mensual',
  weekly: 'Semanal',
}

export const PRIORITY_LABEL: Record<Priority, string> = {
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
}

export const FREQUENCY_LABEL: Record<Frequency, string> = {
  daily: 'Diario',
  weekly: 'Semanal',
  monthly: 'Mensual',
}

export const NOTE_CATEGORY_LABEL: Record<NoteCategory, string> = {
  note: 'Nota',
  quote: 'Frase',
  reminder: 'Recordatorio',
}

export const HABIT_CATEGORIES = ['Salud', 'Productividad', 'Finanzas', 'Aprendizaje', 'Relaciones']
export const EXPENSE_CATEGORIES = ['Alimentación', 'Transporte', 'Salud', 'Entretenimiento', 'Servicios', 'Otros']
export const INCOME_CATEGORIES = ['Salario', 'Freelance', 'Inversiones', 'Otros']

/** Color fijo por categoría de gasto (orden categórico, nunca ciclado). */
export const EXPENSE_COLOR: Record<string, string> = {
  Alimentación: 'bg-series-1',
  Transporte: 'bg-series-2',
  Salud: 'bg-series-3',
  Entretenimiento: 'bg-series-4',
  Servicios: 'bg-series-5',
  Otros: 'bg-subtle',
}

export function summarizeExpenses(transactions: Transaction[]) {
  const totals = new Map<string, number>()
  for (const t of transactions) {
    if (t.type !== 'expense') continue
    const key = EXPENSE_CATEGORIES.includes(t.category) ? t.category : 'Otros'
    totals.set(key, (totals.get(key) ?? 0) + t.amount)
  }
  const total = Array.from(totals.values()).reduce((a, b) => a + b, 0)
  // Orden fijo de categorías → los colores siguen a la entidad, no al ranking
  const rows = EXPENSE_CATEGORIES.filter((c) => totals.has(c)).map((category) => ({
    category,
    amount: totals.get(category)!,
    share: total ? totals.get(category)! / total : 0,
    color: EXPENSE_COLOR[category],
  }))
  return { rows, total }
}
