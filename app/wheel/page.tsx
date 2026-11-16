'use client'

import { useState } from 'react'
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, CircleDot, History, Target } from 'lucide-react'
import { Card, CardHeader, PageHeader, StatCard } from '../components/ui'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { monthKey, monthLabel, shiftMonth, WHEEL_AREAS, type WheelEntry } from '@/lib/wellbeing'

const N = WHEEL_AREAS.length
const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length

/** Radar de una o dos series (mes actual vs. anterior) sobre un único eje 0–10. */
function Radar({ current, previous }: { current: number[]; previous?: number[] }) {
  const size = 360
  const c = size / 2
  const R = 130
  const pt = (i: number, v: number) => {
    const a = (Math.PI * 2 * i) / N - Math.PI / 2
    return [c + Math.cos(a) * (R * v) / 10, c + Math.sin(a) * (R * v) / 10] as const
  }
  const poly = (vals: number[]) => vals.map((v, i) => pt(i, v).join(',')).join(' ')

  return (
    <svg viewBox={`-90 -10 ${size + 180} ${size + 20}`} className="mx-auto w-full max-w-[560px]" role="img" aria-label={`Rueda de la vida: ${WHEEL_AREAS.map((a, i) => `${a} ${current[i]}`).join(', ')}`}>
      {[2, 4, 6, 8, 10].map((lv) => (
        <polygon key={lv} points={poly(Array(N).fill(lv))} fill="none" className="stroke-border" strokeWidth={1} />
      ))}
      {WHEEL_AREAS.map((_, i) => {
        const [x, y] = pt(i, 10)
        return <line key={i} x1={c} y1={c} x2={x} y2={y} className="stroke-border" strokeWidth={1} />
      })}
      {previous && <polygon points={poly(previous)} fill="none" className="stroke-subtle" strokeWidth={2} strokeDasharray="5 4" />}
      <polygon points={poly(current)} className="fill-primary/20 stroke-primary" strokeWidth={2} strokeLinejoin="round" />
      {current.map((v, i) => {
        const [x, y] = pt(i, v)
        return (
          <circle key={i} cx={x} cy={y} r={4.5} className="fill-primary stroke-surface" strokeWidth={2}>
            <title>{`${WHEEL_AREAS[i]}: ${v}/10${previous ? ` (mes anterior ${previous[i]})` : ''}`}</title>
          </circle>
        )
      })}
      {WHEEL_AREAS.map((a, i) => {
        const [x, y] = pt(i, 11.9)
        const anchor = Math.abs(x - c) < 10 ? 'middle' : x > c ? 'start' : 'end'
        return (
          <text key={a} x={x} y={y} textAnchor={anchor} dominantBaseline="middle" className="fill-muted text-[11px]">
            {a.split(' / ')[0]}
          </text>
        )
      })}
    </svg>
  )
}

