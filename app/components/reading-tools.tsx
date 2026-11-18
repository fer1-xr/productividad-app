'use client'

import Link from 'next/link'
import { useEffect, useId, useRef, useState, type FormEvent, type PointerEvent, type ReactNode } from 'react'
import { BookmarkCheck, BookmarkPlus, CheckCircle2, Circle, Highlighter, MessageSquarePlus, Pencil, Trash2 } from 'lucide-react'
import { FormActions, Modal } from './ui'
import { useStore, type LinkedHabit, type Note, type NoteSource } from '@/lib/store'
import { cn, toISODate } from '@/lib/utils'

const HIGHLIGHT_NAME = 'saved-highlight'

/* Varias lecturas comparten un único Highlight global: cada una registra sus rangos aquí. */
const registry = new Map<string, Range[]>()
function paintHighlights() {
  if (typeof CSS === 'undefined' || !('highlights' in CSS)) return
  const ranges = Array.from(registry.values()).flat()
  if (ranges.length) CSS.highlights.set(HIGHLIGHT_NAME, new Highlight(...ranges))
  else CSS.highlights.delete(HIGHLIGHT_NAME)
}

/** Ubica cada cita en el texto ignorando espacios y saltos de línea, que la selección y el DOM representan distinto. */
function findRanges(root: HTMLElement, quotes: string[]): Range[] {
  const chars: { node: Text; offset: number }[] = []
  let flat = ''
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const text = n as Text
    for (let i = 0; i < text.data.length; i++) {
      if (/\s/.test(text.data[i])) continue
      flat += text.data[i]
      chars.push({ node: text, offset: i })
    }
  }
  const ranges: Range[] = []
  for (const quote of quotes) {
    const needle = quote.replace(/\s+/g, '')
    const at = needle ? flat.indexOf(needle) : -1
    if (at < 0) continue
    const start = chars[at]
    const end = chars[at + needle.length - 1]
    const range = document.createRange()
    range.setStart(start.node, start.offset)
    range.setEnd(end.node, end.offset + 1)
    ranges.push(range)
  }
  return ranges
}

