const API = 'https://hozana.org/api-cache/es'
const REVALIDATE_SECONDS = 15 * 60

export const HOZANA_COMMUNITIES = {
  evangelio: { id: 7734, url: 'https://hozana.org/comunidad/7734-evangelio-del-dia' },
  espirituSanto: { id: 8392, url: 'https://hozana.org/comunidad/8392-los-cinco-minutos-del-espiritu-santo' },
  maria: { id: 8078, url: 'https://hozana.org/comunidad/8078-los-5-minutos-de-maria' },
} as const

export const HOZANA_INTENTIONS_URL = 'https://hozana.org/watchman/intentions'

export type ContentNode = string | { tag: string; attrs?: Record<string, string>; content?: ContentNode[] }

export interface Publication {
  id: string
  title: string
  date: string
  author: string
  content: ContentNode[]
}

/** Solo los campos que se muestran: la API también expone datos personales del autor que no usamos. */
export interface Intention {
  id: number
  text: string
  name: string
  createdAt: string
  prayersCount: number
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API}/${path}`, { next: { revalidate: REVALIDATE_SECONDS } })
  if (!res.ok) throw new Error(`Hozana respondió ${res.status}`)
  const body = await res.json()
  if (!body.success) throw new Error('Hozana devolvió un error')
  return body.data as T
}

interface RawPublication {
  id: number | string
  name: string
  effectivePublicationDate: string
  contentJson: string
  contentUpdatedBy?: { name?: string }
}

export async function getPublications(communityId: number, limit = 7): Promise<Publication[]> {
  const data = await get<RawPublication[]>(`publications?community=${communityId}&limit=${limit}`)
  return data.slice(0, limit).map((p) => ({
    id: String(p.id),
    title: p.name.trim(),
    date: p.effectivePublicationDate,
    author: p.contentUpdatedBy?.name ?? '',
    content: safeParse(p.contentJson),
  }))
}

interface RawIntention {
  id: number
  content: string
  createdAt: string
  prayersCount: number
  guestName: string | null
  user: { name?: string } | null
}

/** La API entrega 3 intenciones por llamada; se piden más excluyendo las ya recibidas, como hace la app de Hozana. */
export async function getIntentions(rounds = 1): Promise<Intention[]> {
  const data: RawIntention[] = []
  for (let r = 0; r < rounds; r++) {
    const except = data.map((i) => `exceptIntentionsIds%5B%5D=${i.id}`).join('&')
    const batch = await get<RawIntention[]>(`intentions${except ? `?${except}` : ''}`)
    const fresh = batch.filter((i) => !data.some((d) => d.id === i.id))
    if (fresh.length === 0) break
    data.push(...fresh)
  }
  data.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return data.map((i) => ({
    id: i.id,
    text: i.content.trim(),
    name: (i.user?.name || i.guestName || 'Anónimo').trim().split(/\s+/)[0],
    createdAt: i.createdAt,
    prayersCount: i.prayersCount,
  }))
}

function safeParse(json: string): ContentNode[] {
  try {
    const parsed = JSON.parse(json)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}
