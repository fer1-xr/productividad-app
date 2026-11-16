'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { ArrowDownRight, ArrowUpRight, Plus, Search, Trash2, Wallet } from 'lucide-react'
import { Card, CardHeader, EmptyState, Field, FormActions, Modal, PageHeader, Segmented, StatCard } from '../components/ui'
import { ExpenseBreakdown } from '../components/expense-breakdown'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, useStore, type TransactionType } from '@/lib/store'
import { cn, formatDate, formatMoney, isSameMonth, toISODate } from '@/lib/utils'
import { useOpenFromQuery } from '@/lib/use-open-from-query'

type Period = 'month' | 'all'
type TypeFilter = 'all' | TransactionType

export default function FinancesPage() {
  const { transactions, addTransaction, deleteTransaction } = useStore()
  const [open, setOpen] = useState(false)
  const [period, setPeriod] = useState<Period>('month')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [query, setQuery] = useState('')
  useOpenFromQuery(() => setOpen(true))

  const inPeriod = useMemo(
    () => (period === 'month' ? transactions.filter((t) => isSameMonth(t.date)) : transactions),
    [transactions, period],
  )

  const income = inPeriod.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expenses = inPeriod.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const balance = income - expenses
  const savingsRate = income > 0 ? Math.round((balance / income) * 100) : 0

  const rows = inPeriod
    .filter((t) => typeFilter === 'all' || t.type === typeFilter)
    .filter((t) => {
      const q = query.trim().toLowerCase()
      return !q || t.description.toLowerCase().includes(q) || t.category.toLowerCase().includes(q)
    })
    .sort((a, b) => b.date.localeCompare(a.date))

  const periodLabel = period === 'month' ? 'este mes' : 'total'

  return (
    <>
      <PageHeader
        title="Finanzas"
        description="Controla tus ingresos, gastos y ahorro."
        actions={
          <>
            <Segmented
              ariaLabel="Periodo"
              value={period}
              onChange={setPeriod}
              options={[
                { value: 'month', label: 'Este mes' },
                { value: 'all', label: 'Todo' },
              ]}
            />
            <button onClick={() => setOpen(true)} className="btn-primary">
              <Plus size={16} /> Nueva transacción
            </button>
          </>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Balance" icon={Wallet} value={formatMoney(balance)} tone={balance < 0 ? 'danger' : 'default'} hint={periodLabel} />
        <StatCard label="Ingresos" icon={ArrowUpRight} value={formatMoney(income)} hint={periodLabel} />
        <StatCard label="Gastos" icon={ArrowDownRight} value={formatMoney(expenses)} hint={periodLabel} />
        <StatCard label="Tasa de ahorro" value={`${savingsRate}%`} hint="del ingreso" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-semibold">Transacciones</h2>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative">
                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
                <input
                  className="input py-1.5 pl-8 sm:w-48"
                  placeholder="Buscar…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Buscar transacciones"
                />
              </div>
              <Segmented
                ariaLabel="Tipo"
                value={typeFilter}
                onChange={setTypeFilter}
                options={[
                  { value: 'all', label: 'Todas' },
                  { value: 'income', label: 'Ingresos' },
                  { value: 'expense', label: 'Gastos' },
                ]}
              />
            </div>
          </div>

          {rows.length === 0 ? (
            <EmptyState icon={Wallet} title="Sin resultados" description="No hay transacciones para estos filtros." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs font-medium text-subtle">
                    <th className="px-5 py-2.5 font-medium">Descripción</th>
                    <th className="hidden px-3 py-2.5 font-medium sm:table-cell">Categoría</th>
                    <th className="hidden px-3 py-2.5 font-medium sm:table-cell">Fecha</th>
                    <th className="px-3 py-2.5 text-right font-medium">Monto</th>
                    <th className="w-12 px-3 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rows.map((t) => (
                    <tr key={t.id} className="group hover:bg-surface-2/50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                              t.type === 'income' ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger',
                            )}
                            aria-label={t.type === 'income' ? 'Ingreso' : 'Gasto'}
                          >
                            {t.type === 'income' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-medium">{t.description}</p>
                            <p className="text-xs text-subtle sm:hidden">
                              {t.category} · {formatDate(t.date)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden px-3 py-3 text-muted sm:table-cell">{t.category}</td>
                      <td className="tabular hidden px-3 py-3 text-muted sm:table-cell">{formatDate(t.date)}</td>
                      <td
                        className={cn(
                          'tabular whitespace-nowrap px-3 py-3 text-right font-semibold',
                          t.type === 'income' && 'text-success',
                        )}
                      >
                        {t.type === 'income' ? '+' : '−'}
                        {formatMoney(t.amount)}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <button
                          onClick={() => confirm(`¿Eliminar "${t.description}"?`) && deleteTransaction(t.id)}
                          className="btn-icon opacity-100 hover:text-danger sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
                          aria-label={`Eliminar ${t.description}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card className="self-start">
          <CardHeader title="Gastos por categoría" description={periodLabel} />
          <div className="p-5">
            <ExpenseBreakdown transactions={inPeriod} />
          </div>
        </Card>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Nueva transacción">
        <TransactionForm
          onCancel={() => setOpen(false)}
          onSubmit={(t) => {
            addTransaction(t)
            setOpen(false)
          }}
        />
      </Modal>
    </>
  )
}

function TransactionForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (t: { description: string; amount: number; category: string; type: TransactionType; date: string }) => void
  onCancel: () => void
}) {
  const [type, setType] = useState<TransactionType>('expense')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0])
  const [date, setDate] = useState(toISODate())

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES

  const changeType = (t: TransactionType) => {
    setType(t)
    setCategory((t === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES)[0])
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const value = parseFloat(amount)
    if (!description.trim() || !(value > 0)) return
    onSubmit({ description: description.trim(), amount: value, category, type, date })
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {(['expense', 'income'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => changeType(t)}
            aria-pressed={type === t}
            className={cn(
              'btn border',
              type === t
                ? t === 'expense'
                  ? 'border-danger/40 bg-danger-soft text-danger'
                  : 'border-success/40 bg-success-soft text-success'
                : 'bg-surface text-muted hover:bg-surface-2',
            )}
          >
            {t === 'expense' ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
            {t === 'expense' ? 'Gasto' : 'Ingreso'}
          </button>
        ))}
      </div>
      <Field label="Descripción">
        <input className="input" required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ej: Supermercado" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Monto">
          <input
            className="input tabular"
            type="number"
            min="0.01"
            step="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0,00"
          />
        </Field>
        <Field label="Fecha">
          <input className="input" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
      </div>
      <Field label="Categoría">
        <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </Field>
      <FormActions onCancel={onCancel} submitLabel="Registrar" />
    </form>
  )
}