const cleanQuote = (t: string) =>
  t
    .replace(/[ \t ]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim()

type Dialog = { kind: 'new'; quote?: string } | { kind: 'edit'; note: Note }

export function ReadingTools({
  source,
  publication,
  plainText,
  habit,
  children,
}: {
  source: { label: string; path: string }
  publication: { id: string; title: string }
  plainText: string
  habit?: LinkedHabit
  children: ReactNode
}) {
  const instanceId = useId()
  const bodyRef = useRef<HTMLDivElement>(null)
  const notes = useStore((s) => s.notes)
  const habits = useStore((s) => s.habits)
  const { addNote, updateNote, deleteNote, setLinkedHabitDone } = useStore()
  const [sel, setSel] = useState<{ text: string; x: number; top: number; bottom: number } | null>(null)
  const [dialog, setDialog] = useState<Dialog | null>(null)
  const [draft, setDraft] = useState('')

  const noteSource: NoteSource = {
    label: source.label,
    path: source.path,
    publicationId: publication.id,
    publicationTitle: publication.title,
  }
  const mine = notes.filter((n) => n.source?.publicationId === publication.id)
  const annotations = mine.filter((n) => n.category !== 'reading')
  const savedReading = mine.find((n) => n.category === 'reading')
  const habitDone = habit ? !!habits.find((h) => h.key === habit.key)?.completions.includes(toISODate()) : false

  // Barra flotante al seleccionar texto dentro de esta lectura
  useEffect(() => {
    const update = () => {
      const s = document.getSelection()
      const root = bodyRef.current
      if (!s || s.isCollapsed || !s.rangeCount || !root) return setSel(null)
      const range = s.getRangeAt(0)
      if (!root.contains(range.commonAncestorContainer)) return setSel(null)
      const text = cleanQuote(s.toString())
      if (text.length < 2) return setSel(null)
      const rect = range.getBoundingClientRect()
      if (rect.bottom < 0 || rect.top > window.innerHeight) return setSel(null)
      setSel({ text, x: rect.left + rect.width / 2, top: rect.top, bottom: rect.bottom })
    }
    document.addEventListener('selectionchange', update)
    window.addEventListener('scroll', update, true)
    return () => {
      document.removeEventListener('selectionchange', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [])

  // Pintar los resaltados guardados sobre el texto
  const quotesKey = JSON.stringify(annotations.flatMap((n) => (n.quote ? [n.quote] : [])))
  useEffect(() => {
    const root = bodyRef.current
    if (!root) return
    registry.set(instanceId, findRanges(root, JSON.parse(quotesKey)))
    paintHighlights()
    return () => {
      registry.delete(instanceId)
      paintHighlights()
    }
  }, [quotesKey, instanceId])

  const clearSelection = () => {
    document.getSelection()?.removeAllRanges()
    setSel(null)
  }

  const addHighlight = (quote: string, comment = '') => {
    const exists = useStore
      .getState()
      .notes.find((n) => n.source?.publicationId === publication.id && n.quote === quote)
    if (exists) {
      if (comment) updateNote(exists.id, { content: comment })
      return
    }
    addNote({ title: publication.title, content: comment, category: 'highlight', isPinned: false, quote, source: noteSource })
  }

  // Se actúa en pointerdown: en táctiles, el clic llega cuando la selección ya se perdió
  const onToolbar = (action: 'highlight' | 'comment') => (e: PointerEvent | React.MouseEvent) => {
    e.preventDefault()
    if (!sel) return
    const text = sel.text
    clearSelection()
    if (action === 'highlight') addHighlight(text)
    else openDialog({ kind: 'new', quote: text })
  }

  const openDialog = (d: Dialog) => {
    setDraft(d.kind === 'edit' ? d.note.content : '')
    setDialog(d)
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const text = draft.trim()
    if (!dialog) return
    if (dialog.kind === 'edit') updateNote(dialog.note.id, { content: text })
    else if (dialog.quote) addHighlight(dialog.quote, text)
    else if (text) addNote({ title: publication.title, content: text, category: 'comment', isPinned: false, source: noteSource })
    setDialog(null)
  }

  const toggleSaved = () => {
    if (savedReading) {
      if (confirm('¿Quitar esta lectura de tus Notas?')) deleteNote(savedReading.id)
    } else {
      addNote({ title: publication.title, content: plainText, category: 'reading', isPinned: false, source: noteSource })
    }
  }

  const dialogQuote = dialog?.kind === 'edit' ? dialog.note.quote : dialog?.quote

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button onClick={toggleSaved} aria-pressed={!!savedReading} className={cn('btn-secondary', savedReading && 'text-primary')}>
          {savedReading ? <BookmarkCheck size={16} /> : <BookmarkPlus size={16} />}
          {savedReading ? 'Guardado en Notas' : 'Guardar texto'}
        </button>
        <button onClick={() => openDialog({ kind: 'new' })} className="btn-secondary">
          <MessageSquarePlus size={16} /> Comentar
        </button>
        <span className="text-xs text-subtle">Selecciona un fragmento para resaltarlo o comentarlo.</span>
      </div>

      <div ref={bodyRef}>{children}</div>

      {sel && (
        <div
          role="toolbar"
          aria-label="Acciones sobre el texto seleccionado"
          className="fixed z-40 flex -translate-x-1/2 gap-1 rounded-lg border bg-surface p-1 shadow-pop"
          style={{
            left: Math.min(Math.max(sel.x, 130), window.innerWidth - 130),
            top: sel.bottom + 56 < window.innerHeight ? sel.bottom + 8 : Math.max(sel.top - 52, 8),
          }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <button className="btn-ghost px-2.5 py-1.5 text-foreground" onPointerDown={onToolbar('highlight')} onClick={onToolbar('highlight')}>
            <Highlighter size={15} className="text-yellow-500" /> Resaltar
          </button>
          <button className="btn-ghost px-2.5 py-1.5 text-foreground" onPointerDown={onToolbar('comment')} onClick={onToolbar('comment')}>
            <MessageSquarePlus size={15} /> Comentar
          </button>
        </div>
      )}

      {habit && (
        <div className="mt-6 flex flex-col gap-3 rounded-lg border bg-surface-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">
            {habitDone ? (
              <>
                Lectura de hoy completada. Quedó marcada en{' '}
                <Link href="/habits" className="font-medium text-primary hover:underline">
                  Hábitos
                </Link>
                .
              </>
            ) : (
              '¿Terminaste de leer? Márcalo y se registra en tus hábitos de hoy.'
            )}
          </p>
          <button
            onClick={() => setLinkedHabitDone(habit, !habitDone)}
            aria-pressed={habitDone}
            className={cn('shrink-0', habitDone ? 'btn-secondary text-success' : 'btn-primary')}
          >
            {habitDone ? <CheckCircle2 size={16} /> : <Circle size={16} />}
            {habitDone ? 'Completado' : 'Terminé de leer'}
          </button>
        </div>
      )}

      {annotations.length > 0 && (
        <section className="mt-6 border-t pt-5">
          <div className="mb-3 flex items-baseline justify-between">
            <h3 className="text-sm font-semibold">Tus resaltados y comentarios</h3>
            <Link href="/notes" className="text-xs font-medium text-primary hover:underline">
              Ver en Notas →
            </Link>
          </div>
          <ul className="space-y-3">
            {annotations.map((n) => (
              <li key={n.id} className="rounded-lg border p-3">
                {n.quote && <Quote text={n.quote} />}
                {n.content && <p className={cn('whitespace-pre-line text-sm text-foreground', n.quote && 'mt-2')}>{n.content}</p>}
                <div className="mt-2 flex justify-end gap-1">
                  <button className="btn-ghost px-2 py-1 text-xs" onClick={() => openDialog({ kind: 'edit', note: n })}>
                    <Pencil size={13} /> {n.content ? 'Editar comentario' : 'Agregar comentario'}
                  </button>
                  <button className="btn-ghost px-2 py-1 text-xs hover:text-danger" onClick={() => deleteNote(n.id)}>
                    <Trash2 size={13} /> Quitar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Modal
        open={!!dialog}
        onClose={() => setDialog(null)}
        title={dialog?.kind === 'edit' ? 'Editar comentario' : 'Agregar comentario'}
        description={publication.title}
      >
        <form onSubmit={submit}>
          {dialogQuote && <Quote text={dialogQuote} className="mb-4" />}
          <textarea
            className="input"
            rows={5}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="¿Qué te dice este texto?"
            aria-label="Comentario"
            required={!dialogQuote}
          />
          <FormActions onCancel={() => setDialog(null)} submitLabel="Guardar" />
        </form>
      </Modal>
    </>
  )
}

function Quote({ text, className }: { text: string; className?: string }) {
  return (
    <blockquote
      className={cn(
        'whitespace-pre-line rounded-md border-l-2 border-yellow-400 bg-yellow-100/60 px-3 py-2 text-sm text-foreground dark:bg-yellow-400/10',
        className,
      )}
    >
      {text}
    </blockquote>
  )
}
