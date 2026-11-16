'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { daysAgo, toISODate, uid } from './utils'

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
}

export type EventColor = 1 | 2 | 3 | 4 | 5 | 7

export interface ScheduleItem {
  id: string
  title: string
  startTime: string
  endTime: string
  /** 0 = Lunes … 6 = Domingo */
  day: number
  color: EventColor
}

export type NoteCategory = 'note' | 'quote' | 'reminder'

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
      completions: range(24),
      createdAt: daysAgo(30),
    },
    {
      id: 'h2',
      name: 'Ejercicio',
      description: '30 minutos de actividad física',
      frequency: 'daily',
      category: 'Salud',
      completions: range(13, [0]),
      createdAt: daysAgo(30),
    },
    {
      id: 'h3',
      name: 'Lectura',
      description: '30 minutos de lectura',
      frequency: 'daily',
      category: 'Aprendizaje',
      completions: range(8, [3]),
      createdAt: daysAgo(30),
    },
    {
      id: 'h4',
      name: 'Planificar el día',
      description: 'Revisar agenda y prioridades',
      frequency: 'daily',
      category: 'Productividad',
      completions: range(6, [0, 2]),
      createdAt: daysAgo(30),
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
      title: 'Ahorrar $10.000',
      description: 'Fondo de emergencia y ahorro anual',
      type: 'annual',
      progress: 60,
      priority: 'high',
      dueDate: `${year}-12-31`,
    },
    {
      id: 'g2',
      title: 'Completar certificación',
      description: 'Certificación profesional en línea',
      type: 'annual',
      progress: 40,
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

  const schedule: ScheduleItem[] = []
  for (let day = 0; day < 5; day++) {
    schedule.push(
      { id: `s${day}a`, title: 'Meditación', startTime: '06:00', endTime: '06:30', day, color: 1 },
      { id: `s${day}b`, title: 'Ejercicio', startTime: '06:30', endTime: '07:30', day, color: 3 },
      { id: `s${day}c`, title: 'Trabajo', startTime: '09:00', endTime: '17:00', day, color: 7 },
    )
  }
  schedule.push(
    { id: 's1d', title: 'Clase de inglés', startTime: '18:30', endTime: '19:30', day: 1, color: 2 },
    { id: 's3d', title: 'Clase de inglés', startTime: '18:30', endTime: '19:30', day: 3, color: 2 },
    { id: 's5a', title: 'Compras semanales', startTime: '10:00', endTime: '11:30', day: 5, color: 4 },
    { id: 's6a', title: 'Revisión semanal', startTime: '19:00', endTime: '19:45', day: 6, color: 5 },
  )

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

  return { habits, transactions, goals, schedule, notes }
}

/* ------------------------------------------------------------------ */
/* Store                                                               */
/* ------------------------------------------------------------------ */

type WithoutId<T> = Omit<T, 'id'>

interface AppState {
  habits: Habit[]
  transactions: Transaction[]
  goals: Goal[]
  schedule: ScheduleItem[]
  notes: Note[]

  addHabit: (h: Omit<Habit, 'id' | 'completions' | 'createdAt'>) => void
  toggleHabit: (id: string, date?: string) => void
  deleteHabit: (id: string) => void

  addTransaction: (t: WithoutId<Transaction>) => void
  deleteTransaction: (id: string) => void

  addGoal: (g: WithoutId<Goal>) => void
  setGoalProgress: (id: string, progress: number) => void
  deleteGoal: (id: string) => void

  addScheduleItem: (s: WithoutId<ScheduleItem>) => void
  deleteScheduleItem: (id: string) => void

  addNote: (n: Omit<Note, 'id' | 'createdAt'>) => void
  toggleNotePin: (id: string) => void
  deleteNote: (id: string) => void

  resetDemo: () => void
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
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

      addGoal: (g) => set((s) => ({ goals: [...s.goals, { ...g, id: uid() }] })),
      setGoalProgress: (id, progress) =>
        set((s) => ({
          goals: s.goals.map((g) => (g.id === id ? { ...g, progress: Math.max(0, Math.min(100, progress)) } : g)),
        })),
      deleteGoal: (id) => set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),

      addScheduleItem: (item) => set((s) => ({ schedule: [...s.schedule, { ...item, id: uid() }] })),
      deleteScheduleItem: (id) => set((s) => ({ schedule: s.schedule.filter((i) => i.id !== id) })),

      addNote: (n) => set((s) => ({ notes: [{ ...n, id: uid(), createdAt: toISODate() }, ...s.notes] })),
      toggleNotePin: (id) =>
        set((s) => ({ notes: s.notes.map((n) => (n.id === id ? { ...n, isPinned: !n.isPinned } : n)) })),
      deleteNote: (id) => set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),

      resetDemo: () => set(seed()),
    }),
    {
      name: 'productividad-pro',
      version: 1,
      storage: createJSONStorage(() => localStorage),
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

export const EVENT_COLORS: { value: EventColor; label: string }[] = [
  { value: 1, label: 'Azul' },
  { value: 3, label: 'Verde' },
  { value: 7, label: 'Violeta' },
  { value: 2, label: 'Naranja' },
  { value: 4, label: 'Amarillo' },
  { value: 5, label: 'Rosa' },
]

/** Clases estáticas (Tailwind necesita verlas completas). */
export const EVENT_COLOR_CLASS: Record<EventColor, { bar: string; soft: string; dot: string }> = {
  1: { bar: 'border-l-series-1', soft: 'bg-series-1/10', dot: 'bg-series-1' },
  2: { bar: 'border-l-series-2', soft: 'bg-series-2/10', dot: 'bg-series-2' },
  3: { bar: 'border-l-series-3', soft: 'bg-series-3/10', dot: 'bg-series-3' },
  4: { bar: 'border-l-series-4', soft: 'bg-series-4/10', dot: 'bg-series-4' },
  5: { bar: 'border-l-series-5', soft: 'bg-series-5/10', dot: 'bg-series-5' },
  7: { bar: 'border-l-series-7', soft: 'bg-series-7/10', dot: 'bg-series-7' },
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
