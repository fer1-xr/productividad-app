'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowDown, ArrowUp, CalendarRange, CheckCircle2, Gauge, ListChecks, Scale } from 'lucide-react'
import { Card, CardHeader, PageHeader, StatCard } from '../components/ui'
import { PctMeter, PerfBadge, RoleDot, WeekNav } from '../components/planner-ui'
import { performance, perfLevel, type Performance } from '@/lib/planner'
import { useStore } from '@/lib/store'
import { addDaysISO, cn, formatDate, mondayOf } from '@/lib/utils'

const HISTORY_WEEKS = 6

/** Rampa secuencial de un solo tono (claro → oscuro) para la tabla histórica. */
function heatClass(pct: number | null) {
  if (pct === null) return 'bg-transparent text-subtle'
  if (pct >= 80) return 'bg-primary/85 text-white'
  if (pct >= 60) return 'bg-primary/60 text-white'
  if (pct >= 40) return 'bg-primary/35 text-foreground'
  if (pct >= 20) return 'bg-primary/20 text-foreground'
  return 'bg-primary/10 text-foreground'
}

function fmt(pct: number | null) {
  return pct === null ? '—' : `${pct}%`
}

export default function PerformancePage() {
  const { roles, weeklyGoals, blocks } = useStore()
  const [weekStart, setWeekStart] = useState(mondayOf())

  const overall = performance(weeklyGoals, blocks, weekStart)
  const prevOverall = performance(weeklyGoals, blocks, addDaysISO(weekStart, -7))

  const rows = roles.map((role) => ({
    role,
    perf: performance(weeklyGoals, blocks, weekStart, role.id),
    prev: performance(weeklyGoals, blocks, addDaysISO(weekStart, -7), role.id),
  }))
  // Comparar contra lo esperado a la fecha: justo en semanas en curso
  const ratio = (p: Performance) => (p.pct === null || !p.expected ? null : p.pct / p.expected)
  const planned = rows.filter((r) => ratio(r.perf) !== null)
  const strongest = [...planned].sort((a, b) => ratio(b.perf)! - ratio(a.perf)!)[0]
  const needsWork = rows.filter((r) => perfLevel(r.perf) === 'attention').sort((a, b) => ratio(a.perf)! - ratio(b.perf)!)[0]
  const unplanned = rows.filter((r) => r.perf.pct === null)
  const balanced = rows.filter((r) => ['excellent', 'on_track'].includes(perfLevel(r.perf))).length

  const weeks = Array.from({ length: HISTORY_WEEKS }, (_, i) => addDaysISO(weekStart, -7 * (HISTORY_WEEKS - 1 - i)))

  return (
    <>
      <PageHeader
        title="Rendimiento por rol"
        description="Mide tu efectividad y equilibrio entre los roles de tu vida."
        actions={<WeekNav weekStart={weekStart} onChange={setWeekStart} />}
      />

      {/* KPIs */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Rendimiento global" icon={Gauge} value={fmt(overall.pct)} hint={<Delta perf={overall} prev={prevOverall} />}>
          <PctMeter pct={overall.pct} expected={overall.inProgress ? overall.expected : undefined} label="Rendimiento global" className="mt-3" />
        </StatCard>
        <StatCard
          label="Metas cumplidas"
          icon={CheckCircle2}
          value={`${overall.goalsDone} / ${overall.goalsTotal}`}
          hint={`${overall.tasksDone} de ${overall.tasksTotal} tareas completadas`}
        />
        <StatCard
          label="Bloques cumplidos"
          icon={CalendarRange}
          value={`${overall.blocksDone} / ${overall.blocksTotal}`}
          hint="Tiempo programado que respetaste"
        />
        <StatCard
          label="Equilibrio"
          icon={Scale}
          value={`${balanced} / ${roles.length}`}
          hint="roles excelentes o en camino"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Por rol esta semana */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Semana por rol"
            description={
              overall.inProgress
                ? `Semana en curso · la marca indica lo esperado a hoy (${overall.expected}%)`
                : 'Tareas completadas + bloques cumplidos sobre lo planificado'
            }
            icon={ListChecks}
          />
          <ul className="divide-y">
            {rows.map(({ role, perf, prev }) => (
              <li key={role.id} className="grid gap-2 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-6">
                <div className="min-w-0">
                  <div className="mb-2 flex items-center gap-2">
                    <RoleDot role={role} />
                    <span className="truncate text-sm font-medium">{role.name}</span>
                  </div>
                  <PctMeter pct={perf.pct} expected={perf.inProgress ? perf.expected : undefined} label={`Rendimiento de ${role.name}`} />
                  <p className="mt-1.5 text-xs text-subtle">
                    <Breakdown perf={perf} />
                  </p>
                </div>
                <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-1">
                  <span className="tabular text-xl font-semibold">{fmt(perf.pct)}</span>
                  <span className="text-xs">
                    <Delta perf={perf} prev={prev} />
                  </span>
                  <PerfBadge perf={perf} />
                </div>
              </li>
            ))}
          </ul>
        </Card>

        {/* Análisis */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="Análisis de la semana" icon={Scale} />
            <dl className="divide-y text-sm">
              <Insight label="Rol más fuerte" value={strongest ? `${strongest.role.name} · ${strongest.perf.pct}%` : '—'} />
              <Insight
                label="Rol a reforzar"
                value={needsWork ? `${needsWork.role.name} · ${needsWork.perf.pct}%` : 'Ninguno por ahora'}
              />
              <Insight
                label="Sin planificar"
                value={unplanned.length ? unplanned.map((r) => r.role.name).join(', ') : 'Todos los roles tienen metas'}
              />
            </dl>
          </Card>
          <Card className="p-5">
            <p className="text-sm font-semibold">Equilibrio, no perfección</p>
            <p className="mt-1.5 text-sm leading-6 text-muted">
              Covey propone avanzar en todos tus roles cada semana. Un 100% en el trabajo con 0% en la familia no es
              efectividad: refuerza primero los roles más bajos y vuelve a planificar en tu{' '}
              <Link href="/schedule" className="font-medium text-primary hover:underline">
                plan semanal
              </Link>
              .
            </p>
          </Card>
        </div>
      </div>

      {/* Historial */}
      <Card className="mt-6">
        <CardHeader title={`Evolución · últimas ${HISTORY_WEEKS} semanas`} description="Porcentaje de cumplimiento por rol y semana" icon={CalendarRange} />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b text-xs text-subtle">
                <th className="px-5 py-2.5 text-left font-medium">Rol</th>
                {weeks.map((w) => (
                  <th key={w} className={cn('px-2 py-2.5 text-center font-medium', w === weekStart && 'text-primary')}>
                    {formatDate(w)}
                    {w === mondayOf() && <span className="block text-[10px] font-normal">en curso</span>}
                  </th>
                ))}
                <th className="px-5 py-2.5 text-right font-medium">Promedio</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {roles.map((role) => {
                const series = weeks.map((w) => performance(weeklyGoals, blocks, w, role.id).pct)
                const valid = series.filter((x): x is number => x !== null)
                const avg = valid.length ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length) : null
                return (
                  <tr key={role.id}>
                    <td className="px-5 py-2">
                      <span className="flex items-center gap-2">
                        <RoleDot role={role} />
                        <span className="truncate">{role.name}</span>
                      </span>
                    </td>
                    {series.map((pct, i) => (
                      <td key={weeks[i]} className="px-1 py-1.5">
                        <span
                          className={cn('tabular flex h-8 items-center justify-center rounded-md text-xs font-medium', heatClass(pct))}
                          title={`${role.name} · semana del ${formatDate(weeks[i])}: ${fmt(pct)}`}
                        >
                          {fmt(pct)}
                        </span>
                      </td>
                    ))}
                    <td className="tabular px-5 py-2 text-right font-semibold">{fmt(avg)}</td>
                  </tr>
                )
              })}
              <tr className="bg-surface-2/50 font-semibold">
                <td className="px-5 py-2.5">Global</td>
                {weeks.map((w) => (
                  <td key={w} className="tabular px-1 py-2.5 text-center text-xs">
                    {fmt(performance(weeklyGoals, blocks, w).pct)}
                  </td>
                ))}
                <td className="px-5 py-2.5" />
              </tr>
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center gap-3 border-t px-5 py-3 text-xs text-subtle">
          <span>Escala:</span>
          {[
            ['0–19%', 10],
            ['20–39%', 30],
            ['40–59%', 50],
            ['60–79%', 70],
            ['80–100%', 90],
          ].map(([label, v]) => (
            <span key={label} className="flex items-center gap-1.5">
              <span className={cn('h-3 w-5 rounded-sm', heatClass(v as number))} aria-hidden />
              {label}
            </span>
          ))}
        </div>
      </Card>
    </>
  )
}

function Breakdown({ perf }: { perf: Performance }) {
  if (perf.total === 0) return <>Sin metas ni bloques esta semana</>
  return (
    <>
      {perf.tasksDone}/{perf.tasksTotal} tareas · {perf.blocksDone}/{perf.blocksTotal} bloques · {perf.goalsDone}/{perf.goalsTotal} metas cumplidas
    </>
  )
}

function Delta({ perf, prev }: { perf: Performance; prev: Performance }) {
  if (perf.inProgress) return <span className="text-subtle">Esperado a hoy: {fmt(perf.expected)}</span>
  if (perf.pct === null || prev.pct === null) return <span className="text-subtle">Sin comparación</span>
  const d = perf.pct - prev.pct
  if (d === 0) return <span className="text-subtle">Igual que la semana anterior</span>
  const up = d > 0
  return (
    <span className={cn('inline-flex items-center gap-0.5', up ? 'text-success' : 'text-danger')}>
      {up ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
      {up ? '+' : '−'}
      {Math.abs(d)} pts vs. semana anterior
    </span>
  )
}

function Insight({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-5 py-3">
      <dt className="text-xs text-subtle">{label}</dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  )
}
