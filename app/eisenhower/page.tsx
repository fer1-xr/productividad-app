'use client'

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
}

const QUADRANTS: QuadrantInfo[] = [
  {
    id: 'q1',
    title: 'Urgente e importante',
    action: 'Hacer ahora',
    hint: 'Crisis, plazos que vencen, problemas que no pueden esperar…',
    className: 'bg-red-50 border-red-200 dark:bg-red-950/25 dark:border-red-900/60',
    accent: 'text-red-700 dark:text-red-300',
  },
  {
    id: 'q2',
    title: 'No urgente e importante',
    action: 'Planificar',
    hint: 'Metas, prevención, relaciones, aprendizaje, ejercicio…',
    className: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/25 dark:border-emerald-900/60',
    accent: 'text-emerald-700 dark:text-emerald-300',
  },
  {
    id: 'q3',
    title: 'Urgente y no importante',
    action: 'Delegar',
    hint: 'Interrupciones, algunas llamadas y correos, reuniones ajenas…',
    className: 'bg-amber-50 border-amber-200 dark:bg-amber-950/25 dark:border-amber-900/60',
    accent: 'text-amber-700 dark:text-amber-300',
  },
  {
    id: 'q4',
    title: 'No urgente y no importante',
    action: 'Eliminar',
    hint: 'Distracciones, redes sociales sin propósito, pérdidas de tiempo…',
    className: 'bg-sky-50 border-sky-200 dark:bg-sky-950/25 dark:border-sky-900/60',
    accent: 'text-sky-700 dark:text-sky-300',
  },
]

export default function EisenhowerPage() {
  const { eisenhower, setEisenhower } = useStore()

  return (
    <div>
      <PageHeader
        title="Matriz Eisenhower"
        description="Clasifica tus tareas según urgencia e importancia. Lo que escribas se guarda automáticamente."
      />

      <div className="grid gap-3 sm:grid-cols-[auto_1fr_1fr]">
        <div className="hidden sm:block" />
        <p className="hidden text-center text-xs font-semibold uppercase tracking-wider text-subtle sm:block">Urgente</p>
        <p className="hidden text-center text-xs font-semibold uppercase tracking-wider text-subtle sm:block">No urgente</p>

        {[0, 1].map((row) => (
          <Row key={row} label={row === 0 ? 'Importante' : 'No importante'}>
            {[QUADRANTS[row === 0 ? 0 : 2], QUADRANTS[row === 0 ? 1 : 3]].map((q) => (
              <section key={q.id} className={cn('flex min-h-[260px] flex-col rounded-xl border p-4', q.className)}>
                <div className="mb-2 flex items-baseline justify-between gap-2">
                  <h2 className={cn('text-sm font-semibold', q.accent)}>{q.title}</h2>
                  <span className={cn('text-xs font-medium uppercase tracking-wide', q.accent)}>{q.action}</span>
                </div>
                <textarea
                  value={eisenhower[q.id]}
                  onChange={(e) => setEisenhower(q.id, e.target.value)}
                  placeholder={q.hint}
                  aria-label={`${q.title} — ${q.action}`}
                  className="flex-1 resize-none bg-transparent text-sm leading-relaxed text-foreground placeholder:text-subtle focus:outline-none"
                />
              </section>
            ))}
          </Row>
        ))}
      </div>
    </div>
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
