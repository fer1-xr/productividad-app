'use client'

import Link from 'next/link'
import { useMemo, useState, type FormEvent, type KeyboardEvent } from 'react'
import { BookOpen, Check, ChevronDown, Compass, Copy, Pencil, Plus, Trash2, X } from 'lucide-react'
import { Card, Field, Modal, PageHeader, Segmented } from '../components/ui'
import { PctMeter, RoleDot, WeekNav } from '../components/planner-ui'
import {
  blockRange,
  currentSlot,
  formatSpan,
  isGoalDone,
  performance,
  ROLE_COLOR_CLASS,
  SLOT_COUNT,
  slotTime,
  type PlannerTask,
  type Role,
  type TimeBlock,
  type WeeklyGoal,
} from '@/lib/planner'
import { useStore } from '@/lib/store'
import { addDaysISO, cn, mondayOf, parseISODate, uid, WEEKDAYS, WEEKDAYS_SHORT, weekdayIndex } from '@/lib/utils'

const ROW_H = 30 // px por franja de 30 min

type GoalTarget = { role: Role; slot: 0 | 1; number: number; goal?: WeeklyGoal }
type BlockTarget = { day: number; start: number; block?: TimeBlock }
type MobileView = 'schedule' | 'goals'

export default function PlannerPage() {
  const { roles, weeklyGoals, blocks, mission, setMission, renameRole, toggleBlock, togglePlannerTask, toggleWeeklyGoal, copyGoalsFromWeek } =
    useStore()
  const [weekStart, setWeekStart] = useState(mondayOf())
  const [goalTarget, setGoalTarget] = useState<GoalTarget | null>(null)
  const [blockTarget, setBlockTarget] = useState<BlockTarget | null>(null)
  const [showGuide, setShowGuide] = useState(false)
  const [mobileView, setMobileView] = useState<MobileView>('schedule')
  const [toast, setToast] = useState<string | null>(null)

  const isCurrentWeek = weekStart === mondayOf()
  const todayIdx = weekdayIndex()
  const nowSlot = isCurrentWeek ? currentSlot() : null

  const weekGoals = useMemo(() => weeklyGoals.filter((g) => g.weekStart === weekStart), [weeklyGoals, weekStart])
  const weekBlocks = useMemo(() => blocks.filter((b) => b.weekStart === weekStart), [blocks, weekStart])

  const goalByKey = useMemo(() => {
    const m = new Map<string, WeeklyGoal>()
    for (const g of weekGoals) m.set(`${g.roleId}-${g.slot}`, g)
    return m
  }, [weekGoals])

  /** Mapa [día][franja] → bloque que empieza ahí, o 'covered' si está cubierta por uno anterior. */
  const grid = useMemo(() => {
    const g: (TimeBlock | 'covered' | null)[][] = Array.from({ length: 7 }, () => Array(SLOT_COUNT).fill(null))
    for (const b of [...weekBlocks].sort((a, b) => a.start - b.start)) {
      if (g[b.day][b.start] !== null) continue // solapado: se ignora
      g[b.day][b.start] = b
      for (let i = 1; i < b.span && b.start + i < SLOT_COUNT; i++) g[b.day][b.start + i] = 'covered'
    }
    return g
  }, [weekBlocks])

  const roleById = useMemo(() => new Map(roles.map((r) => [r.id, r])), [roles])
  const overall = performance(weeklyGoals, blocks, weekStart)
  const prevWeek = addDaysISO(weekStart, -7)
  const prevHasGoals = weeklyGoals.some((g) => g.weekStart === prevWeek && g.title.trim())
  const freeGoalSlots = roles.length * 2 - weekGoals.filter((g) => g.title.trim()).length

  const copyPrevious = () => {
    const n = copyGoalsFromWeek(prevWeek, weekStart)
    setToast(n ? `${n} metas copiadas de la semana anterior` : 'No había metas nuevas para copiar')
    setTimeout(() => setToast(null), 2500)
  }

  // Clases de visibilidad para la vista móvil (en escritorio se ve todo)
  const leftCol = mobileView === 'schedule' ? 'hidden lg:table-cell' : ''
  const dayCol = mobileView === 'goals' ? 'hidden lg:table-cell' : ''

  return (
    <>
      <PageHeader
        title="Plan semanal"
        description="Primero lo primero: no priorices lo que está en tu agenda, agenda tus prioridades."
        actions={<WeekNav weekStart={weekStart} onChange={setWeekStart} />}
      />

      {/* Misión + rendimiento de la semana */}
      <div className="mb-4 grid gap-4 lg:grid-cols-3">
        <MissionCard mission={mission} onSave={setMission} />
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted">Rendimiento de la semana</p>
            <Link href="/performance" className="text-xs font-medium text-primary hover:underline">
              Ver por rol
            </Link>
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight">{overall.pct === null ? '—' : `${overall.pct}%`}</p>
          <PctMeter
            pct={overall.pct}
            expected={overall.inProgress ? overall.expected : undefined}
            label="Rendimiento de la semana"
            className="mt-3"
          />
          <p className="mt-2 text-xs text-subtle">
            {overall.tasksDone}/{overall.tasksTotal} tareas · {overall.blocksDone}/{overall.blocksTotal} bloques
            {overall.inProgress && ` · esperado a hoy ${overall.expected}%`}
          </p>
        </Card>
      </div>

      {/* Guía de los 7 hábitos */}
      <Card className="mb-4">
        <button
          onClick={() => setShowGuide((v) => !v)}
          aria-expanded={showGuide}
          className="flex w-full items-center gap-3 px-5 py-3.5 text-left"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <BookOpen size={16} />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-semibold">Cómo planificar tu semana · Los 7 hábitos</span>
            <span className="block text-xs text-subtle">Roles → metas (piedras grandes) → tareas → horario → evaluación</span>
          </span>
          <ChevronDown size={18} className={cn('text-subtle transition-transform', showGuide && 'rotate-180')} />
        </button>
        {showGuide && <Guide />}
      </Card>

      {/* Barra de herramientas de la tabla */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="lg:hidden">
          <Segmented
            ariaLabel="Vista"
            value={mobileView}
            onChange={setMobileView}
            options={[
              { value: 'schedule', label: 'Horario' },
              { value: 'goals', label: 'Roles y metas' },
            ]}
          />
        </div>
        <p className="hidden text-xs text-subtle lg:block">
          Haz clic en una meta para editarla y en una celda del horario para programar un bloque.
        </p>
        <div className="flex items-center gap-2">
          {toast && <span className="text-xs text-success">{toast}</span>}
          {prevHasGoals && freeGoalSlots > 0 && (
            <button onClick={copyPrevious} className="btn-secondary py-1.5 text-xs">
              <Copy size={14} /> Copiar metas de la semana anterior
            </button>
          )}
        </div>
      </div>

      {/* Planificador */}
      <div className="overflow-x-auto rounded-xl border bg-surface shadow-card">
        <table
          className={cn(
            'w-full table-fixed border-collapse text-sm',
            mobileView === 'schedule' && 'min-w-[640px]',
            'lg:min-w-[1080px]',
          )}
        >
          <thead>
            <tr className="border-b bg-surface-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
              <th className={cn('w-[112px] px-3 py-2.5 text-left', leftCol)}>Rol</th>
              <th className={cn('w-[150px] px-3 py-2.5 text-left', leftCol)}>Meta</th>
              <th className={cn('w-7 py-2.5', leftCol)} aria-label="Número" />
              <th className={cn('w-[168px] px-3 py-2.5 text-left', leftCol)}>Tareas</th>
              <th className={cn('w-[52px] border-l px-1 py-2.5 text-center', mobileView === 'goals' && 'hidden lg:table-cell')}>
                Hora
              </th>
              {WEEKDAYS.map((d, i) => {
                const date = parseISODate(addDaysISO(weekStart, i))
                const isToday = isCurrentWeek && i === todayIdx
                return (
                  <th key={d} className={cn('border-l px-1 py-2 text-center', isToday && 'bg-primary-soft text-primary', dayCol)}>
                    <span className="hidden 2xl:inline">{d}</span>
                    <span className="2xl:hidden">{WEEKDAYS_SHORT[i]}</span>
                    <span className={cn('block text-[11px] font-medium normal-case', isToday ? 'text-primary' : 'text-subtle')}>
                      {date.getDate()}
                    </span>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: SLOT_COUNT }, (_, r) => {
              const roleIdx = r >> 2
              const goalSlot = ((r >> 1) & 1) as 0 | 1
              const role = roles[roleIdx]
              const goal = role ? goalByKey.get(`${role.id}-${goalSlot}`) : undefined
              const number = (r >> 1) + 1
              const bandBg = roleIdx % 2 ? 'bg-surface-2/40' : ''
              const fullHour = r % 2 === 0

              return (
                <tr key={r} className={cn(fullHour ? 'border-t' : 'border-t border-dashed border-border/60')} style={{ height: ROW_H }}>
                  {/* ROL */}
                  {r % 4 === 0 && role && (
                    <td rowSpan={4} className={cn('border-t border-solid align-middle', bandBg, leftCol)}>
                      <RoleCell role={role} onRename={(name) => renameRole(role.id, name)} pct={performance(weeklyGoals, blocks, weekStart, role.id).pct} />
                    </td>
                  )}

                  {/* META + # + TAREAS */}
                  {r % 2 === 0 && role && (
                    <>
                      <td rowSpan={2} className={cn('border-l p-0 align-top', bandBg, leftCol)}>
                        <button
                          onClick={() => setGoalTarget({ role, slot: goalSlot, number, goal })}
                          className="group flex w-full items-start gap-1.5 px-2.5 py-1 text-left hover:bg-primary-soft/60"
                          style={{ height: ROW_H * 2 }}
                          aria-label={goal?.title ? `Editar meta ${number}: ${goal.title}` : `Agregar meta ${number} para ${role.name}`}
                        >
                          {goal?.title ? (
                            <>
                              {isGoalDone(goal) && <Check size={14} className="mt-0.5 shrink-0 text-success" strokeWidth={3} />}
                              <span className={cn('line-clamp-3 text-xs font-medium leading-4', isGoalDone(goal) && 'text-subtle')}>
                                {goal.title}
                              </span>
                            </>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-subtle opacity-60 group-hover:opacity-100">
                              <Plus size={12} /> Meta
                            </span>
                          )}
                        </button>
                      </td>
                      <td rowSpan={2} className={cn('p-0 text-center align-top', bandBg, leftCol)}>
                        <span className="mt-1.5 inline-flex h-5 w-5 items-center justify-center rounded bg-foreground text-[10px] font-bold text-background">
                          {number}
                        </span>
                      </td>
                      <td rowSpan={2} className={cn('border-l p-0 align-top', bandBg, leftCol)}>
                        <TasksCell
                          goal={goal}
                          onOpen={() => setGoalTarget({ role, slot: goalSlot, number, goal })}
                          onToggleTask={(taskId) => goal && togglePlannerTask(goal.id, taskId)}
                          onToggleGoal={() => goal && toggleWeeklyGoal(goal.id)}
                        />
                      </td>
                    </>
                  )}

                  {/* HORA */}
                  <td
                    className={cn(
                      'tabular border-l px-1 text-center text-[11px]',
                      nowSlot === r
                        ? 'bg-primary font-semibold text-primary-foreground'
                        : fullHour
                          ? 'font-semibold text-foreground'
                          : 'text-subtle',
                      mobileView === 'goals' && 'hidden lg:table-cell',
                    )}
                  >
                    {slotTime(r)}
                  </td>

                  {/* DÍAS */}
                  {Array.from({ length: 7 }, (_, day) => {
                    const cell = grid[day][r]
                    if (cell === 'covered') return null
                    const isToday = isCurrentWeek && day === todayIdx
                    if (cell) {
                      const blockRole = roleById.get(cell.roleId)
                      return (
                        <td key={day} rowSpan={cell.span} className={cn('border-l p-0.5 align-top', isToday && 'bg-primary-soft/30', dayCol)}>
                          <BlockChip
                            block={cell}
                            role={blockRole}
                            height={cell.span * ROW_H - 4}
                            onOpen={() => setBlockTarget({ day, start: r, block: cell })}
                            onToggle={() => toggleBlock(cell.id)}
                          />
                        </td>
                      )
                    }
                    return (
                      <td key={day} className={cn('border-l p-0', isToday && 'bg-primary-soft/30', dayCol)}>
                        <button
                          onClick={() => setBlockTarget({ day, start: r })}
                          className="group flex w-full items-center justify-center hover:bg-primary-soft"
                          style={{ height: ROW_H - 1 }}
                          aria-label={`Programar ${WEEKDAYS[day]} ${slotTime(r)}`}
                        >
                          <Plus size={12} className="text-primary opacity-0 group-hover:opacity-100" />
                        </button>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {goalTarget && (
        <GoalModal
          key={`${goalTarget.role.id}-${goalTarget.slot}-${weekStart}`}
          target={goalTarget}
          weekStart={weekStart}
          onClose={() => setGoalTarget(null)}
        />
      )}
      {blockTarget && (
        <BlockModal
          key={`${blockTarget.day}-${blockTarget.start}-${blockTarget.block?.id ?? 'new'}`}
          target={blockTarget}
          weekStart={weekStart}
          roles={roles}
          weekGoals={weekGoals}
          weekBlocks={weekBlocks}
          onClose={() => setBlockTarget(null)}
        />
      )}
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Celdas                                                              */
/* ------------------------------------------------------------------ */

function RoleCell({ role, pct, onRename }: { role: Role; pct: number | null; onRename: (name: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(role.name)

  const commit = () => {
    const name = value.trim()
    if (name) onRename(name)
    else setValue(role.name)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="p-2">
        <textarea
          autoFocus
          rows={3}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              commit()
            }
            if (e.key === 'Escape') {
              setValue(role.name)
              setEditing(false)
            }
          }}
          className="input resize-none px-2 py-1 text-xs"
          aria-label="Nombre del rol"
        />
      </div>
    )
  }

  return (
    <div className="group relative flex flex-col items-start gap-1.5 px-2.5 py-2">
      <div className="flex items-start gap-2">
        <RoleDot role={role} className="mt-1" />
        <span className="text-xs font-semibold leading-4">{role.name}</span>
      </div>
      <span className="tabular whitespace-nowrap pl-[18px] text-[11px] text-subtle">{pct === null ? 'Sin plan' : `${pct}% cumplido`}</span>
      <button
        onClick={() => {
          setValue(role.name)
          setEditing(true)
        }}
        className="btn-icon absolute right-1 top-1 h-6 w-6 opacity-0 focus:opacity-100 group-hover:opacity-100"
        aria-label={`Renombrar rol ${role.name}`}
      >
        <Pencil size={12} />
      </button>
    </div>
  )
}

function TasksCell({
  goal,
  onOpen,
  onToggleTask,
  onToggleGoal,
}: {
  goal?: WeeklyGoal
  onOpen: () => void
  onToggleTask: (taskId: string) => void
  onToggleGoal: () => void
}) {
  const style = { height: ROW_H * 2 }
  if (!goal?.title) {
    return <button onClick={onOpen} className="block w-full hover:bg-primary-soft/60" style={style} aria-label="Agregar meta y tareas" />
  }

  if (!goal.tasks.length) {
    return (
      <div className="flex items-center px-2" style={style}>
        <CheckItem done={goal.done} label="Meta cumplida" onToggle={onToggleGoal} muted />
      </div>
    )
  }

  const shown = goal.tasks.slice(0, 2)
  const rest = goal.tasks.length - shown.length
  const done = goal.tasks.filter((t) => t.done).length

  return (
    <div className="flex flex-col justify-center gap-0.5 px-2" style={style}>
      {shown.map((t) => (
        <CheckItem key={t.id} done={t.done} label={t.text} onToggle={() => onToggleTask(t.id)} />
      ))}
      {rest > 0 && (
        <button onClick={onOpen} className="pl-[22px] text-left text-[11px] text-primary hover:underline">
          +{rest} más · {done}/{goal.tasks.length}
        </button>
      )}
    </div>
  )
}

function CheckItem({ done, label, onToggle, muted }: { done: boolean; label: string; onToggle: () => void; muted?: boolean }) {
  return (
    <button onClick={onToggle} aria-pressed={done} className="flex min-w-0 items-center gap-1.5 rounded px-0.5 text-left hover:bg-surface-2">
      <span
        className={cn(
          'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
          done ? 'border-success bg-success text-white' : 'border-subtle/60 bg-surface',
        )}
      >
        {done && <Check size={11} strokeWidth={3} />}
      </span>
      <span className={cn('truncate text-xs', done && 'text-subtle line-through', muted && !done && 'text-muted')}>{label}</span>
    </button>
  )
}

function BlockChip({
  block,
  role,
  height,
  onOpen,
  onToggle,
}: {
  block: TimeBlock
  role?: Role
  height: number
  onOpen: () => void
  onToggle: () => void
}) {
  const color = ROLE_COLOR_CLASS[role?.color ?? 1]
  return (
    <div
      className={cn('group relative overflow-hidden rounded-md border-l-[3px]', color.bar, color.soft, block.done && 'opacity-60')}
      style={{ height }}
    >
      <button onClick={onOpen} className="flex h-full w-full flex-col items-start overflow-hidden px-1.5 py-1 text-left" title={`${block.title} · ${blockRange(block)}${role ? ` · ${role.name}` : ''}`}>
        <span
          className={cn(
            'w-full pr-3.5 text-[11px] font-semibold leading-[14px]',
            block.span === 1 ? 'truncate' : 'line-clamp-2',
            block.done && 'line-through',
          )}
        >
          {block.title}
        </span>
        {block.span >= 2 && (
          <span className="tabular mt-0.5 w-full overflow-hidden whitespace-nowrap text-[10px] leading-3 tracking-tight text-muted">
            {slotTime(block.start)}–{slotTime(block.start + block.span)}
          </span>
        )}
      </button>
      <button
        onClick={onToggle}
        aria-pressed={block.done}
        aria-label={block.done ? `Marcar "${block.title}" como pendiente` : `Marcar "${block.title}" como cumplido`}
        className={cn(
          'absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full border transition-opacity',
          block.done ? 'border-success bg-success text-white' : 'border-subtle/60 bg-surface opacity-0 focus:opacity-100 group-hover:opacity-100',
        )}
      >
        {block.done && <Check size={10} strokeWidth={3} />}
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Misión y guía                                                       */
/* ------------------------------------------------------------------ */

function MissionCard({ mission, onSave }: { mission: string; onSave: (m: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(mission)

  return (
    <Card className="p-5 lg:col-span-2">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-medium text-muted">
          <Compass size={16} className="text-primary" /> Mi misión personal
          <span className="hidden text-xs font-normal text-subtle sm:inline">· Hábito 2: comenzar con un fin en mente</span>
        </p>
        {!editing && (
          <button
            onClick={() => {
              setValue(mission)
              setEditing(true)
            }}
            className="btn-ghost px-2 py-1 text-xs"
          >
            <Pencil size={12} /> Editar
          </button>
        )}
      </div>
      {editing ? (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            onSave(value.trim())
            setEditing(false)
          }}
          className="mt-3"
        >
          <textarea
            autoFocus
            rows={3}
            className="input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="¿Qué quieres ser y hacer? ¿Qué principios guían tu vida?"
          />
          <div className="mt-2 flex justify-end gap-2">
            <button type="button" onClick={() => setEditing(false)} className="btn-secondary py-1.5">
              Cancelar
            </button>
            <button type="submit" className="btn-primary py-1.5">
              Guardar
            </button>
          </div>
        </form>
      ) : (
        <blockquote className="mt-3 text-base leading-relaxed">
          {mission || <span className="text-subtle">Escribe tu misión personal para tenerla presente al planificar.</span>}
        </blockquote>
      )}
    </Card>
  )
}

const GUIDE_STEPS = [
  { title: 'Conecta con tu misión', habit: 'Hábito 2', text: 'Relee tu misión personal. Tus metas de la semana deben acercarte a ella.' },
  { title: 'Revisa tus roles', habit: 'Equilibrio', text: 'Individuo, pareja, familia, trabajo… Usa como máximo 7–8 roles. Renómbralos con el lápiz.' },
  { title: 'Elige 1–2 metas por rol', habit: 'Cuadrante II', text: 'Las "piedras grandes": importantes pero no urgentes. Divide cada meta en tareas concretas.' },
  { title: 'Programa primero lo primero', habit: 'Hábito 3', text: 'Reserva bloques en el horario para tus metas antes de llenarlo con lo urgente.' },
  { title: 'Afila la sierra', habit: 'Hábito 7', text: 'En tu rol de individuo renueva lo físico, mental, espiritual y socio-emocional.' },
  { title: 'Evalúa y ajusta', habit: 'Rendimiento', text: 'Marca tareas y bloques cumplidos. Al final, revisa tu porcentaje por rol y mejora.' },
]

function Guide() {
  return (
    <ol className="grid gap-px border-t bg-border sm:grid-cols-2 xl:grid-cols-3">
      {GUIDE_STEPS.map((s, i) => (
        <li key={s.title} className="flex gap-3 bg-surface p-4">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {i + 1}
          </span>
          <div>
            <p className="text-sm font-semibold">
              {s.title} <span className="ml-1 text-xs font-normal text-subtle">{s.habit}</span>
            </p>
            <p className="mt-0.5 text-xs leading-5 text-muted">{s.text}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}

/* ------------------------------------------------------------------ */
/* Modales                                                             */
/* ------------------------------------------------------------------ */

function GoalModal({ target, weekStart, onClose }: { target: GoalTarget; weekStart: string; onClose: () => void }) {
  const { saveWeeklyGoal, deleteWeeklyGoal } = useStore()
  const { role, slot, number, goal } = target
  const [title, setTitle] = useState(goal?.title ?? '')
  const [tasks, setTasks] = useState<PlannerTask[]>(goal?.tasks ?? [])
  const [done, setDone] = useState(goal?.done ?? false)
  const [newTask, setNewTask] = useState('')

  const addTask = () => {
    const text = newTask.trim()
    if (!text) return
    setTasks((t) => [...t, { id: uid(), text, done: false }])
    setNewTask('')
  }

  const onNewTaskKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTask()
    }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    const pending = newTask.trim() ? [...tasks, { id: uid(), text: newTask.trim(), done: false }] : tasks
    saveWeeklyGoal({
      id: goal?.id,
      weekStart,
      roleId: role.id,
      slot,
      title: title.trim(),
      tasks: pending.filter((t) => t.text.trim()),
      done,
    })
    onClose()
  }

  const isSelf = role.id === 'r1' || /individuo|personal/i.test(role.name)

  return (
    <Modal open onClose={onClose} title={`Meta ${number} · ${role.name}`} description="Una piedra grande del Cuadrante II: importante, no urgente.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Meta de la semana">
          <input
            className="input"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={isSelf ? 'Ej: Afilar la sierra — ejercicio 3 veces' : 'Ej: Cena especial en familia'}
          />
        </Field>

        <fieldset>
          <legend className="label">Tareas</legend>
          {tasks.length > 0 && (
            <ul className="mb-2 space-y-1.5">
              {tasks.map((t) => (
                <li key={t.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTasks((all) => all.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)))}
                    aria-pressed={t.done}
                    aria-label={t.done ? 'Marcar pendiente' : 'Marcar completada'}
                    className={cn(
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded border',
                      t.done ? 'border-success bg-success text-white' : 'bg-surface',
                    )}
                  >
                    {t.done && <Check size={13} strokeWidth={3} />}
                  </button>
                  <input
                    className={cn('input py-1.5', t.done && 'text-subtle line-through')}
                    value={t.text}
                    onChange={(e) => setTasks((all) => all.map((x) => (x.id === t.id ? { ...x, text: e.target.value } : x)))}
                    aria-label="Tarea"
                  />
                  <button
                    type="button"
                    onClick={() => setTasks((all) => all.filter((x) => x.id !== t.id))}
                    className="btn-icon shrink-0 hover:text-danger"
                    aria-label={`Quitar tarea ${t.text}`}
                  >
                    <X size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-2">
            <input
              className="input py-1.5"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={onNewTaskKey}
              placeholder="Nueva tarea (Enter para añadir)"
              aria-label="Nueva tarea"
            />
            <button type="button" onClick={addTask} className="btn-secondary shrink-0 py-1.5">
              <Plus size={14} /> Añadir
            </button>
          </div>
          {tasks.length === 0 && (
            <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" checked={done} onChange={(e) => setDone(e.target.checked)} className="h-4 w-4 accent-[rgb(var(--primary))]" />
              Meta cumplida
            </label>
          )}
        </fieldset>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
          {goal && (
            <button
              type="button"
              onClick={() => {
                if (confirm('¿Eliminar esta meta y sus tareas?')) {
                  deleteWeeklyGoal(goal.id)
                  onClose()
                }
              }}
              className="btn-ghost text-danger hover:bg-danger-soft hover:text-danger sm:mr-auto"
            >
              <Trash2 size={16} /> Eliminar
            </button>
          )}
          <div className="flex flex-col-reverse gap-2 sm:ml-auto sm:flex-row">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              Guardar meta
            </button>
          </div>
        </div>
      </form>
    </Modal>
  )
}

function BlockModal({
  target,
  weekStart,
  roles,
  weekGoals,
  weekBlocks,
  onClose,
}: {
  target: BlockTarget
  weekStart: string
  roles: Role[]
  weekGoals: WeeklyGoal[]
  weekBlocks: TimeBlock[]
  onClose: () => void
}) {
  const { saveBlock, deleteBlock } = useStore()
  const existing = target.block
  const [roleId, setRoleId] = useState(existing?.roleId ?? roles[0]?.id ?? '')
  const [goalId, setGoalId] = useState(existing?.goalId ?? '')
  const [title, setTitle] = useState(existing?.title ?? '')
  const [day, setDay] = useState(existing?.day ?? target.day)
  const [start, setStart] = useState(existing?.start ?? target.start)
  const [span, setSpan] = useState(existing?.span ?? 2)
  const [done, setDone] = useState(existing?.done ?? false)

  const roleGoals = weekGoals.filter((g) => g.roleId === roleId && g.title.trim()).sort((a, b) => a.slot - b.slot)

  // Duración máxima sin pisar otro bloque del mismo día
  const maxSpan = useMemo(() => {
    const next = weekBlocks
      .filter((b) => b.day === day && b.id !== existing?.id && b.start >= start)
      .reduce((m, b) => Math.min(m, b.start), SLOT_COUNT)
    return Math.max(0, next - start)
  }, [weekBlocks, day, start, existing?.id])

  const overlapsStart = weekBlocks.some((b) => b.day === day && b.id !== existing?.id && b.start < start && b.start + b.span > start)
  const invalid = overlapsStart || maxSpan === 0
  const effectiveSpan = Math.min(span, Math.max(1, maxSpan))

  const chooseGoal = (id: string) => {
    const prev = roleGoals.find((g) => g.id === goalId)
    const next = roleGoals.find((g) => g.id === id)
    if (next && (!title.trim() || title === prev?.title)) setTitle(next.title)
    setGoalId(id)
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (invalid || !title.trim()) return
    saveBlock({ id: existing?.id, weekStart, day, start, span: effectiveSpan, roleId, goalId: goalId || undefined, title: title.trim(), done })
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={existing ? 'Editar bloque' : 'Programar bloque'}
      description={`${WEEKDAYS[day]} · ${slotTime(start)} – ${slotTime(start + effectiveSpan)}`}
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Rol">
            <select
              className="input"
              value={roleId}
              onChange={(e) => {
                setRoleId(e.target.value)
                setGoalId('')
              }}
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Meta de la semana">
            <select className="input" value={goalId} onChange={(e) => chooseGoal(e.target.value)}>
              <option value="">— Sin meta específica —</option>
              {roleGoals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Actividad">
          <input className="input" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Gimnasio" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Día">
            <select className="input" value={day} onChange={(e) => setDay(Number(e.target.value))}>
              {WEEKDAYS.map((d, i) => (
                <option key={d} value={i}>
                  {d}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Inicio">
            <select className="input tabular" value={start} onChange={(e) => setStart(Number(e.target.value))}>
              {Array.from({ length: SLOT_COUNT }, (_, i) => (
                <option key={i} value={i}>
                  {slotTime(i)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Duración">
            <select className="input" value={effectiveSpan} onChange={(e) => setSpan(Number(e.target.value))} disabled={invalid}>
              {Array.from({ length: Math.max(1, Math.min(maxSpan, 24)) }, (_, i) => i + 1).map((s) => (
                <option key={s} value={s}>
                  {formatSpan(s)}
                </option>
              ))}
            </select>
          </Field>
        </div>
        {invalid && <p className="-mt-2 text-xs text-danger">Ese horario ya está ocupado por otro bloque.</p>}
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" checked={done} onChange={(e) => setDone(e.target.checked)} className="h-4 w-4 accent-[rgb(var(--primary))]" />
          Cumplido
        </label>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
          {existing && (
            <button
              type="button"
              onClick={() => {
                deleteBlock(existing.id)
                onClose()
              }}
              className="btn-ghost text-danger hover:bg-danger-soft hover:text-danger sm:mr-auto"
            >
              <Trash2 size={16} /> Eliminar
            </button>
          )}
          <div className="flex flex-col-reverse gap-2 sm:ml-auto sm:flex-row">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={invalid}>
              {existing ? 'Guardar' : 'Programar'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
