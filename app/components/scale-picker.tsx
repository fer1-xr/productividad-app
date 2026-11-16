'use client'

import { SCALE_LABEL } from '@/lib/wellbeing'
import { cn } from '@/lib/utils'

/** Selector 1–5 con etiqueta visible (no sólo color). */
export function ScalePicker({
  value,
  onChange,
  label,
}: {
  value: number | null
  onChange: (v: number) => void
  label: string
}) {
  return (
    <div role="radiogroup" aria-label={label}>
      <div className="grid grid-cols-5 gap-1.5">
        {[1, 2, 3, 4, 5].map((v) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={value === v}
            aria-label={`${v} · ${SCALE_LABEL[v]}`}
            onClick={() => onChange(v)}
            className={cn(
              'flex h-10 items-center justify-center rounded-lg border text-sm font-semibold transition-colors',
              value === v ? 'border-primary bg-primary text-primary-foreground' : 'bg-surface text-muted hover:bg-surface-2',
            )}
          >
            {v}
          </button>
        ))}
      </div>
      <p className="mt-1.5 h-4 text-xs text-subtle">{value ? SCALE_LABEL[value] : 'Elige un valor'}</p>
    </div>
  )
}
