import { PageHeader } from '../components/ui'
import { SourceLink } from '../components/hozana-content'
import { getIntentions, HOZANA_INTENTIONS_URL, type Intention } from '@/lib/hozana'
import { PrayerSession } from './prayer-session'

export const dynamic = 'force-dynamic'

export default async function OracionPage() {
  let intentions: Intention[] | null = null
  try {
    intentions = await getIntentions()
  } catch {
    intentions = null
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Oración"
        description="Tres intenciones de oración de Hozana para hoy. Por cada una, un Padre Nuestro y un Ave María."
        actions={<SourceLink href={HOZANA_INTENTIONS_URL} label="Ver en Hozana" />}
      />
      <PrayerSession fresh={intentions?.slice(0, 3).map(({ id, text, name }) => ({ id, text, name })) ?? null} />
      <p className="mt-6 text-xs text-subtle">Fuente: Hozana. Las intenciones del día se fijan en tu primera visita.</p>
    </div>
  )
}
