'use client'

import { useEffect, useState } from 'react'
import { Check, HeartHandshake } from 'lucide-react'
import { Modal } from '../components/ui'
import { useStore, type DailyIntention } from '@/lib/store'
import { cn, toISODate } from '@/lib/utils'

const PRAYERS = [
  {
    name: 'Padre Nuestro',
    text: `Padre nuestro, que estás en el cielo,
santificado sea tu Nombre;
venga a nosotros tu reino;
hágase tu voluntad
en la tierra como en el cielo.
Danos hoy nuestro pan de cada día;
perdona nuestras ofensas,
como también nosotros perdonamos
a los que nos ofenden;
no nos dejes caer en la tentación,
y líbranos del mal.
Amén.`,
  },
  {
    name: 'Ave María',
    text: `Dios te salve, María, llena eres de gracia;
el Señor es contigo.
Bendita tú eres entre todas las mujeres,
y bendito es el fruto de tu vientre, Jesús.
Santa María, Madre de Dios,
ruega por nosotros, pecadores,
ahora y en la hora de nuestra muerte.
Amén.`,
  },
]

type Fresh = Pick<DailyIntention, 'id' | 'text' | 'name'>

export function PrayerSession({ fresh }: { fresh: Fresh[] | null }) {
  const today = toISODate()
  const prayers = useStore((s) => s.prayers)
  const { setDailyIntentions, advancePrayer } = useStore()
  const [praying, setPraying] = useState<number | null>(null)

  // Las tres intenciones quedan fijas durante el día aunque Hozana publique nuevas
  const stored = prayers?.date === today ? prayers.intentions : null
  useEffect(() => {
    if (!stored && fresh?.length) {
      setDailyIntentions({ date: today, intentions: fresh.map((i) => ({ ...i, progress: 0 })) })
    }
  }, [stored, fresh, today, setDailyIntentions])

  const intentions: DailyIntention[] = stored ?? fresh?.map((i) => ({ ...i, progress: 0 as const })) ?? []
  const done = intentions.filter((i) => i.progress === 2).length
  const current = intentions.find((i) => i.id === praying)

  if (!intentions.length) {
    return (
      <div className="card p-6 text-sm text-muted">
        No se pudieron cargar las intenciones de hoy desde Hozana. Vuelve a intentarlo en unos minutos.
      </div>
    )
  }

  return (
    <>
      <section className="card mb-6 flex flex-col items-center gap-4 p-6 sm:flex-row sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">
            {done === intentions.length ? 'Rezaste por todas las intenciones de hoy' : 'Tus velas de hoy'}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {done} de {intentions.length} intenciones rezadas
          </p>
        </div>
        <div className="flex items-end gap-3" aria-hidden>
          {intentions.map((i) => (
            <Candle key={i.id} progress={i.progress} className="h-16" />
          ))}
        </div>
      </section>

      <ul className="grid gap-4 md:grid-cols-3">
        {intentions.map((i, idx) => (
          <li key={i.id} className={cn('card flex flex-col p-5', i.progress === 2 && 'border-amber-300 dark:border-amber-800')}>
            <div className="mb-3 flex items-start justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-subtle">Intención {idx + 1}</span>
              <Candle progress={i.progress} className="h-12 shrink-0" />
            </div>
            <p className="flex-1 whitespace-pre-line text-sm leading-relaxed text-foreground">{i.text}</p>
            <p className="mt-3 text-xs text-subtle">Pedida por {i.name}</p>
            <div className="mt-4 border-t pt-4">
              {i.progress === 2 ? (
                <p className="flex items-center gap-1.5 text-sm font-medium text-amber-700 dark:text-amber-300">
                  <Check size={16} /> Rezaste por esta intención
                </p>
              ) : (
                <button onClick={() => setPraying(i.id)} className="btn-primary w-full">
                  <HeartHandshake size={16} /> {i.progress === 0 ? 'Rezar' : 'Continuar: Ave María'}
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      <Modal open={!!current} onClose={() => setPraying(null)} title="Rezar por esta intención">
        {current && <PrayerSteps intention={current} onAmen={() => advancePrayer(current.id)} onClose={() => setPraying(null)} />}
      </Modal>
    </>
  )
}

function PrayerSteps({ intention, onAmen, onClose }: { intention: DailyIntention; onAmen: () => void; onClose: () => void }) {
  const prayer = PRAYERS[intention.progress]
  return (
    <div>
      <blockquote className="rounded-md border-l-2 border-amber-400 bg-amber-50 px-3 py-2 text-sm text-foreground dark:bg-amber-400/10">
        {intention.text}
      </blockquote>

      <div className="my-5 flex justify-center">
        <Candle progress={intention.progress} className="h-36" />
      </div>

      {prayer ? (
        <>
          <p className="text-xs font-semibold uppercase tracking-wide text-subtle">
            {intention.progress + 1} de 2 · {prayer.name}
          </p>
          <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-foreground">{prayer.text}</p>
          <button onClick={onAmen} className="btn-primary mt-6 w-full">
            Amén
          </button>
        </>
      ) : (
        <>
          <p className="text-center text-sm text-muted">Tu vela quedó encendida por esta intención.</p>
          <button onClick={onClose} className="btn-secondary mt-6 w-full">
            Cerrar
          </button>
        </>
      )}
    </div>
  )
}

/** Vela que se colorea de abajo hacia arriba con cada oración y se enciende al completarse. */
function Candle({ progress, className }: { progress: DailyIntention['progress']; className?: string }) {
  const lit = progress === 2
  const label = lit ? 'Vela encendida' : progress === 1 ? 'Vela a medio pintar' : 'Vela sin encender'
  return (
    <svg viewBox="0 0 40 96" className={cn('w-auto', className)} role="img" aria-label={label}>
      <defs>
        <radialGradient id="candle-glow">
          <stop offset="0%" stopColor="rgb(251 191 36)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="rgb(251 191 36)" stopOpacity="0" />
        </radialGradient>
      </defs>
      {lit && <circle cx="20" cy="18" r="18" fill="url(#candle-glow)" />}
      {lit && (
        <path
          className="candle-flame"
          d="M20 6 C 25 13, 25 20, 20 25 C 15 20, 15 13, 20 6 Z"
          fill="rgb(251 146 60)"
          stroke="rgb(253 224 71)"
          strokeWidth="1.5"
        />
      )}
      <line x1="20" y1="25" x2="20" y2="32" className="stroke-foreground/60" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="8" y="32" width="24" height="60" rx="3" className="fill-surface-2 stroke-border" strokeWidth="1.5" />
      <rect
        x="8"
        y="32"
        width="24"
        height="60"
        rx="3"
        className="fill-amber-400 dark:fill-amber-500"
        style={{
          transform: `scaleY(${progress / 2})`,
          transformBox: 'fill-box',
          transformOrigin: '50% 100%',
          transition: 'transform 1.2s ease-out',
        }}
      />
    </svg>
  )
}