export default function WheelPage() {
  const { wheel, saveWheel } = useStore()
  const current = monthKey()
  const [month, setMonth] = useState(current)

  const entry = wheel.find((w) => w.month === month)
  const prevEntry = [...wheel].filter((w) => w.month < month).sort((a, b) => b.month.localeCompare(a.month))[0]
  const [draft, setDraft] = useState<number[]>(entry?.scores ?? prevEntry?.scores ?? Array(N).fill(5))
  const [saved, setSaved] = useState(false)

  const changeMonth = (m: string) => {
    setMonth(m)
    const e = wheel.find((w) => w.month === m)
    const p = [...wheel].filter((w) => w.month < m).sort((a, b) => b.month.localeCompare(a.month))[0]
    setDraft(e?.scores ?? p?.scores ?? Array(N).fill(5))
  }

  const save = () => {
    saveWheel({ month, scores: draft })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const balance = avg(draft)
  const lowest = draft.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v).slice(0, 2)
  const spread = Math.max(...draft) - Math.min(...draft)
  const history: WheelEntry[] = [...wheel].sort((a, b) => a.month.localeCompare(b.month)).slice(-6)

  return (
    <>
      <PageHeader
        title="Rueda de la vida"
        description="Evalúa cada mes cómo están las áreas de tu vida para decidir dónde poner tu energía."
        actions={
          <div className="flex items-center gap-1">
            <button onClick={() => changeMonth(shiftMonth(month, -1))} className="btn-icon h-9 w-9 border bg-surface" aria-label="Mes anterior">
              <ChevronLeft size={16} />
            </button>
            <span className="min-w-[160px] px-2 text-center text-sm font-medium first-letter:uppercase">{monthLabel(month)}</span>
            <button onClick={() => changeMonth(shiftMonth(month, 1))} disabled={month >= current} className="btn-icon h-9 w-9 border bg-surface disabled:opacity-40" aria-label="Mes siguiente">
              <ChevronRight size={16} />
            </button>
          </div>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Equilibrio general" icon={CircleDot} value={`${balance.toFixed(1)} / 10`} hint={prevEntry ? <Delta now={balance} prev={avg(prevEntry.scores)} /> : 'Primer mes evaluado'} />
        <StatCard label="Áreas a priorizar" icon={Target} value={<span className="text-lg">{lowest.map((l) => WHEEL_AREAS[l.i]).join(' · ')}</span>} hint="Las de menor puntaje" />
        <StatCard label="Diferencia entre áreas" value={`${spread} pts`} hint={spread <= 3 ? 'Rueda equilibrada' : 'Rueda desbalanceada: refuerza las más bajas'} />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader title="Tu rueda" description={entry ? 'Evaluación guardada' : 'Borrador: ajusta y guarda'} icon={CircleDot} />
          <div className="p-5">
            <Radar current={draft} previous={prevEntry?.scores} />
            <div className="mt-2 flex flex-wrap justify-center gap-4 text-xs text-muted">
              <span className="flex items-center gap-1.5">
                <span className="h-0.5 w-5 bg-primary" /> {monthLabel(month, { month: 'long' })}
              </span>
              {prevEntry && (
                <span className="flex items-center gap-1.5">
                  <span className="w-5 border-t-2 border-dashed border-subtle" /> {monthLabel(prevEntry.month, { month: 'long' })}
                </span>
              )}
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Evaluación del mes" description="Del 1 (muy insatisfecho) al 10 (pleno)" icon={Target} />
          <ul className="space-y-3.5 p-5">
            {WHEEL_AREAS.map((area, i) => (
              <li key={area}>
                <label className="flex items-center justify-between text-sm">
                  <span>{area}</span>
                  <span className="tabular font-semibold">
                    {draft[i]}
                    {prevEntry && draft[i] !== prevEntry.scores[i] && (
                      <span className={cn('ml-1.5 text-xs', draft[i] > prevEntry.scores[i] ? 'text-success' : 'text-danger')}>
                        {draft[i] > prevEntry.scores[i] ? '+' : '−'}
                        {Math.abs(draft[i] - prevEntry.scores[i])}
                      </span>
                    )}
                  </span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={draft[i]}
                  onChange={(e) => setDraft((d) => d.map((v, j) => (j === i ? Number(e.target.value) : v)))}
                  className="mt-1 w-full cursor-pointer accent-[rgb(var(--primary))]"
                  aria-label={`Puntaje de ${area}`}
                />
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-end gap-3 border-t px-5 py-4">
            {saved && <span className="text-xs font-medium text-success">Guardado ✓</span>}
            <button onClick={save} className="btn-primary">
              {entry ? 'Actualizar evaluación' : 'Guardar evaluación'}
            </button>
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="Evolución mensual" description="Puntaje por área en los últimos meses evaluados" icon={History} />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b text-xs text-subtle">
                <th className="px-5 py-2.5 text-left font-medium">Área</th>
                {history.map((h) => (
                  <th key={h.month} className={cn('px-2 py-2.5 text-center font-medium capitalize', h.month === month && 'text-primary')}>
                    {monthLabel(h.month, { month: 'short', year: '2-digit' })}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {WHEEL_AREAS.map((area, i) => (
                <tr key={area}>
                  <td className="px-5 py-2">{area}</td>
                  {history.map((h) => (
                    <td key={h.month} className="px-1 py-1.5">
                      <span
                        className={cn(
                          'tabular mx-auto flex h-7 max-w-[56px] items-center justify-center rounded-md text-xs font-medium',
                          h.scores[i] >= 8 ? 'bg-primary/80 text-white' : h.scores[i] >= 6 ? 'bg-primary/45' : h.scores[i] >= 4 ? 'bg-primary/20' : 'bg-primary/10',
                        )}
                      >
                        {h.scores[i]}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="bg-surface-2/50 font-semibold">
                <td className="px-5 py-2.5">Promedio</td>
                {history.map((h) => (
                  <td key={h.month} className="tabular px-1 py-2.5 text-center text-xs">
                    {avg(h.scores).toFixed(1)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}

function Delta({ now, prev }: { now: number; prev: number }) {
  const d = Math.round((now - prev) * 10) / 10
  if (d === 0) return <span>Igual que el mes anterior</span>
  return (
    <span className={cn('inline-flex items-center gap-0.5', d > 0 ? 'text-success' : 'text-danger')}>
      {d > 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
      {d > 0 ? '+' : '−'}
      {Math.abs(d)} vs. mes anterior
    </span>
  )
}
