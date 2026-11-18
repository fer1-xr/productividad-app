import { Flame } from 'lucide-react'
import { DailyReadingPage } from '../components/hozana-content'
import { HOZANA_COMMUNITIES } from '@/lib/hozana'

export const dynamic = 'force-dynamic'

export default function EspirituSantoPage() {
  return (
    <DailyReadingPage
      title="5 minutos con el Espíritu Santo"
      description="La meditación diaria de la comunidad Los cinco minutos del Espíritu Santo en Hozana."
      communityId={HOZANA_COMMUNITIES.espirituSanto.id}
      communityUrl={HOZANA_COMMUNITIES.espirituSanto.url}
      path="/espiritu-santo"
      habit={{ key: 'lectura:espiritu-santo', name: '5 minutos con el Espíritu Santo', description: 'Meditación diaria' }}
      icon={Flame}
      tint="bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-200"
    />
  )
}
