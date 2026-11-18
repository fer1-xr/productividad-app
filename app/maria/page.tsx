import { Flower2 } from 'lucide-react'
import { DailyReadingPage } from '../components/hozana-content'
import { HOZANA_COMMUNITIES } from '@/lib/hozana'

export const dynamic = 'force-dynamic'

export default function MariaPage() {
  return (
    <DailyReadingPage
      title="5 minutos con la Virgen María"
      description="La meditación diaria de la comunidad Los 5 minutos de María en Hozana."
      communityId={HOZANA_COMMUNITIES.maria.id}
      communityUrl={HOZANA_COMMUNITIES.maria.url}
      icon={Flower2}
      tint="bg-sky-50 text-sky-800 dark:bg-sky-950/30 dark:text-sky-200"
    />
  )
}
