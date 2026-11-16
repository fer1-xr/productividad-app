'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, CalendarCheck, Check, Flame, Percent, Trophy } from 'lucide-react'
import { Badge, Card, CardHeader, EmptyState, PageHeader, Segmented, StatCard } from '../../components/ui'
import { FREQUENCY_LABEL, habitStreak, useStore, type Habit } from '@/lib/store'
import { addDaysISO, cn, daysAgo, formatDate, mondayOf, parseISODate, toISODate, WEEKDAYS, WEEKDAYS_SHORT, weekdayIndex } from '@/lib/utils'

type Scale = 'days' | 'weeks' | 'months'

function bestStreak(h: Habit) {
  const sorted = [...new Set(h.completions)].sort()
  let best = 0
  let run = 0
  let prev: string | null = null
  for (const d of sorted) {
    run = prev && addDaysISO(prev, 1) === d ? run + 1 : 1
    best = Math.max(best, run)
    prev = d
  }
  return best
}

function rate(h: Habit, from: string, to: string) {
  const start = from < h.createdAt ? h.createdAt : from
  if (start > to) return null
  let total = 0
  let done = 0
  const set = new Set(h.completions)
  for (let d = start; d <= to; d = addDaysISO(d, 1)) {
    total++
    if (set.has(d)) done++
  }
  return total ? Math.round((done / total) * 100) : null
}

