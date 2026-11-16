'use client'

import { useState, type FormEvent } from 'react'
import { CalendarClock, Check, CheckCircle2, CircleDashed, Loader, Plus, Target, Trash2, X } from 'lucide-react'
import { Badge, EmptyState, Field, FormActions, Modal, PageHeader, Progress, Segmented, StatCard } from '../components/ui'
import {
  GOAL_TYPE_LABEL,
  goalStatus,
  metricCurrent,
  PRIORITY_LABEL,
  useStore,
  type Goal,
  type GoalType,
  type Priority,
} from '@/lib/store'
import { cn, formatDate, parseISODate, toISODate, uid, formatAmount } from '@/lib/utils'
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
        {goal.metric ? (
          <MetricSection goal={goal} />
        ) : goal.steps && goal.steps.length ? (
          <StepsSection goal={goal} />
        ) : (
          <>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={goal.progress}
              onChange={(e) => onProgress(goal.id, Number(e.target.value))}
              className={cn('w-full cursor-pointer', goal.progress >= 100 ? 'accent-[rgb(var(--success))]' : 'accent-[rgb(var(--primary))]')}
              aria-label={`Actualizar progreso de ${goal.title}`}
            />
            <AddStepInline goalId={goal.id} label="Dividir en pasos" />
          </>
        )}
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

/** Meta numérica: cuánto llevas, cuánto falta y registro de aportes. */
function MetricSection({ goal }: { goal: Goal }) {
  const { addGoalEntry, deleteGoalEntry } = useStore()
  const m = goal.metric!
  const current = metricCurrent(m)
  const remaining = Math.max(0, m.target - current)
  const [adding, setAdding] = useState(false)
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(toISODate())
  const [note, setNote] = useState('')
  const [showAll, setShowAll] = useState(false)
  const entries = [...m.entries].sort((a, b) => b.date.localeCompare(a.date))

  // Ritmo necesario por mes hasta la fecha límite
  const monthsLeft = Math.max(1, daysLeft(goal.dueDate) / 30)
  const perMonth = remaining / monthsLeft

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const v = parseFloat(amount.replace(/\./g, '').replace(',', '.'))
    if (!v) return
    addGoalEntry(goal.id, { amount: v, date, note: note.trim() })
    setAmount('')
    setNote('')
    setAdding(false)
  }

  return (
    <div>
      <Progress value={goal.progress} label={`Progreso de ${goal.title}`} />
      <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-surface-2 px-2 py-2">
          <dt className="text-[11px] text-subtle">Llevas</dt>
          <dd className="tabular text-sm font-semibold">{formatAmount(current, m.unit)}</dd>
        </div>
        <div className="rounded-lg bg-surface-2 px-2 py-2">
          <dt className="text-[11px] text-subtle">Te falta</dt>
          <dd className="tabular text-sm font-semibold">{formatAmount(remaining, m.unit)}</dd>
        </div>
        <div className="rounded-lg bg-surface-2 px-2 py-2">
          <dt className="text-[11px] text-subtle">Meta</dt>
          <dd className="tabular text-sm font-semibold">{formatAmount(m.target, m.unit)}</dd>
        </div>
      </dl>
      {remaining > 0 && daysLeft(goal.dueDate) > 0 && (
        <p className="mt-2 text-xs text-subtle">
          Para llegar a tiempo necesitas ≈ <span className="font-medium text-foreground">{formatAmount(Math.ceil(perMonth), m.unit)}</span> por mes.
        </p>
      )}

      {adding ? (
        <form onSubmit={submit} className="mt-3 space-y-2 rounded-lg border p-3">
          <div className="grid grid-cols-2 gap-2">
            <input autoFocus inputMode="decimal" className="input py-1.5 tabular" placeholder={`Monto (${m.unit || 'valor'})`} value={amount} onChange={(e) => setAmount(e.target.value)} aria-label="Monto del avance" required />
            <input type="date" className="input py-1.5" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Fecha" />
          </div>
          <input className="input py-1.5" placeholder="Nota (opcional): ej. depósito de sueldo" value={note} onChange={(e) => setNote(e.target.value)} aria-label="Nota" />
          <p className="text-[11px] text-subtle">Usa un número negativo si retiraste dinero.</p>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setAdding(false)} className="btn-secondary py-1.5">Cancelar</button>
            <button type="submit" className="btn-primary py-1.5">Guardar avance</button>
          </div>
        </form>
      ) : (
        <button onClick={() => setAdding(true)} className="btn-secondary mt-3 w-full py-1.5">
          <Plus size={14} /> Registrar avance
        </button>
      )}

      {entries.length > 0 && (
        <div className="mt-3">
          <p className="mb-1 text-xs font-medium text-muted">Historial de avances</p>
          <ul className="divide-y text-sm">
            {(showAll ? entries : entries.slice(0, 3)).map((e) => (
              <li key={e.id} className="group flex items-center gap-2 py-1.5">
                <span className="tabular w-14 shrink-0 text-xs text-subtle">{formatDate(e.date)}</span>
                <span className="min-w-0 flex-1 truncate text-xs text-muted">{e.note || 'Avance'}</span>
                <span className={cn('tabular text-xs font-semibold', e.amount >= 0 ? 'text-success' : 'text-danger')}>
                  {e.amount >= 0 ? '+' : ''}
                  {formatAmount(e.amount, m.unit)}
                </span>
                <button onClick={() => deleteGoalEntry(goal.id, e.id)} className="btn-icon h-6 w-6 opacity-0 hover:text-danger focus:opacity-100 group-hover:opacity-100" aria-label="Eliminar avance">
                  <X size={12} />
                </button>
              </li>
            ))}
          </ul>
          {entries.length > 3 && (
            <button onClick={() => setShowAll((v) => !v)} className="mt-1 text-xs text-primary hover:underline">
              {showAll ? 'Ver menos' : `Ver los ${entries.length}`}
            </button>
          )}
          <p className="mt-1 text-[11px] text-subtle">Valor inicial: {formatAmount(m.start, m.unit)}</p>
        </div>
      )}
    </div>
  )
}

