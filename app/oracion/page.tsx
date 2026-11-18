import { HeartHandshake } from 'lucide-react'
import { PageHeader } from '../components/ui'
import { LoadError, SourceLink } from '../components/hozana-content'
import { getIntentions, HOZANA_INTENTIONS_URL, type Intention } from '@/lib/hozana'

export const dynamic = 'force-dynamic'

function timeAgo(iso: string) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (minutes < 1) return 'ahora'
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.round(hours / 24)
  return `hace ${days} ${days === 1 ? 'día' : 'días'}`
}

export default async function OracionPage() {
  let intentions: Intention[] | null = null
  try {
    intentions = await getIntentions()
  } catch {
    intentions = null
  }

  return (
    <div>
      <PageHeader
        title="Oración"
        description="Intenciones de oración compartidas hoy en Hozana. Tómate un momento para rezar por ellas."
        actions={<SourceLink href={HOZANA_INTENTIONS_URL} label="Rezar en Hozana" />}
      />

      {!intentions ? (
        <LoadError href={HOZANA_INTENTIONS_URL} />
      ) : intentions.length === 0 ? (
        <div className="card p-6 text-sm text-muted">No hay intenciones nuevas por ahora.</div>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {intentions.map((i) => (
            <li key={i.id} className="card flex flex-col p-5">
              <p className="flex-1 whitespace-pre-line text-sm leading-relaxed text-foreground">{i.text}</p>
              <div className="mt-4 flex items-center justify-between gap-2 border-t pt-3 text-xs text-subtle">
                <span className="truncate">
                  <span className="font-medium text-muted">{i.name}</span> · {timeAgo(i.createdAt)}
                </span>
                <span className="inline-flex shrink-0 items-center gap-1" title="Personas que rezaron por esta intención">
                  <HeartHandshake size={14} aria-hidden />
                  <span className="tabular">{i.prayersCount}</span>
                  <span className="sr-only">oraciones</span>
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-6 text-xs text-subtle">Fuente: Hozana. Se actualiza cada 15 minutos.</p>
    </div>
  )
}
