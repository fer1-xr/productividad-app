'use client'

import Link from 'next/link'
import { useState } from 'react'
import { BedDouble, Lightbulb, Moon, Sunrise, Watch, Zap } from 'lucide-react'
import { WatchImportModal } from './watch-import'
import { Card, CardHeader, EmptyState, PageHeader, Segmented, StatCard } from '../components/ui'
import { useStore } from '@/lib/store'
import { cn, daysAgo, formatDate, parseISODate, WEEKDAYS_SHORT, weekdayIndex } from '@/lib/utils'
import type { DailyRitual } from '@/lib/wellbeing'

const TARGET_HOURS = 7
type Range = '14' | '30'

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null)
const fmt1 = (n: number | null) => (n === null ? '—' : n.toLocaleString('es', { maximumFractionDigits: 1 }))

/** Gráfico de barras simple (una sola serie, un solo eje). */
function BarChart({
  days,
  value,
  max,
  unit,
  target,
  label,
}: {
  days: { date: string; r?: DailyRitual }[]
  value: (r: DailyRitual) => number | null
  max: number
  unit: string
  target?: number
  label: string
}) {
  const H = 140
  return (
    <figure aria-label={label}>
      <div className="relative" style={{ height: H }}>
        {/* Líneas de grilla */}
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <div key={f} className="absolute inset-x-0 border-t border-border/60" style={{ bottom: f * H }} aria-hidden />
        ))}
        {target !== undefined && (
          <div className="absolute inset-x-0 border-t-2 border-dashed border-foreground/40" style={{ bottom: (target / max) * H }} aria-hidden>
            <span className="absolute -top-5 right-0 rounded bg-surface px-1 text-[10px] text-muted">Meta {target} {unit}</span>
          </div>
        )}
        <div className="absolute inset-0 flex items-end gap-0.5 border-b border-border">
          {days.map(({ date, r }) => {
            const v = r ? value(r) : null
            const text = `${formatDate(date, { weekday: 'short', day: 'numeric' })}: ${v === null ? 'sin registro' : `${fmt1(v)} ${unit}`}`
            return (
              <div key={date} className="group relative flex h-full flex-1 items-end justify-center" title={text}>
                {v !== null ? (
                  <div
                    className={cn('w-full max-w-[18px] rounded-t-[4px] bg-primary transition-opacity group-hover:opacity-80', target !== undefined && v < target && 'bg-primary/45')}
                    style={{ height: `${(v / max) * 100}%` }}
                  />
                ) : (
                  <div className="h-1 w-full max-w-[18px] rounded-full bg-border" />
                )}
                <span className="pointer-events-none absolute -top-7 z-10 hidden whitespace-nowrap rounded-md border bg-surface px-2 py-1 text-[11px] shadow-pop group-hover:block">
                  {text}
                </span>
              </div>
            )
          })}
        </div>
      </div>
      <div className="mt-1.5 flex gap-0.5">
        {days.map(({ date }, i) => (
          <span key={date} className="flex-1 text-center text-[10px] text-subtle">
            {days.length <= 14 || i % 3 === 0 ? WEEKDAYS_SHORT[weekdayIndex(parseISODate(date))][0] + parseISODate(date).getDate() : ''}
          </span>
        ))}
      </div>
    </figure>
  )
}

