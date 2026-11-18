import { Fragment, type ReactNode } from 'react'
import { ExternalLink, type LucideIcon } from 'lucide-react'
import { PageHeader } from './ui'
import { cn } from '@/lib/utils'
import { getPublications, type ContentNode, type Publication } from '@/lib/hozana'

/* El contenido llega como árbol JSON desde Hozana: se renderiza solo con etiquetas permitidas
   y como texto escapado por React, sin inyectar HTML externo. */
const BLOCK_CLASS: Record<string, string> = {
  p: 'my-3',
  h2: 'mt-6 mb-2 text-base font-semibold text-foreground first:mt-0',
  h3: 'mt-5 mb-2 text-sm font-semibold text-foreground',
  h4: 'mt-4 mb-1 text-sm font-semibold text-foreground',
  blockquote: 'my-3 border-l-2 pl-4 italic',
  ul: 'my-3 list-disc pl-5',
  ol: 'my-3 list-decimal pl-5',
  li: 'my-1',
}
const INLINE_TAGS = new Set(['em', 'i', 'strong', 'b', 'u', 'span', 'sup', 'sub'])

function renderNodes(nodes: ContentNode[] | undefined, keyPrefix = ''): ReactNode {
  return nodes?.map((node, i) => {
    const key = `${keyPrefix}${i}`
    if (typeof node === 'string') return <Fragment key={key}>{node}</Fragment>
    const children = renderNodes(node.content, `${key}-`)
    const tag = node.tag?.toLowerCase()
    if (tag === 'br') return <br key={key} />
    if (tag === 'a') {
      const href = node.attrs?.href ?? ''
      return /^https?:\/\//.test(href) ? (
        <a key={key} href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
          {children}
        </a>
      ) : (
        <Fragment key={key}>{children}</Fragment>
      )
    }
    if (tag && INLINE_TAGS.has(tag)) {
      const Tag = tag as 'em'
      return <Tag key={key}>{children}</Tag>
    }
    if (tag && tag in BLOCK_CLASS) {
      const Tag = tag as 'p'
      const isQuote = node.attrs?.class?.includes('hoz_quote')
      return (
        <Tag key={key} className={cn(BLOCK_CLASS[tag], isQuote && 'rounded-lg bg-surface-2 px-4 py-3')}>
          {children}
        </Tag>
      )
    }
    return <Fragment key={key}>{children}</Fragment>
  })
}

export function PublicationBody({ publication }: { publication: Publication }) {
  return (
    <div className="whitespace-pre-line text-[15px] leading-relaxed text-muted">{renderNodes(publication.content)}</div>
  )
}

export function SourceLink({ href, label = 'Ver en Hozana' }: { href: string; label?: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="btn-secondary">
      {label} <ExternalLink size={14} aria-hidden />
    </a>
  )
}

export function LoadError({ href }: { href: string }) {
  return (
    <div className="card p-6 text-sm text-muted">
      No se pudo cargar el contenido de Hozana en este momento. Vuelve a intentarlo en unos minutos o{' '}
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
        ábrelo directamente en Hozana
      </a>
      .
    </div>
  )
}

/** Página de lectura diaria de una comunidad de Hozana: la publicación de hoy y los días anteriores. */
export async function DailyReadingPage({
  title,
  description,
  communityId,
  communityUrl,
  icon: Icon,
  tint,
}: {
  title: string
  description: string
  communityId: number
  communityUrl: string
  icon: LucideIcon
  tint: string
}) {
  let publications: Publication[] | null = null
  try {
    publications = await getPublications(communityId)
  } catch {
    publications = null
  }

  const [today, ...previous] = publications ?? []

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={title} description={description} actions={<SourceLink href={communityUrl} />} />

      {!publications ? (
        <LoadError href={communityUrl} />
      ) : !today ? (
        <div className="card p-6 text-sm text-muted">Todavía no hay publicaciones.</div>
      ) : (
        <>
          <article className="card overflow-hidden">
            <header className={cn('flex items-center gap-3 border-b px-6 py-4', tint)}>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface/70">
                <Icon size={18} aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide opacity-80">Lectura más reciente</p>
                <h2 className="truncate text-base font-semibold text-foreground">{today.title}</h2>
              </div>
            </header>
            <div className="px-6 py-5">
              <PublicationBody publication={today} />
              {today.author && <p className="mt-6 text-xs text-subtle">Publicado por {today.author} en Hozana</p>}
            </div>
          </article>

          {previous.length > 0 && (
            <section className="mt-8">
              <h2 className="mb-3 text-sm font-semibold">Días anteriores</h2>
              <div className="space-y-2">
                {previous.map((p) => (
                  <details key={p.id} className="card group">
                    <summary className="cursor-pointer list-none px-5 py-3.5 text-sm font-medium marker:hidden">
                      <span className="mr-2 inline-block text-subtle transition-transform group-open:rotate-90">›</span>
                      {p.title}
                    </summary>
                    <div className="border-t px-5 py-4">
                      <PublicationBody publication={p} />
                    </div>
                  </details>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
