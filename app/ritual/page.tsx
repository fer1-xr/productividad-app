'use client'

import Link from 'next/link'
import { useMemo, useState, type FormEvent } from 'react'
import { Check, ChevronLeft, ChevronRight, Crosshair, Flame, Heart, Moon, Sparkles, Sun, Zap } from 'lucide-react'
import { Card, CardHeader, Field, PageHeader, StatCard } from '../components/ui'
import { ScalePicker } from '../components/scale-picker'
import { useStore } from '@/lib/store'
import { mondayOf, addDaysISO, cn, daysAgo, formatDate, parseISODate, toISODate } from '@/lib/utils'
import type { DailyRitual } from '@/lib/wellbeing'

function ritualStreak(rituals: DailyRitual[]) {
  const dates = new Set(rituals.map((r) => r.date))
  let offset = dates.has(daysAgo(0)) ? 0 : 1
  let n = 0
  while (dates.has(daysAgo(offset))) {
    n++
    offset++
  }
  return n
}

export default function RitualPage() {
  const { rituals, saveRitual, weeklyGoals } = useStore()
  const today = toISODate()
  const [date, setDate] = useState(today)
  const entry = rituals.find((r) => r.date === date)

  const streak = ritualStreak(rituals)
  const last7 = rituals.filter((r) => r.date > daysAgo(7))
  const mitRate = last7.length ? Math.round((last7.filter((r) => r.mitDone).length / last7.length) * 100) : null

  // Proyectos sugeridos: metas de la semana del plan semanal (todo conectado)
  const week = mondayOf(parseISODate(date))
  const suggestions = useMemo(
    () => weeklyGoals.filter((g) => g.weekStart === week && g.title.trim()).map((g) => g.title),
    [weeklyGoals, week],
  )

  return (
    <>
      <PageHeader
        title="Ritual matutino"
        description="Unos minutos cada mañana para empezar con foco, antes de que lo urgente decida por ti."
        actions={
          <div className="flex items-center gap-1">
            <button onClick={() => setDate(addDaysISO(date, -1))} className="btn-icon h-9 w-9 border bg-surface" aria-label="Día anterior">
              <ChevronLeft size={16} />
            </button>
            <span className="min-w-[170px] px-2 text-center text-sm font-medium first-letter:uppercase">
              {date === today ? 'Hoy' : formatDate(date, { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
            <button
              onClick={() => setDate(addDaysISO(date, 1))}
              disabled={date >= today}
              className="btn-icon h-9 w-9 border bg-surface disabled:opacity-40"
              aria-label="Día siguiente"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Racha de rituales" icon={Flame} value={`${streak} ${streak === 1 ? 'día' : 'días'}`} />
        <StatCard label="Tarea más importante cumplida" icon={Crosshair} value={mitRate === null ? '—' : `${mitRate}%`} hint="últimos 7 días" />
        <StatCard
          label="Sueño y energía"
          icon={Moon}
          value={<Link href="/sleep" className="text-primary hover:underline">Ver patrones</Link>}
          hint="cómo tu descanso afecta tu energía"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <RitualForm key={date} date={date} entry={entry} suggestions={suggestions} onSave={saveRitual} />
        <RecentRituals rituals={rituals} onPick={setDate} current={date} />
      </div>
    </>
  )
}

function Step({ n, icon: Icon, title, hint, children }: { n: number; icon: typeof Sun; title: string; hint: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-4 border-b px-5 py-5 last:border-b-0 md:grid-cols-[200px_1fr]">
      <div className="flex gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary">{n}</span>
        <div>
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            <Icon size={14} className="text-subtle" /> {title}
          </p>
          <p className="mt-0.5 text-xs text-subtle">{hint}</p>
        </div>
      </div>
      <div>{children}</div>
    </section>
  )
}

function RitualForm({
  date,
  entry,
  suggestions,
  onSave,
}: {
  date: string
  entry?: DailyRitual
  suggestions: string[]
  onSave: (r: Omit<DailyRitual, 'id'>) => void
}) {
  const [sleepHours, setSleepHours] = useState(entry?.sleepHours ?? 7)
  const [sleepQuality, setSleepQuality] = useState<number | null>(entry?.sleepQuality ?? null)
  const [wakeUps, setWakeUps] = useState(entry?.wakeUps ?? 0)
  const [energyMorning, setEnergyMorning] = useState<number | null>(entry?.energyMorning ?? null)
  const [energyEvening, setEnergyEvening] = useState<number | null>(entry?.energyEvening ?? null)
  const [focus, setFocus] = useState(entry?.focus ?? '')
  const [mit, setMit] = useState(entry?.mit ?? '')
  const [mitDone, setMitDone] = useState(entry?.mitDone ?? false)
  const [gratitude, setGratitude] = useState<string[]>(entry?.gratitude?.length ? [...entry.gratitude, '', ''].slice(0, 3) : ['', '', ''])
  const [word, setWord] = useState(entry?.word ?? '')
  const [saved, setSaved] = useState(false)

  const valid = sleepQuality !== null && energyMorning !== null

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!valid) return
    onSave({
      date,
      sleepHours,
      sleepQuality: sleepQuality!,
      wakeUps,
      energyMorning: energyMorning!,
      energyEvening,
      focus: focus.trim(),
      mit: mit.trim(),
      mitDone,
      gratitude: gratitude.map((g) => g.trim()).filter(Boolean),
      word: word.trim(),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <Card className="lg:col-span-2">
      <form onSubmit={submit}>
        <Step n={1} icon={Moon} title="Descanso" hint="¿Cómo dormiste anoche?">
          <div className="grid gap-4 sm:grid-cols-[140px_140px]">
            <Field label="Horas de sueño">
              <input type="number" min={0} max={14} step={0.5} className="input tabular" value={sleepHours} onChange={(e) => setSleepHours(Number(e.target.value))} />
            </Field>
            <Field label="Despertares">
              <input type="number" min={0} max={10} className="input tabular" value={wakeUps} onChange={(e) => setWakeUps(Number(e.target.value))} />
            </Field>
          </div>
          <p className="label mt-4">Calidad del sueño</p>
          <ScalePicker label="Calidad del sueño" value={sleepQuality} onChange={setSleepQuality} />
        </Step>

        <Step n={2} icon={Zap} title="Energía" hint="¿Con cuánta energía empiezas?">
          <ScalePicker label="Energía al despertar" value={energyMorning} onChange={setEnergyMorning} />
        </Step>

        <Step n={3} icon={Crosshair} title="Foco del día" hint="Un proyecto y la tarea que, si la haces, el día habrá valido la pena">
          <div className="space-y-4">
            <Field label="Proyecto en foco">
              <input className="input" list="focus-suggestions" value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="Ej: Propuesta del proyecto" />
              <datalist id="focus-suggestions">
                {suggestions.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </Field>
            {suggestions.length > 0 && !focus && (
              <div className="-mt-2 flex flex-wrap gap-1.5">
                {suggestions.slice(0, 4).map((s) => (
                  <button key={s} type="button" onClick={() => setFocus(s)} className="badge bg-surface-2 text-muted hover:text-foreground">
                    {s}
                  </button>
                ))}
              </div>
            )}
            <Field label="Tarea más importante (MIT)">
              <div className="flex gap-2">
                <input className="input" value={mit} onChange={(e) => setMit(e.target.value)} placeholder="Ej: Terminar el borrador" />
                <button
                  type="button"
                  onClick={() => setMitDone((v) => !v)}
                  aria-pressed={mitDone}
                  className={cn('btn shrink-0 border', mitDone ? 'border-success/40 bg-success-soft text-success' : 'bg-surface text-muted')}
                >
                  <Check size={14} /> {mitDone ? 'Hecha' : 'Pendiente'}
                </button>
              </div>
            </Field>
          </div>
        </Step>

        <Step n={4} icon={Heart} title="Gratitud" hint="Tres cosas por las que hoy estás agradecido">
          <div className="space-y-2">
            {gratitude.map((g, i) => (
              <input
                key={i}
                className="input"
                value={g}
                onChange={(e) => setGratitude((all) => all.map((x, j) => (j === i ? e.target.value : x)))}
                placeholder={`${i + 1}. Estoy agradecido por…`}
                aria-label={`Gratitud ${i + 1}`}
              />
            ))}
          </div>
        </Step>

        <Step n={5} icon={Sparkles} title="Palabra del día" hint="Una palabra que guíe tu actitud">
          <input className="input sm:max-w-xs" value={word} onChange={(e) => setWord(e.target.value)} placeholder="Ej: Calma" />
        </Step>

        <Step n={6} icon={Sun} title="Cierre del día" hint="Complétalo por la noche (opcional)">
          <ScalePicker label="Energía al cerrar el día" value={energyEvening} onChange={setEnergyEvening} />
        </Step>

        <div className="flex items-center justify-end gap-3 border-t bg-surface-2/40 px-5 py-4">
          {!valid && <span className="text-xs text-subtle">Completa calidad de sueño y energía</span>}
          {saved && <span className="text-xs font-medium text-success">Ritual guardado ✓</span>}
          <button type="submit" disabled={!valid} className="btn-primary">
            {entry ? 'Actualizar ritual' : 'Guardar ritual'}
          </button>
        </div>
      </form>
    </Card>
  )
}

function RecentRituals({ rituals, onPick, current }: { rituals: DailyRitual[]; onPick: (d: string) => void; current: string }) {
  const recent = [...rituals].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8)
  return (
    <Card className="self-start">
      <CardHeader title="Rituales recientes" icon={Flame} />
      {recent.length === 0 ? (
        <p className="p-5 text-sm text-subtle">Todavía no has registrado rituales.</p>
      ) : (
        <ul className="divide-y">
          {recent.map((r) => (
            <li key={r.id}>
              <button onClick={() => onPick(r.date)} className={cn('w-full px-5 py-3 text-left hover:bg-surface-2/60', r.date === current && 'bg-primary-soft/50')}>
                <div className="flex items-center justify-between text-xs text-subtle">
                  <span className="first-letter:uppercase">{formatDate(r.date, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                  <span className="tabular">
                    {r.sleepHours} h · energía {r.energyMorning}/5
                  </span>
                </div>
                <p className={cn('mt-0.5 truncate text-sm font-medium', r.mitDone && 'text-subtle line-through')}>{r.mit || 'Sin tarea principal'}</p>
                {r.word && <p className="text-xs text-primary">“{r.word}”</p>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