export default function SleepPage() {
  const { rituals } = useStore()
  const [range, setRange] = useState<Range>('14')
  const [importOpen, setImportOpen] = useState(false)
  const n = Number(range)

  const byDate = new Map(rituals.map((r) => [r.date, r]))
  const days = Array.from({ length: n }, (_, i) => {
    const date = daysAgo(n - i)
    return { date, r: byDate.get(date) }
  })
  // incluir hoy si ya hay registro
  if (byDate.has(daysAgo(0))) days.push({ date: daysAgo(0), r: byDate.get(daysAgo(0)) })

  const logged = days.map((d) => d.r).filter((r): r is DailyRitual => !!r)
  const avgHours = avg(logged.map((r) => r.sleepHours))
  const avgQuality = avg(logged.map((r) => r.sleepQuality))
  const withEnergy = logged.filter((r): r is DailyRitual & { energyMorning: number } => r.energyMorning !== null)
  const avgEnergy = avg(withEnergy.map((r) => r.energyMorning))
  const goodNights = logged.length ? Math.round((logged.filter((r) => r.sleepHours >= TARGET_HOURS).length / logged.length) * 100) : null

  // Patrones
  const enough = withEnergy.filter((r) => r.sleepHours >= TARGET_HOURS)
  const short = withEnergy.filter((r) => r.sleepHours < TARGET_HOURS)
  const eEnough = avg(enough.map((r) => r.energyMorning))
  const eShort = avg(short.map((r) => r.energyMorning))
  const calm = logged.filter((r) => r.wakeUps === 0)
  const restless = logged.filter((r) => r.wakeUps > 0)
  const qCalm = avg(calm.map((r) => r.sleepQuality))
  const qRestless = avg(restless.map((r) => r.sleepQuality))
  const mitWithEnergy = withEnergy.filter((r) => r.energyMorning >= 4)
  const mitLowEnergy = withEnergy.filter((r) => r.energyMorning <= 2)
  const pct = (xs: DailyRitual[]) => (xs.length ? Math.round((xs.filter((r) => r.mitDone).length / xs.length) * 100) : null)

  const patterns = [
    eEnough !== null && eShort !== null && {
      title: `Durmiendo ${TARGET_HOURS} h o más, tu energía es ${eEnough > eShort ? 'mayor' : 'similar'}`,
      text: `Energía media al despertar: ${fmt1(eEnough)}/5 con ≥${TARGET_HOURS} h vs. ${fmt1(eShort)}/5 con menos horas.`,
    },
    qCalm !== null && qRestless !== null && {
      title: 'Los despertares afectan la calidad',
      text: `Calidad media: ${fmt1(qCalm)}/5 en noches sin despertares vs. ${fmt1(qRestless)}/5 cuando te despertaste.`,
    },
    pct(mitWithEnergy) !== null && pct(mitLowEnergy) !== null && {
      title: 'La energía impulsa tu tarea más importante',
      text: `Cumpliste tu MIT el ${pct(mitWithEnergy)}% de los días con energía alta y el ${pct(mitLowEnergy)}% con energía baja.`,
    },
  ].filter(Boolean) as { title: string; text: string }[]

  return (
    <>
      <PageHeader
        title="Sueño y energía"
        description="Cómo duermes, cómo te sientes y qué los une. Los datos salen de tu ritual matutino."
        actions={
          <>
            <Segmented ariaLabel="Período" value={range} onChange={setRange} options={[{ value: '14', label: '14 días' }, { value: '30', label: '30 días' }]} />
            <button onClick={() => setImportOpen(true)} className="btn-secondary">
              <Watch size={16} /> Importar del reloj
            </button>
            <Link href="/ritual" className="btn-primary">
              <Sunrise size={16} /> Registrar hoy
            </Link>
          </>
        }
      />

      {logged.length === 0 ? (
        <Card>
          <EmptyState icon={Moon} title="Sin registros todavía" description="Completa tu ritual matutino para ver tus patrones de sueño y energía." action={<Link href="/ritual" className="btn-primary">Ir al ritual</Link>} />
        </Card>
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Horas de sueño promedio" icon={BedDouble} value={`${fmt1(avgHours)} h`} hint={`${logged.length} noches registradas`} />
            <StatCard label="Calidad promedio" icon={Moon} value={`${fmt1(avgQuality)} / 5`} />
            <StatCard label="Energía al despertar" icon={Zap} value={`${fmt1(avgEnergy)} / 5`} />
            <StatCard label={`Noches de ${TARGET_HOURS} h o más`} icon={Sunrise} value={goodNights === null ? '—' : `${goodNights}%`} />
          </div>

          <div className="mb-6 grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader title="Horas de sueño" description="Barras más claras: noches por debajo de la meta" icon={BedDouble} />
              <div className="p-5 pt-8">
                <BarChart days={days} value={(r) => r.sleepHours} max={10} unit="h" target={TARGET_HOURS} label="Horas de sueño por noche" />
              </div>
            </Card>
            <Card>
              <CardHeader title="Energía al despertar" description="Escala de 1 a 5" icon={Zap} />
              <div className="p-5 pt-8">
                <BarChart days={days} value={(r) => r.energyMorning} max={5} unit="/5" label="Energía al despertar por día" />
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader title="Tus patrones" description="Relaciones entre tu descanso, tu energía y tu foco" icon={Lightbulb} />
            <ul className="grid gap-px bg-border md:grid-cols-3">
              {patterns.map((p) => (
                <li key={p.title} className="bg-surface p-5">
                  <p className="text-sm font-semibold">{p.title}</p>
                  <p className="mt-1 text-sm text-muted">{p.text}</p>
                </li>
              ))}
              {patterns.length === 0 && <li className="bg-surface p-5 text-sm text-subtle md:col-span-3">Sigue registrando para descubrir patrones.</li>}
            </ul>
          </Card>
        </>
      )}
      <Card className="mt-6">
        <CardHeader title="Conectar tu reloj Xiaomi" description="Redmi Watch, Smart Band y otros con Mi Fitness o Zepp Life" icon={Watch} />
        <div className="grid gap-px bg-border md:grid-cols-3">
          <div className="bg-surface p-5">
            <p className="text-sm font-semibold">Hoy: importar el archivo</p>
            <p className="mt-1 text-sm text-muted">
              Exporta tus datos desde tu cuenta Xiaomi y súbelos aquí. Detectamos el formato de Xiaomi automáticamente y
              actualizamos tus noches.
            </p>
            <button onClick={() => setImportOpen(true)} className="btn-secondary mt-3">
              <Watch size={16} /> Importar ahora
            </button>
          </div>
          <div className="bg-surface p-5">
            <p className="text-sm font-semibold">Sincronización automática</p>
            <p className="mt-1 text-sm text-muted">
              Xiaomi no ofrece una API pública. En Android, Mi Fitness puede enviar el sueño a <span className="font-medium text-foreground">Health Connect</span>,
              pero solo una app instalada en el teléfono puede leerlo: hace falta una versión Android de esta app.
            </p>
          </div>
          <div className="bg-surface p-5">
            <p className="text-sm font-semibold">Alternativa con servicio externo</p>
            <p className="mt-1 text-sm text-muted">
              Plataformas de datos de salud (de pago) conectan relojes de muchas marcas y reenvían los datos a la web.
              Requiere guardar los datos en un servidor (p. ej. Supabase) e iniciar sesión.
            </p>
          </div>
        </div>
      </Card>

      {importOpen && <WatchImportModal onClose={() => setImportOpen(false)} />}
    </>
  )
}
