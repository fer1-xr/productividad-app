'use client'

import type { Transaction } from '@/lib/store'
import { summarizeExpenses } from '@/lib/store'
import { cn, formatMoney } from '@/lib/utils'

/** Barra segmentada (una sola total, dividida por categoría) + leyenda con valores. */
export function ExpenseBreakdown({ transactions }: { transactions: Transaction[] }) {
  const { rows, total } = summarizeExpenses(transactions)

  if (!rows.length) {
    return <p className="py-6 text-center text-sm text-subtle">Sin gastos registrados</p>
  }

  const label = rows.map((r) => `${r.category}: ${formatMoney(r.amount)} (${Math.round(r.share * 100)}%)`).join(', ')

  return (
    <div>
      <div className="flex h-2 w-full gap-0.5" role="img" aria-label={`Gastos por categoría. ${label}`}>
        {rows.map((r) => (
          <div
            key={r.category}
            className={cn('h-full rounded-full', r.color)}
            style={{ width: `${r.share * 100}%` }}
            title={`${r.category}: ${formatMoney(r.amount)} · ${Math.round(r.share * 100)}%`}
          />
        ))}
      </div>
      <ul className="mt-4 space-y-2.5">
        {rows.map((r) => (
          <li key={r.category} className="flex items-center gap-3 text-sm">
            <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', r.color)} aria-hidden />
            <span className="flex-1 text-muted">{r.category}</span>
            <span className="tabular font-medium">{formatMoney(r.amount)}</span>
            <span className="tabular w-10 text-right text-xs text-subtle">{Math.round(r.share * 100)}%</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-center justify-between border-t pt-3 text-sm">
        <span className="text-muted">Total</span>
        <span className="tabular font-semibold">{formatMoney(total)}</span>
      </div>
    </div>
  )
}
