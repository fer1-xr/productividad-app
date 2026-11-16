'use client'

import { useState, type FormEvent } from 'react'
import { CalendarClock, CheckCircle2, CircleDashed, Loader, Plus, Target, Trash2 } from 'lucide-react'
import { Badge, EmptyState, Field, FormActions, Modal, PageHeader, Progress, Segmented, StatCard } from '../components/ui'
import {
  GOAL_TYPE_LABEL,
  goalStatus,
  PRIORITY_LABEL,
  useStore,
  type Goal,
  type GoalType,
  type Priority,
} from '@/lib/store'
import { cn, formatDate, parseISODate, toISODate } from '@/lib/utils'
import { useOpenFromQuery } from '@/lib/use-open-from-query'

type Filter = 'all' | GoalType | 'completed'

const priorityTone = { high: 'danger', medium: 'warning', low: 'neutral' } as const
const priorityOrder: Record<Priority, number> = { high: 0, medium: 1, low: 2 }

const statusMeta = {
  completed: { label: 'Completada', tone: 'success', icon: CheckCircle2 },
  in_progress: { label: 'En progreso', tone: 'primary', icon: Loader },
  not_started: { label: 'Sin iniciar', tone: 'neutral', icon: CircleDashed },
} as const

function daysLeft(iso: string) {
  const ms = parseISODate(iso).getTime() - parseISODate(toISODate()).getTime()
  return Math.round(ms / 86_400_000)
}

export default function GoalsPage() {
  const { goals, addGoal, deleteGoal, setGoalProgress } = useStore()
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState<Filter>('all')
  useOpenFromQuery(() => setOpen(true))

  const completed = goals.filter((g) => goalStatus(g) === 'completed')
  const active = goals.filter((g) => goalStatus(g) !== 'completed')
  const avg = goals.length ? Math.round(goals.reduce((s, g) => s + g.progress, 0) / goals.length) : 0

  const visible = goals
    .filter((g) => {
      if (filter === 'all') return goalStatus(g) !== 'completed'
      if (filter === 'completed') return goalStatus(g) === 'completed'
      return g.type === filter && goalStatus(g) !== 'completed'
    })
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority] || a.dueDate.localeCompare(b.dueDate))

  const count = (t: GoalType) => active.filter((g) => g.type === t).length

  return (
    <>
      <PageHeader
        title="Metas y objetivos"
        description="Define tus metas y actualiza su progreso."
        actions={
          <button onClick={() => setOpen(true)} className="btn-primary">
            <Plus size={16} /> Nueva meta
          </button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Metas activas" icon={Target} value={active.length} />
        <StatCard label="Completadas" icon={CheckCircle2} value={completed.length} />
        <StatCard label="Progreso medio" value={`${avg}%`}>
          <Progress value={avg} className="mt-3" label="Progreso medio" />
        </StatCard>
      </div>

      <div className="mb-4 overflow-x-auto">
        <Segmented
          ariaLabel="Filtrar metas"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'Activas', count: active.length },
            { value: 'annual', label: 'Anuales', count: count('annual') },
            { value: 'monthly', label: 'Mensuales', count: count('monthly') },
            { value: 'weekly', label: 'Semanales', count: count('weekly') },
            { value: 'completed', label: 'Completadas', count: completed.length },
          ]}
        />
      </div>

      {visible.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Target}
            title={filter === 'completed' ? 'Aún no completaste metas' : 'No hay metas aquí'}
            description="Las metas claras y medibles son más fáciles de alcanzar."
            action={
              <button onClick={() => setOpen(true)} className="btn-primary">
                <Plus size={16} /> Nueva meta
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((g) => (
            <GoalCard key={g.id} goal={g} onDelete={deleteGoal} onProgress={setGoalProgress} />
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Nueva meta">
        <GoalForm
          onCancel={() => setOpen(false)}
          onSubmit={(g) => {
            addGoal(g)
            setOpen(false)
          }}
        />
      </Modal>
    </>
  )
}

function GoalCard({
  goal,
  onDelete,
  onProgress,
}: {
  goal: Goal
  onDelete: (id: string) => void
  onProgress: (id: string, p: number) => void
}) {
  const status = statusMeta[goalStatus(goal)]
  const StatusIcon = status.icon
  const left = daysLeft(goal.dueDate)
  const overdue = left < 0 && goal.progress < 100

  return (
    <article className="card flex flex-col p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          <Badge tone={status.tone}>
            <StatusIcon size={12} /> {status.label}
          </Badge>
          <Badge tone={priorityTone[goal.priority]}>Prioridad {PRIORITY_LABEL[goal.priority].toLowerCase()}</Badge>
        </div>
        <button
          onClick={() => confirm(`¿Eliminar "${goal.title}"?`) && onDelete(goal.id)}
          className="btn-icon -mr-2 -mt-1 hover:text-danger"
          aria-label={`Eliminar ${goal.title}`}
        >
          <Trash2 size={16} />
        </button>
      </div>

      <h3 className="font-semibold">{goal.title}</h3>
      {goal.description && <p className="mt-1 text-sm text-muted">{goal.description}</p>}

      <div className="mt-auto pt-5">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-muted">Progreso</span>
          <span className="tabular font-semibold">{goal.progress}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={goal.progress}
          onChange={(e) => onProgress(goal.id, Number(e.target.value))}
          className={cn(
            'w-full cursor-pointer',
            goal.progress >= 100 ? 'accent-[rgb(var(--success))]' : 'accent-[rgb(var(--primary))]',
          )}
          aria-label={`Actualizar progreso de ${goal.title}`}
        />
        <div className="mt-3 flex items-center justify-between border-t pt-3 text-xs">
          <span className="text-subtle">{GOAL_TYPE_LABEL[goal.type]}</span>
          <span className={overdue ? 'font-medium text-danger' : 'text-subtle'}>
            <CalendarClock size={12} className="mr-1 inline" />
            {formatDate(goal.dueDate, { day: 'numeric', month: 'short', year: 'numeric' })}
            {goal.progress < 100 && (overdue ? ' · vencida' : left <= 7 ? ` · ${left} d` : '')}
          </span>
        </div>
      </div>
    </article>
  )
}

function GoalForm({ onSubmit, onCancel }: { onSubmit: (g: Omit<Goal, 'id'>) => void; onCancel: () => void }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<GoalType>('monthly')
  const [priority, setPriority] = useState<Priority>('medium')
  const [dueDate, setDueDate] = useState(toISODate(new Date(Date.now() + 30 * 86_400_000)))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onSubmit({ title: title.trim(), description: description.trim(), type, priority, dueDate, progress: 0 })
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Título">
        <input className="input" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Ahorrar $5.000" />
      </Field>
      <Field label="Descripción">
        <textarea className="input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="¿Cómo sabrás que la lograste?" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Tipo">
          <select className="input" value={type} onChange={(e) => setType(e.target.value as GoalType)}>
            {Object.entries(GOAL_TYPE_LABEL).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Prioridad">
          <select className="input" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
            {(['high', 'medium', 'low'] as const).map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABEL[p]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Fecha límite">
          <input className="input" type="date" required value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </Field>
      </div>
      <FormActions onCancel={onCancel} submitLabel="Crear meta" />
    </form>
  )
}
