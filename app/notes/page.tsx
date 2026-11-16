'use client'

import { useState, type FormEvent } from 'react'
import { Bell, FileText, Pin, Plus, Quote, Search, StickyNote, Trash2 } from 'lucide-react'
import { Badge, EmptyState, Field, FormActions, Modal, PageHeader, Segmented } from '../components/ui'
import { NOTE_CATEGORY_LABEL, useStore, type Note, type NoteCategory } from '@/lib/store'
import { cn, formatDate } from '@/lib/utils'
import { useOpenFromQuery } from '@/lib/use-open-from-query'

const categoryMeta: Record<NoteCategory, { icon: typeof Quote; tone: 'primary' | 'warning' | 'neutral' }> = {
  note: { icon: FileText, tone: 'neutral' },
  quote: { icon: Quote, tone: 'primary' },
  reminder: { icon: Bell, tone: 'warning' },
}

export default function NotesPage() {
  const { notes, addNote, deleteNote, toggleNotePin } = useStore()
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState<'all' | NoteCategory>('all')
  const [query, setQuery] = useState('')
  useOpenFromQuery(() => setOpen(true))

  const q = query.trim().toLowerCase()
  const filtered = notes
    .filter((n) => filter === 'all' || n.category === filter)
    .filter((n) => !q || n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q))
  const pinned = filtered.filter((n) => n.isPinned)
  const others = filtered.filter((n) => !n.isPinned)

  const count = (c: NoteCategory) => notes.filter((n) => n.category === c).length

  return (
    <>
      <PageHeader
        title="Notas y frases"
        description="Guarda ideas, frases inspiradoras y recordatorios."
        actions={
          <button onClick={() => setOpen(true)} className="btn-primary">
            <Plus size={16} /> Nueva nota
          </button>
        }
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="overflow-x-auto">
          <Segmented
            ariaLabel="Filtrar notas"
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: 'Todas', count: notes.length },
              { value: 'note', label: 'Notas', count: count('note') },
              { value: 'quote', label: 'Frases', count: count('quote') },
              { value: 'reminder', label: 'Recordatorios', count: count('reminder') },
            ]}
          />
        </div>
        <div className="relative sm:w-64">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
          <input
            className="input pl-8"
            placeholder="Buscar notas…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Buscar notas"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={StickyNote}
            title={q ? 'Sin resultados' : 'No hay notas en esta categoría'}
            description={q ? `Nada coincide con “${query}”.` : undefined}
          />
        </div>
      ) : (
        <div className="space-y-8">
          {pinned.length > 0 && (
            <NoteSection title="Fijadas" notes={pinned} onDelete={deleteNote} onTogglePin={toggleNotePin} />
          )}
          {others.length > 0 && (
            <NoteSection
              title={pinned.length ? 'Otras' : 'Todas las notas'}
              notes={others}
              onDelete={deleteNote}
              onTogglePin={toggleNotePin}
            />
          )}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Nueva nota">
        <NoteForm
          onCancel={() => setOpen(false)}
          onSubmit={(n) => {
            addNote(n)
            setOpen(false)
          }}
        />
      </Modal>
    </>
  )
}

function NoteSection({
  title,
  notes,
  onDelete,
  onTogglePin,
}: {
  title: string
  notes: Note[]
  onDelete: (id: string) => void
  onTogglePin: (id: string) => void
}) {
  return (
    <section>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-subtle">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {notes.map((n) => (
          <NoteCard key={n.id} note={n} onDelete={onDelete} onTogglePin={onTogglePin} />
        ))}
      </div>
    </section>
  )
}

function NoteCard({
  note,
  onDelete,
  onTogglePin,
}: {
  note: Note
  onDelete: (id: string) => void
  onTogglePin: (id: string) => void
}) {
  const meta = categoryMeta[note.category]
  const Icon = meta.icon
  return (
    <article className="card group flex flex-col p-5">
      <div className="mb-3 flex items-center justify-between">
        <Badge tone={meta.tone}>
          <Icon size={12} /> {NOTE_CATEGORY_LABEL[note.category]}
        </Badge>
        <div className="-mr-2 flex">
          <button
            onClick={() => onTogglePin(note.id)}
            className={cn('btn-icon', note.isPinned && 'text-primary')}
            aria-pressed={note.isPinned}
            aria-label={note.isPinned ? 'Desfijar nota' : 'Fijar nota'}
            title={note.isPinned ? 'Desfijar' : 'Fijar'}
          >
            <Pin size={16} fill={note.isPinned ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={() => confirm(`¿Eliminar "${note.title}"?`) && onDelete(note.id)}
            className="btn-icon hover:text-danger"
            aria-label={`Eliminar ${note.title}`}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      <h3 className="font-semibold">{note.title}</h3>
      <p className={cn('mt-1.5 flex-1 whitespace-pre-line text-sm text-muted', note.category === 'quote' && 'italic')}>
        {note.content}
      </p>
      <p className="mt-4 text-xs text-subtle">{formatDate(note.createdAt, { day: 'numeric', month: 'long', year: 'numeric' })}</p>
    </article>
  )
}

function NoteForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (n: { title: string; content: string; category: NoteCategory; isPinned: boolean }) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState<NoteCategory>('note')
  const [isPinned, setPinned] = useState(false)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return
    onSubmit({ title: title.trim(), content: content.trim(), category, isPinned })
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Título">
        <input className="input" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Idea para el proyecto" />
      </Field>
      <Field label="Contenido">
        <textarea className="input" rows={5} required value={content} onChange={(e) => setContent(e.target.value)} placeholder="Escribe aquí…" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2 sm:items-end">
        <Field label="Categoría">
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value as NoteCategory)}>
            {Object.entries(NOTE_CATEGORY_LABEL).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </Field>
        <label className="flex cursor-pointer items-center gap-2 py-2 text-sm">
          <input type="checkbox" checked={isPinned} onChange={(e) => setPinned(e.target.checked)} className="h-4 w-4 accent-[rgb(var(--primary))]" />
          Fijar arriba
        </label>
      </div>
      <FormActions onCancel={onCancel} submitLabel="Guardar nota" />
    </form>
  )
}
