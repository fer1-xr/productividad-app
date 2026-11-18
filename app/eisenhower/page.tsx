'use client'

import { useState, type FormEvent } from 'react'
import { Plus, X } from 'lucide-react'
import { PageHeader } from '../components/ui'
import { useStore, type Quadrant } from '@/lib/store'
import { cn } from '@/lib/utils'

interface QuadrantInfo {
  id: Quadrant
  title: string
  action: string
  hint: string
  className: string
  accent: string
  check: string
  bar: string
}

const QUADRANTS: QuadrantInfo[] = [
  {
    id: 'q1',
    title: 'Urgente e importante',
    action: 'Hacer ahora',
    hint: 'Crisis, plazos que vencen, problemas que no pueden esperar…',
    className: 'bg-red-50 border-red-200 dark:bg-red-950/25 dark:border-red-900/60',
    accent: 'text-red-700 dark:text-red-300',
    check: 'accent-red-600',
    bar: 'bg-red-500',
  },
  {
    id: 'q2',
    title: 'No urgente e importante',
    action: 'Planificar',
    hint: 'Metas, prevención, relaciones, aprendizaje, ejercicio…',
    className: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/25 dark:border-emerald-900/60',
    accent: 'text-emerald-700 dark:text-emerald-300',
    check: 'accent-emerald-600',
    bar: 'bg-emerald-500',
  },
  {
    id: 'q3',
    title: 'Urgente y no importante',
    action: 'Delegar',
    hint: 'Interrupciones, algunas llamadas y correos, reuniones ajenas…',
    className: 'bg-amber-50 border-amber-200 dark:bg-amber-950/25 dark:border-amber-900/60',
    accent: 'text-amber-700 dark:text-amber-300',
    check: 'accent-amber-600',
    bar: 'bg-amber-500',
  },
  {
    id: 'q4',
    title: 'No urgente y no importante',
    action: 'Eliminar',
    hint: 'Distracciones, redes sociales sin propósito, pérdidas de tiempo…',
    className: 'bg-sky-50 border-sky-200 dark:bg-sky-950/25 dark:border-sky-900/60',
    accent: 'text-sky-700 dark:text-sky-300',
    check: 'accent-sky-600',
    bar: 'bg-sky-500',
  },
]

export default function EisenhowerPage() {
  return (
    <div>
      <PageHeader
        title="Matriz Eisenhower"
        description="Clasifica tus tareas según urgencia e importancia y marca las que vayas terminando. Se guarda automáticamente."
      />

      <div className="grid gap-3 sm:grid-cols-[auto_1fr_1fr]">
        <div className="hidden sm:block" />
        <p className="hidden text-center text-xs font-semibold uppercase tracking-wider text-subtle sm:block">Urgente</p>
        <p className="hidden text-center text-xs font-semibold uppercase tracking-wider text-subtle sm:block">No urgente</p>

        {[0, 1].map((row) => (
          <Row key={row} label={row === 0 ? 'Importante' : 'No importante'}>
            {[QUADRANTS[row === 0 ? 0 : 2], QUADRANTS[row === 0 ? 1 : 3]].map((q) => (
              <QuadrantCard key={q.id} q={q} />
            ))}
          </Row>
        ))}
      </div>
    </div>
  )
}

function QuadrantCard({ q }: { q: QuadrantInfo }) {
  const tasks = useStore((s) => s.eisenhower[q.id])
  const { addEisenhowerTask, toggleEisenhowerTask, updateEisenhowerTask, deleteEisenhowerTask } = useStore()
  const [draft, setDraft] = useState('')

  const done = tasks.filter((t) => t.done).length
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0

  const add = (e: FormEvent) => {
    e.preventDefault()
    const text = draft.trim()
    if (!text) return
    addEisenhowerTask(q.id, text)
    setDraft('')
  }

  return (
    <section className={cn('flex min-h-[280px] flex-col rounded-xl border p-4', q.className)}>
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className={cn('text-sm font-semibold', q.accent)}>{q.title}</h2>
        <span className={cn('text-xs font-medium uppercase tracking-wide', q.accent)}>{q.action}</span>
      </div>

      {tasks.length === 0 && <p className="mb-1 text-xs text-subtle">{q.hint}</p>}

      <ul className="space-y-1">
        {tasks.map((t) => (
          <li key={t.id} className="group flex items-center gap-2.5">
            <input
              type="checkbox"
              checked={t.done}
              onChange={() => toggleEisenhowerTask(q.id, t.id)}
              aria-label={t.done ? `Marcar "${t.text}" como pendiente` : `Marcar "${t.text}" como terminada`}
              className={cn('h-4 w-4 shrink-0 cursor-pointer rounded', q.check)}
            />
            <input
              value={t.text}
              onChange={(e) => updateEisenhowerTask(q.id, t.id, e.target.value)}
              onBlur={(e) => !e.target.value.trim() && deleteEisenhowerTask(q.id, t.id)}
              aria-label="Editar tarea"
              className={cn(
                'min-w-0 flex-1 bg-transparent py-1 text-sm focus:outline-none',
                t.done ? 'text-subtle line-through' : 'text-foreground',
              )}
            />
            <button
              onClick={() => deleteEisenhowerTask(q.id, t.id)}
              className="rounded p-1 text-subtle opacity-0 transition-opacity hover:text-foreground focus:opacity-100 group-hover:opacity-100"
              aria-label={`Eliminar "${t.text}"`}
            >
              <X size={14} />
            </button>
          </li>
        ))}
      </ul>

      <form onSubmit={add} className="mt-1 flex items-center gap-2.5">
        <Plus size={16} className="shrink-0 text-subtle" aria-hidden />
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Agregar tarea…"
          aria-label={`Agregar tarea a ${q.title}`}
          className="min-w-0 flex-1 bg-transparent py-1 text-sm text-foreground placeholder:text-subtle focus:outline-none"
        />
      </form>

      <div className="mt-auto pt-4">
        <div className="mb-1.5 flex items-baseline justify-between text-xs">
          <span className="text-muted">
            {done} de {tasks.length} terminadas
          </span>
          <span className={cn('tabular font-semibold', q.accent)}>{pct}%</span>
        </div>
        <div
          className="h-1.5 overflow-hidden rounded-full bg-black/5 dark:bg-white/10"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Avance de ${q.title}`}
        >
          <div className={cn('h-full rounded-full transition-[width] duration-300', q.bar)} style={{ width: `${pct}%` }} />
        </div>
      </div>
    </section>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <p className="hidden items-center text-xs font-semibold uppercase tracking-wider text-subtle [writing-mode:vertical-rl] sm:flex sm:rotate-180 sm:justify-center">
        {label}
      </p>
      {children}
    </>
  )
}