/** Meta por pasos: cada paso completado suma progreso. */
function StepsSection({ goal }: { goal: Goal }) {
  const { toggleGoalStep, deleteGoalStep } = useStore()
  const steps = goal.steps!
  const done = steps.filter((x) => x.done).length
  return (
    <div>
      <Progress value={goal.progress} label={`Progreso de ${goal.title}`} />
      <p className="mt-2 text-xs text-subtle">
        {done} de {steps.length} pasos · {steps.length - done === 0 ? '¡Meta cumplida!' : `te faltan ${steps.length - done}`}
      </p>
      <ul className="mt-2 space-y-1">
        {steps.map((st) => (
          <li key={st.id} className="group flex items-center gap-2">
            <button
              onClick={() => toggleGoalStep(goal.id, st.id)}
              aria-pressed={st.done}
              className="flex min-w-0 flex-1 items-center gap-2 rounded px-1 py-0.5 text-left hover:bg-surface-2"
            >
              <span className={cn('flex h-4 w-4 shrink-0 items-center justify-center rounded border', st.done ? 'border-success bg-success text-white' : 'bg-surface')}>
                {st.done && <Check size={11} strokeWidth={3} />}
              </span>
              <span className={cn('truncate text-sm', st.done && 'text-subtle line-through')}>{st.text}</span>
            </button>
            <button onClick={() => deleteGoalStep(goal.id, st.id)} className="btn-icon h-6 w-6 opacity-0 hover:text-danger focus:opacity-100 group-hover:opacity-100" aria-label={`Quitar paso ${st.text}`}>
              <X size={12} />
            </button>
          </li>
        ))}
      </ul>
      <AddStepInline goalId={goal.id} label="Añadir paso" />
    </div>
  )
}

function AddStepInline({ goalId, label }: { goalId: string; label: string }) {
  const addGoalStep = useStore((s) => s.addGoalStep)
  const [text, setText] = useState('')
  const [open, setOpen] = useState(false)
  if (!open)
    return (
      <button onClick={() => setOpen(true)} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
        <Plus size={12} /> {label}
      </button>
    )
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (!text.trim()) return
        addGoalStep(goalId, text.trim())
        setText('')
      }}
      className="mt-2 flex gap-2"
    >
      <input autoFocus className="input py-1.5" value={text} onChange={(e) => setText(e.target.value)} placeholder="Nuevo paso (Enter)" aria-label="Nuevo paso" onBlur={() => !text && setOpen(false)} />
      <button type="submit" className="btn-secondary shrink-0 py-1.5">Añadir</button>
    </form>
  )
}

function GoalForm({ onSubmit, onCancel }: { onSubmit: (g: Omit<Goal, 'id'>) => void; onCancel: () => void }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<GoalType>('monthly')
  const [priority, setPriority] = useState<Priority>('medium')
  const [dueDate, setDueDate] = useState(toISODate(new Date(Date.now() + 30 * 86_400_000)))
  const [mode, setMode] = useState<'manual' | 'metric' | 'steps'>('metric')
  const [target, setTarget] = useState('')
  const [start, setStart] = useState('')
  const [unit, setUnit] = useState('Gs')
  const [stepsText, setStepsText] = useState('')

  const num = (v: string) => parseFloat(v.replace(/\./g, '').replace(',', '.')) || 0

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    const base = { title: title.trim(), description: description.trim(), type, priority, dueDate, progress: 0 }
    if (mode === 'metric') {
      if (!num(target)) return
      onSubmit({ ...base, metric: { target: num(target), start: num(start), unit: unit.trim(), entries: [] } })
    } else if (mode === 'steps') {
      const steps = stepsText.split('\n').map((t) => t.trim()).filter(Boolean).map((text) => ({ id: uid(), text, done: false }))
      onSubmit({ ...base, steps })
    } else onSubmit(base)
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Título">
        <input className="input" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Ahorrar $5.000" />
      </Field>
      <Field label="Descripción">
        <textarea className="input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="¿Cómo sabrás que la lograste?" />
      </Field>
      <fieldset>
        <legend className="label">¿Cómo quieres medir el avance?</legend>
        <Segmented
          ariaLabel="Forma de medir"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'metric', label: 'Con un número' },
            { value: 'steps', label: 'Por pasos' },
            { value: 'manual', label: 'Manual %' },
          ]}
        />
      </fieldset>
      {mode === 'metric' && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Meta">
            <input className="input tabular" inputMode="decimal" required value={target} onChange={(e) => setTarget(e.target.value)} placeholder="3.000.000" />
          </Field>
          <Field label="Ya tengo">
            <input className="input tabular" inputMode="decimal" value={start} onChange={(e) => setStart(e.target.value)} placeholder="500.000" />
          </Field>
          <Field label="Unidad">
            <input className="input" list="goal-units" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Gs, $, kg, km…" />
            <datalist id="goal-units">
              {['Gs', '$', 'US$', 'kg', 'km', 'libros', 'horas'].map((u) => (
                <option key={u} value={u} />
              ))}
            </datalist>
          </Field>
        </div>
      )}
      {mode === 'steps' && (
        <Field label="Pasos (uno por línea)">
          <textarea className="input" rows={4} value={stepsText} onChange={(e) => setStepsText(e.target.value)} placeholder={'Inscribirme al curso\nTerminar módulo 1\nRendir el examen'} />
        </Field>
      )}
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