/** Barras de porcentaje (un solo eje 0–100%). */
function PctBars({ data }: { data: { label: string; title: string; pct: number | null; current?: boolean }[] }) {
  const H = 160
  return (
    <div>
      <div className="relative" style={{ height: H }}>
        {[25, 50, 75, 100].map((g) => (
          <div key={g} className="absolute inset-x-0 border-t border-border/60" style={{ bottom: (g / 100) * H }} aria-hidden>
            <span className="absolute -top-2 left-0 bg-surface pr-1 text-[10px] text-subtle">{g}%</span>
          </div>
        ))}
        <div className="absolute inset-0 left-8 flex items-end gap-1 border-b">
          {data.map((d) => (
            <div key={d.label + d.title} className="group relative flex h-full flex-1 items-end justify-center" title={`${d.title}: ${d.pct === null ? 'sin datos' : `${d.pct}%`}`}>
              {d.pct !== null ? (
                <div className={cn('w-full max-w-[24px] rounded-t-[4px]', d.current ? 'bg-primary/60' : 'bg-primary')} style={{ height: `${Math.max(d.pct, 1)}%` }} />
              ) : (
                <div className="h-1 w-full max-w-[24px] rounded-full bg-border" />
              )}
              <span className="pointer-events-none absolute -top-7 z-10 hidden whitespace-nowrap rounded-md border bg-surface px-2 py-1 text-[11px] shadow-pop group-hover:block">
                {d.title}: {d.pct === null ? 'sin datos' : `${d.pct}%`}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="ml-8 mt-1.5 flex gap-1">
        {data.map((d, i) => (
          <span key={d.label + i} className="flex-1 truncate text-center text-[10px] text-subtle">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function HabitDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { habits, toggleHabit } = useStore()
  const habit = habits.find((h) => h.id === id)
  const [scale, setScale] = useState<Scale>('weeks')

  if (!habit) {
    return (
      <Card>
        <EmptyState icon={CalendarCheck} title="Hábito no encontrado" action={<Link href="/habits" className="btn-primary">Volver a hábitos</Link>} />
      </Card>
    )
  }

  const today = toISODate()
  const set = new Set(habit.completions)
  const streak = habitStreak(habit)
  const best = bestStreak(habit)
  const r30 = rate(habit, daysAgo(29), today)
  const r90 = rate(habit, daysAgo(89), today)

  // Serie según escala
  let series: { label: string; title: string; pct: number | null; current?: boolean }[] = []
  if (scale === 'days') {
    series = Array.from({ length: 30 }, (_, i) => {
      const d = daysAgo(29 - i)
      const valid = d >= habit.createdAt
      return {
        label: i % 5 === 4 || i === 29 ? String(parseISODate(d).getDate()) : '',
        title: formatDate(d, { weekday: 'short', day: 'numeric', month: 'short' }),
        pct: valid ? (set.has(d) ? 100 : 0) : null,
        current: d === today,
      }
    })
  } else if (scale === 'weeks') {
    const thisMonday = mondayOf()
    series = Array.from({ length: 12 }, (_, i) => {
      const start = addDaysISO(thisMonday, -7 * (11 - i))
      const end = i === 11 ? today : addDaysISO(start, 6)
      return { label: formatDate(start), title: `Semana del ${formatDate(start)}`, pct: rate(habit, start, end), current: i === 11 }
    })
  } else {
    const now = new Date()
    series = Array.from({ length: 12 }, (_, i) => {
      const first = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1)
      const last = i === 11 ? now : new Date(first.getFullYear(), first.getMonth() + 1, 0)
      const label = first.toLocaleDateString('es', { month: 'short' })
      return { label, title: first.toLocaleDateString('es', { month: 'long', year: 'numeric' }), pct: rate(habit, toISODate(first), toISODate(last)), current: i === 11 }
    })
  }

  // Por día de la semana (últimos 90 días)
  const byWeekday = WEEKDAYS.map((name, wd) => {
    let total = 0
    let done = 0
    for (let i = 0; i < 90; i++) {
      const d = daysAgo(i)
      if (d < habit.createdAt || weekdayIndex(parseISODate(d)) !== wd) continue
      total++
      if (set.has(d)) done++
    }
    return { label: WEEKDAYS_SHORT[wd], title: name, pct: total ? Math.round((done / total) * 100) : null }
  })
  const bestDay = [...byWeekday].filter((d) => d.pct !== null).sort((a, b) => b.pct! - a.pct!)[0]
  const worstDay = [...byWeekday].filter((d) => d.pct !== null).sort((a, b) => a.pct! - b.pct!)[0]

  // Mapa de calor: últimas 20 semanas
  const WEEKS = 20
  const gridStart = addDaysISO(mondayOf(), -7 * (WEEKS - 1))

  return (
    <>
      <Link href="/habits" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <ArrowLeft size={14} /> Hábitos
      </Link>
      <PageHeader
        title={habit.name}
        description={habit.description}
        actions={
          <button
            onClick={() => toggleHabit(habit.id)}
            aria-pressed={set.has(today)}
            className={cn('btn border', set.has(today) ? 'border-success/40 bg-success-soft text-success' : 'btn-primary')}
          >
            <Check size={16} /> {set.has(today) ? 'Hecho hoy' : 'Marcar hoy'}
          </button>
        }
      />
      <div className="mb-6 -mt-3 flex gap-2">
        <Badge>{habit.category}</Badge>
        <Badge tone="primary">{FREQUENCY_LABEL[habit.frequency]}</Badge>
        <Badge>Desde {formatDate(habit.createdAt, { day: 'numeric', month: 'short', year: 'numeric' })}</Badge>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Racha actual" icon={Flame} value={`${streak} ${streak === 1 ? 'día' : 'días'}`} />
        <StatCard label="Mejor racha" icon={Trophy} value={`${best} ${best === 1 ? 'día' : 'días'}`} />
        <StatCard label="Cumplimiento 30 días" icon={Percent} value={r30 === null ? '—' : `${r30}%`} hint={r90 === null ? undefined : `90 días: ${r90}%`} />
        <StatCard label="Veces completado" icon={CalendarCheck} value={habit.completions.length} hint="en total" />
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold">Cumplimiento en el tiempo</h2>
              <p className="text-xs text-subtle">Porcentaje de días cumplidos por período (el último, más claro, está en curso)</p>
            </div>
            <Segmented
              ariaLabel="Escala"
              value={scale}
              onChange={setScale}
              options={[
                { value: 'days', label: '30 días' },
                { value: 'weeks', label: '12 semanas' },
                { value: 'months', label: '12 meses' },
              ]}
            />
          </div>
          <div className="p-5 pt-7">
            <PctBars data={series} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Por día de la semana" description="Últimos 90 días" />
          <div className="p-5 pt-7">
            <PctBars data={byWeekday} />
            {bestDay && worstDay && bestDay !== worstDay && (
              <p className="mt-4 text-xs text-muted">
                Tu mejor día es el <span className="font-medium text-foreground">{bestDay.title.toLowerCase()}</span> ({bestDay.pct}%) y el más difícil el{' '}
                <span className="font-medium text-foreground">{worstDay.title.toLowerCase()}</span> ({worstDay.pct}%).
              </p>
            )}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Calendario de constancia" description={`Últimas ${WEEKS} semanas · haz clic en un día para marcarlo o desmarcarlo`} icon={CalendarCheck} />
        <div className="overflow-x-auto p-5">
          <div className="flex gap-1">
            <div className="mr-1 grid grid-rows-7 gap-1 text-[10px] text-subtle">
              {WEEKDAYS_SHORT.map((d, i) => (
                <span key={d} className="flex h-4 items-center">{i % 2 === 0 ? d : ''}</span>
              ))}
            </div>
            {Array.from({ length: WEEKS }, (_, w) => (
              <div key={w} className="grid grid-rows-7 gap-1">
                {Array.from({ length: 7 }, (_, d) => {
                  const date = addDaysISO(gridStart, w * 7 + d)
                  const future = date > today
                  const before = date < habit.createdAt
                  const done = set.has(date)
                  return (
                    <button
                      key={date}
                      disabled={future}
                      onClick={() => toggleHabit(habit.id, date)}
                      title={`${formatDate(date, { weekday: 'long', day: 'numeric', month: 'long' })}: ${done ? 'cumplido' : future ? '' : 'no cumplido'}`}
                      aria-label={`${formatDate(date, { weekday: 'long', day: 'numeric', month: 'long' })}, ${done ? 'cumplido' : 'no cumplido'}`}
                      aria-pressed={done}
                      className={cn(
                        'h-4 w-4 rounded-[3px] transition-colors',
                        future ? 'invisible' : done ? 'bg-primary hover:bg-primary/80' : before ? 'bg-surface-2/50' : 'bg-surface-2 hover:bg-primary/30',
                        date === today && 'ring-2 ring-foreground/50 ring-offset-1 ring-offset-surface',
                      )}
                    />
                  )
                })}
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-3 text-[11px] text-subtle">
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-[3px] bg-surface-2" /> No cumplido</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-[3px] bg-primary" /> Cumplido</span>
          </div>
        </div>
      </Card>
    </>
  )
}
