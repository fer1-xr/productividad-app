import { BookOpen } from 'lucide-react'
import { DailyReadingPage } from '../components/hozana-content'
import { HOZANA_COMMUNITIES } from '@/lib/hozana'

export const dynamic = 'force-dynamic'

export default function EvangelioPage() {
  return (
    <DailyReadingPage
      title="Evangelio del día"
      description="Las lecturas y el Evangelio de cada día, de la comunidad Evangelio del día en Hozana."
      communityId={HOZANA_COMMUNITIES.evangelio.id}
      communityUrl={HOZANA_COMMUNITIES.evangelio.url}
      path="/evangelio"
      habit={{ key: 'lectura:evangelio', name: 'Leer el Evangelio del día', description: 'Lecturas y Evangelio de cada día' }}
      icon={BookOpen}
      tint="bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200"
    />
  )
}
