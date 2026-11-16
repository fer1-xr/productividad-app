'use client'

import Link from 'next/link'
import { AlertTriangle, CalendarClock, CheckCircle2, ChevronLeft, ChevronRight, Clock, Minus, TrendingUp } from 'lucide-react'
import { Badge } from './ui'
import {
  PERF_LEVEL_LABEL,
  perfLevel,
  performance,
  ROLE_COLOR_CLASS,
  weekLabel,
  type Performance,
  type PerfLevel,
  type Role,
  type TimeBlock,
  type WeeklyGoal,
} from '@/lib/planner'
import { addDaysISO, cn, mondayOf } from '@/lib/utils'

export function RoleDot({ role, className }: { role: Role; className?: string }) {
  return <span className={cn('inline-block h-2.5 w-2.5 shrink-0 rounded-full', ROLE_COLOR_CLASS[role.color].dot, className)} aria-hidden />
}

export function WeekNav({ weekStart, onChange }: { weekStart: string; onChange: (w: string) => void }) {
  const current = mondayOf()
  return (
    <div className="flex items-center gap-1">
      <button onClick={() => onChange(addDaysISO(weekStart, -7))} className="btn-icon h-9 w-9 border bg-surface" aria-label="Semana anterior">
        <ChevronLeft size={16} />
      </button>
      <span className="min-w-0 px-2 text-sm font-medium first-letter:uppercase sm:min-w-[250px] sm:text-center">
        {weekLabel(weekStart)}
      </span>
      <button onClick={() => onChange(addDaysISO(weekStart, 7))} className="btn-icon h-9 w-9 border bg-surface" aria-label="Semana siguiente">
        <ChevronRight size={16} />
      </button>
      {weekStart !== current && (
        <button onClick={() => onChange(current)} className="btn-secondary ml-1 py-1.5">
          Hoy
        </button>
      )}
    </div>
  )
}

const LEVEL_META: Record<PerfLevel, { tone: 'success' | 'primary' | 'warning' | 'neutral'; icon: typeof Minus }> = {
  excellent: { tone: 'success', icon: CheckCircle2 },
  on_track: { tone: 'primary', icon: TrendingUp },
  attention: { tone: 'warning', icon: AlertTriangle },
  in_progress: { tone: 'neutral', icon: Clock },
  planned: { tone: 'neutral', icon: CalendarClock },
  none: { tone: 'neutral', icon: Minus },
}

/** Estado con icono + etiqueta (nunca sólo color). */
export function PerfBadge({ perf }: { perf: Performance }) {
  const level = perfLevel(perf)
  const { tone, icon: Icon } = LEVEL_META[level]
  return (
    <Badge tone={tone}>
      <Icon size={12} /> {PERF_LEVEL_LABEL[level]}
    </Badge>
  )
}

/** Medidor de porcentaje: relleno primario sobre pista del mismo tono, con marca opcional del ritmo esperado. */
export function PctMeter({
  pct,
  label,
  className,
  expected,
}: {
  pct: number | null
  label: string
  className?: string
  /** Muestra una marca con el % esperado a la fecha (sólo semanas en curso) */
  expected?: number | null
}) {
  const showMarker = expected !== undefined && expected !== null && expected > 0 && expected < 100
  return (
    <div className={cn('relative', className)}>
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct ?? 0}
        aria-valuetext={`${pct ?? 0}%${showMarker ? `, esperado ${expected}%` : ''}`}
        className="h-2 w-full overflow-hidden rounded-full bg-primary/15"
      >
        <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${pct ?? 0}%` }} />
      </div>
      {showMarker && (
        <span
          className="absolute -top-0.5 h-3 w-0.5 -translate-x-1/2 rounded-full bg-foreground/70"
          style={{ left: `${expected}%` }}
          title={`Esperado a hoy: ${expected}%`}
          aria-hidden
        />
      )}
    </div>
  )
}

/** Lista compacta de rendimiento por rol (dashboard y plan semanal). */
export function RolePerformanceList({
  roles,
  goals,
  blocks,
  weekStart,
  columns = 2,
}: {
  roles: Role[]
  goals: WeeklyGoal[]
  blocks: TimeBlock[]
  weekStart: string
  columns?: 2 | 4
}) {
  return (
    <ul className={cn('grid gap-x-8 gap-y-4 sm:grid-cols-2', columns === 4 && 'xl:grid-cols-4')}>
      {roles.map((role) => {
        const p = performance(goals, blocks, weekStart, role.id)
        return (
          <li key={role.id}>
            <Link href="/performance" className="group block">
              <div className="mb-1.5 flex items-center gap-2 text-sm">
                <RoleDot role={role} />
                <span className="min-w-0 flex-1 truncate text-muted group-hover:text-foreground">{role.name}</span>
                <span className="tabular font-semibold">{p.pct === null ? '—' : `${p.pct}%`}</span>
              </div>
              <PctMeter pct={p.pct} expected={p.inProgress ? p.expected : undefined} label={`Rendimiento de ${role.name}`} />
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
