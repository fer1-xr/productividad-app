'use client'

import { useState, type FormEvent } from 'react'
import { Check, CheckCircle2, Flame, Plus, Trash2, Trophy } from 'lucide-react'
import { Badge, Card, EmptyState, Field, FormActions, Modal, PageHeader, Segmented, StatCard } from '../components/ui'
import { FREQUENCY_LABEL, HABIT_CATEGORIES, habitStreak, useStore, type Frequency } from '@/lib/store'
import { cn, daysAgo, parseISODate, toISODate, WEEKDAYS_SHORT, weekdayIndex } from '@/lib/utils'
import { useOpenFromQuery } from '@/lib/use-open-from-query'
import { HABIT_IDEAS } from '@/lib/wellbeing'

const last7 = Array.from({ length: 7 }, (_, i) => daysAgo(6 - i))

export default function HabitsPage() {
  const { habits, toggleHabit, deleteHabit, addHabit } = useStore()
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState<string>('all')
  useOpenFromQuery(() => setOpen(true))

  const today = toISODate()
  const doneToday = habits.filter((h) => h.completions.includes(today)).length
  const bestStreak = habits.reduce((m, h) => Math.max(m, habitStreak(h)), 0)
  const weekRate = habits.length
    ? Math.round(
        (habits.reduce((s, h) => s + last7.filter((d) => h.completions.includes(d)).length, 0) /
          (habits.length * 7)) *
          100,
      )
    : 0

  const categories = Array.from(new Set(habits.map((h) => h.category)))
  const visible = filter === 'all' ? habits : habits.filter((h) => h.category === filter)

  return (
    <>
      <PageHeader
        title="Hábitos"
        description="Construye hábitos positivos y sigue tu progreso diario."
        actions={
          <button onClick={() => setOpen(true)} className="btn-primary">
            <Plus size={16} /> Nuevo hábito
          </button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Completados hoy" icon={CheckCircle2} value={`${doneToday} / ${habits.length}`} />
        <StatCard label="Cumplimiento (7 días)" icon={Check} value={`${weekRate}%`} />
        <StatCard label="Mejor racha actual" icon={Trophy} value={`${bestStreak} días`} />
      </div>

      {categories.length > 1 && (
        <div className="mb-4 overflow-x-auto">
          <Segmented
            ariaLabel="Filtrar por categoría"
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: 'Todos', count: habits.length },
              ...categories.map((c) => ({
                value: c,
                label: c,
                count: habits.filter((h) => h.category === c).length,
              })),
            ]}
          />
        </div>
      )}

      <Card>
        {visible.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="No hay hábitos todavía"
            description="Crea tu primer hábito para empezar a construir rachas."
            action={
              <button onClick={() => setOpen(true)} className="btn-primary">
                <Plus size={16} /> Nuevo hábito
              </button>
            }
          />
        ) : (
          <>
            <div className="hidden items-center gap-4 border-b px-5 py-2.5 text-xs font-medium text-subtle md:flex">
              <span className="flex-1">Hábito</span>
              <span className="flex w-[244px] justify-between">
                {last7.map((d) => (
                  <span key={d} className={cn('w-8 text-center', d === today && 'font-semibold text-primary')}>
                    {WEEKDAYS_SHORT[weekdayIndex(parseISODate(d))]}
                  </span>
                ))}
              </span>
              <span className="w-24 text-right">Racha</span>
              <span className="w-8" />
            </div>
            <ul className="divide-y">
              {visible.map((h) => {
                const streak = habitStreak(h)
                return (
                  <li key={h.id} className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium">{h.name}</p>
                        <Badge>{h.category}</Badge>
                        <Badge tone="primary">{FREQUENCY_LABEL[h.frequency]}</Badge>
                      </div>
                      {h.description && <p className="mt-0.5 truncate text-xs text-subtle">{h.description}</p>}
                    </div>

                    <div className="flex w-full justify-between md:w-[244px]">
                      {last7.map((d) => {
                        const done = h.completions.includes(d)
                        const label = parseISODate(d).toLocaleDateString('es', { weekday: 'long', day: 'numeric' })
                        return (
                          <button
                            key={d}
                            onClick={() => toggleHabit(h.id, d)}
                            aria-pressed={done}
                            aria-label={`${h.name}, ${label}: ${done ? 'completado' : 'pendiente'}`}
                            title={label}
                            className={cn(
                              'flex h-8 w-8 items-center justify-center rounded-lg border text-xs transition-colors',
                              done
                                ? 'border-success bg-success text-white hover:bg-success/90'
                                : 'bg-surface text-subtle hover:border-primary/50 hover:bg-primary-soft',
                              d === today && !done && 'border-primary/60',
                            )}
                          >
                            {done ? (
                              <Check size={14} strokeWidth={3} />
                            ) : (
                              <span className="md:hidden">{WEEKDAYS_SHORT[weekdayIndex(parseISODate(d))][0]}</span>
                            )}
                          </button>
                        )
                      })}
                    </div>

                    <div className="flex items-center justify-between gap-2 md:contents">
                      <span className="w-24 md:text-right">
                        <Badge tone={streak > 0 ? 'warning' : 'neutral'}>
                          <Flame size={12} /> {streak} {streak === 1 ? 'día' : 'días'}
                        </Badge>
                      </span>
                      <button
                        onClick={() => confirm(`¿Eliminar "${h.name}"?`) && deleteHabit(h.id)}
                        className="btn-icon hover:text-danger"
                        aria-label={`Eliminar ${h.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo hábito" description="Define un hábito para seguir a diario.">
        <HabitForm
          onCancel={() => setOpen(false)}
          onSubmit={(data) => {
            addHabit(data)
            setOpen(false)
          }}
        />
      </Modal>
    </>
  )
}

function HabitForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (d: { name: string; description: string; frequency: Frequency; category: string }) => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [frequency, setFrequency] = useState<Frequency>('daily')
  const [category, setCategory] = useState(HABIT_CATEGORIES[0])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit({ name: name.trim(), description: description.trim(), frequency, category })
  }

  const ideas = HABIT_IDEAS[category] ?? []

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Frecuencia">
          <select className="input" value={frequency} onChange={(e) => setFrequency(e.target.value as Frequency)}>
            {Object.entries(FREQUENCY_LABEL).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Categoría">
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
            {HABIT_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
      </div>
      {ideas.length > 0 && (
        <div className="rounded-lg border bg-surface-2/50 p-3">
          <p className="mb-2 text-xs font-medium text-muted">Ideas para {category.toLowerCase()} · elige una para empezar</p>
          <div className="flex flex-wrap gap-1.5">
            {ideas.map((idea) => (
              <button
                key={idea.name}
                type="button"
                onClick={() => {
                  setName(idea.name)
                  setDescription(idea.description)
                }}
                className={cn('badge border bg-surface py-1 text-muted hover:border-primary/50 hover:text-foreground', name === idea.name && 'border-primary bg-primary-soft text-primary')}
              >
                {idea.name}
              </button>
            ))}
          </div>
        </div>
      )}
      <Field label="Nombre">
        <input className="input" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Meditación matutina" />
      </Field>
      <Field label="Descripción">
        <textarea
          className="input"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="¿Por qué es importante este hábito?"
        />
      </Field>
      <FormActions onCancel={onCancel} submitLabel="Crear hábito" />
    </form>
  )
}
