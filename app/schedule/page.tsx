'use client'

import { useState, type FormEvent } from 'react'
import { CalendarDays, Plus, Trash2 } from 'lucide-react'
import { Card, Field, FormActions, Modal, PageHeader } from '../components/ui'
import { EVENT_COLOR_CLASS, EVENT_COLORS, useStore, type EventColor, type ScheduleItem } from '@/lib/store'
import { cn, WEEKDAYS, WEEKDAYS_SHORT, weekdayIndex } from '@/lib/utils'
import { useOpenFromQuery } from '@/lib/use-open-from-query'

function minutes(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function duration(e: ScheduleItem) {
  const d = minutes(e.endTime) - minutes(e.startTime)
  if (d <= 0) return ''
  const h = Math.floor(d / 60)
  const m = d % 60
  return h ? `${h} h${m ? ` ${m} min` : ''}` : `${m} min`
}

function EventCard({ e }: { e: ScheduleItem }) {
  const deleteScheduleItem = useStore((s) => s.deleteScheduleItem)
  return (
    <div
      className={cn(
        'group relative rounded-lg border-l-[3px] px-3 py-2',
        EVENT_COLOR_CLASS[e.color].bar,
        EVENT_COLOR_CLASS[e.color].soft,
      )}
    >
      <p className="pr-6 text-sm font-medium leading-snug">{e.title}</p>
      <p className="tabular mt-0.5 text-xs text-muted">
        {e.startTime} – {e.endTime}
      </p>
      <p className="text-[11px] text-subtle">{duration(e)}</p>
      <button
        onClick={() => confirm(`¿Eliminar "${e.title}"?`) && deleteScheduleItem(e.id)}
        className="btn-icon absolute right-1 top-1 h-6 w-6 hover:text-danger lg:opacity-0 lg:group-hover:opacity-100 lg:focus:opacity-100"
        aria-label={`Eliminar ${e.title}`}
      >
        <Trash2 size={13} />
      </button>
    </div>
  )
}

export default function SchedulePage() {
  const { schedule, addScheduleItem } = useStore()
  const today = weekdayIndex()
  const [selectedDay, setSelectedDay] = useState(today)
  const [open, setOpen] = useState(false)
  const [formDay, setFormDay] = useState(today)
  useOpenFromQuery(() => setOpen(true))

  const byDay = (day: number) =>
    schedule.filter((e) => e.day === day).sort((a, b) => a.startTime.localeCompare(b.startTime))

  const openFor = (day: number) => {
    setFormDay(day)
    setOpen(true)
  }

  const totalHours = Math.round(
    schedule.reduce((s, e) => s + Math.max(0, minutes(e.endTime) - minutes(e.startTime)), 0) / 60,
  )

  return (
    <>
      <PageHeader
        title="Cronograma"
        description={`${schedule.length} eventos semanales · ${totalHours} h planificadas`}
        actions={
          <button onClick={() => openFor(selectedDay)} className="btn-primary">
            <Plus size={16} /> Nuevo evento
          </button>
        }
      />

      {/* Móvil / tablet: selector de día */}
      <div className="lg:hidden">
        <div className="mb-4 grid grid-cols-7 gap-1 rounded-xl border bg-surface p-1">
          {WEEKDAYS_SHORT.map((d, i) => (
            <button
              key={d}
              onClick={() => setSelectedDay(i)}
              aria-pressed={selectedDay === i}
              className={cn(
                'relative rounded-lg py-2 text-xs font-medium transition-colors',
                selectedDay === i ? 'bg-primary text-primary-foreground' : 'text-muted hover:bg-surface-2',
              )}
            >
              {d}
              {i === today && selectedDay !== i && (
                <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </div>
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">
              {WEEKDAYS[selectedDay]} {selectedDay === today && <span className="font-normal text-primary">· Hoy</span>}
            </h2>
            <span className="text-xs text-subtle">{byDay(selectedDay).length} eventos</span>
          </div>
          {byDay(selectedDay).length === 0 ? (
            <button onClick={() => openFor(selectedDay)} className="btn-ghost w-full border border-dashed py-6">
              <Plus size={16} /> Añadir evento
            </button>
          ) : (
            <div className="space-y-2">
              {byDay(selectedDay).map((e) => (
                <EventCard key={e.id} e={e} />
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Escritorio: semana completa */}
      <div className="hidden overflow-hidden rounded-xl border bg-surface shadow-card lg:grid lg:grid-cols-7 lg:divide-x">
        {WEEKDAYS.map((day, i) => {
          const items = byDay(i)
          const isToday = i === today
          return (
            <div key={day} className={cn('flex min-h-[420px] flex-col', isToday && 'bg-primary-soft/40')}>
              <div className="flex items-center justify-between border-b px-3 py-3">
                <span className={cn('text-sm font-semibold', isToday && 'text-primary')}>{WEEKDAYS_SHORT[i]}</span>
                {isToday ? (
                  <span className="rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary-foreground">
                    Hoy
                  </span>
                ) : (
                  <span className="text-xs text-subtle">{items.length || ''}</span>
                )}
              </div>
              <div className="flex-1 space-y-2 p-2">
                {items.map((e) => (
                  <EventCard key={e.id} e={e} />
                ))}
              </div>
              <button
                onClick={() => openFor(i)}
                className="m-2 flex items-center justify-center gap-1 rounded-lg border border-dashed py-1.5 text-xs text-subtle transition-colors hover:border-primary/50 hover:text-primary"
                aria-label={`Añadir evento el ${day}`}
              >
                <Plus size={12} /> Añadir
              </button>
            </div>
          )
        })}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo evento" description="Se repetirá cada semana.">
        <EventForm
          key={`${formDay}-${open}`}
          initialDay={formDay}
          onCancel={() => setOpen(false)}
          onSubmit={(item) => {
            addScheduleItem(item)
            setSelectedDay(item.day)
            setOpen(false)
          }}
        />
      </Modal>
    </>
  )
}

function EventForm({
  initialDay,
  onSubmit,
  onCancel,
}: {
  initialDay: number
  onSubmit: (s: Omit<ScheduleItem, 'id'>) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState('')
  const [day, setDay] = useState(initialDay)
  const [startTime, setStart] = useState('09:00')
  const [endTime, setEnd] = useState('10:00')
  const [color, setColor] = useState<EventColor>(1)
  const invalid = endTime <= startTime

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim() || invalid) return
    onSubmit({ title: title.trim(), day, startTime, endTime, color })
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Título">
        <input className="input" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Reunión de equipo" />
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
          <input className="input" type="time" required value={startTime} onChange={(e) => setStart(e.target.value)} />
        </Field>
        <Field label="Fin">
          <input
            className={cn('input', invalid && 'border-danger focus:border-danger')}
            type="time"
            required
            value={endTime}
            onChange={(e) => setEnd(e.target.value)}
          />
        </Field>
      </div>
      {invalid && <p className="-mt-2 text-xs text-danger">La hora de fin debe ser posterior a la de inicio.</p>}
      <fieldset>
        <legend className="label">Color</legend>
        <div className="flex flex-wrap gap-2">
          {EVENT_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setColor(c.value)}
              aria-pressed={color === c.value}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors',
                color === c.value ? 'border-foreground/40 bg-surface-2' : 'text-muted hover:bg-surface-2',
              )}
            >
              <span className={cn('h-3 w-3 rounded-full', EVENT_COLOR_CLASS[c.value].dot)} />
              {c.label}
            </button>
          ))}
        </div>
      </fieldset>
      <FormActions onCancel={onCancel} submitLabel="Crear evento" />
    </form>
  )
}
