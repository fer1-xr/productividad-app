'use client'

import Link from 'next/link'
import {
  ArrowRight,
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  Flame,
  Crosshair,
  Moon,
  Sunrise,
  Zap,
  Gauge,
  Plus,
  Quote,
  Target,
  Wallet,
} from 'lucide-react'
import { Badge, Card, CardHeader, EmptyState, Progress, StatCard } from './components/ui'
import { ExpenseBreakdown } from './components/expense-breakdown'
import { GOAL_TYPE_LABEL, goalStatus, habitStreak, useStore } from '@/lib/store'
import { blockRange, currentSlot, performance, ROLE_COLOR_CLASS } from '@/lib/planner'
import { RolePerformanceList } from './components/planner-ui'
import { cn, formatDate, formatMoney, greeting, isSameMonth, mondayOf, toISODate, weekdayIndex } from '@/lib/utils'

function CardLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
      {children} <ArrowRight size={12} />
    </Link>
  )
}

export default function DashboardPage() {
  const { habits, transactions, goals, notes, toggleHabit, roles, weeklyGoals, blocks, rituals, toggleMit } = useStore()

  const now = new Date()
  const today = toISODate(now)

  // Hábitos
  const dailyHabits = habits.filter((h) => h.frequency === 'daily')
  const doneToday = dailyHabits.filter((h) => h.completions.includes(today)).length
  const habitPct = dailyHabits.length ? Math.round((doneToday / dailyHabits.length) * 100) : 0

  // Finanzas (mes actual)
  const monthTx = transactions.filter((t) => isSameMonth(t.date, now))
  const income = monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expenses = monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const balance = income - expenses
  const recentTx = [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5)

  // Metas
  const activeGoals = goals.filter((g) => goalStatus(g) !== 'completed')
  const avgProgress = goals.length ? Math.round(goals.reduce((s, g) => s + g.progress, 0) / goals.length) : 0
  const topGoals = [...activeGoals].sort((a, b) => b.progress - a.progress).slice(0, 4)

  // Agenda (plan semanal)
  const weekStart = mondayOf(now)
  const slotNow = currentSlot(now) ?? (now.getHours() < 7 ? -1 : 99)
  const roleById = new Map(roles.map((r) => [r.id, r]))
  const todayEvents = blocks
    .filter((b) => b.weekStart === weekStart && b.day === weekdayIndex(now))
    .sort((a, b) => a.start - b.start)
  const nextEvent = todayEvents.find((e) => e.start + e.span > slotNow)
  const weekPerf = performance(weeklyGoals, blocks, weekStart)

  // Nota destacada
  const featured = notes.find((n) => n.isPinned && n.category === 'quote') ?? notes.find((n) => n.isPinned)

  const ritual = rituals.find((r) => r.date === today)

  const quickActions = [
    { label: 'Hábito', href: '/habits?nuevo', icon: CheckCircle2 },
    { label: 'Transacción', href: '/finances?nuevo', icon: Wallet },
    { label: 'Meta', href: '/goals?nuevo', icon: Target },
    { label: 'Plan semanal', href: '/schedule', icon: CalendarDays },
  ]

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm text-subtle first-letter:uppercase">
            {now.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{greeting(now)} 👋</h1>
          <p className="mt-1 text-sm text-muted">Este es el resumen de tu día.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          {quickActions.map(({ label, href, icon: Icon }) => (
            <Link key={href} href={href} className="btn-secondary">
              <Plus size={14} className="text-subtle" />
              <Icon size={16} className="hidden text-subtle sm:block" />
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Tu día (ritual matutino) */}
      {ritual ? (
        <Card className="flex flex-col gap-4 p-5 md:flex-row md:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <button
              onClick={() => toggleMit(today)}
              aria-pressed={ritual.mitDone}
              aria-label={ritual.mitDone ? 'Marcar tarea más importante como pendiente' : 'Marcar tarea más importante como hecha'}
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                ritual.mitDone ? 'border-success bg-success text-white' : 'border-primary/40 text-primary hover:bg-primary-soft',
              )}
            >
              {ritual.mitDone ? <Check size={18} strokeWidth={3} /> : <Crosshair size={18} />}
            </button>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-subtle">Tarea más importante de hoy</p>
              <p className={cn('truncate text-base font-semibold', ritual.mitDone && 'text-subtle line-through')}>
                {ritual.mit || 'Sin definir'}
              </p>
              {ritual.focus && <p className="truncate text-xs text-muted">Foco: {ritual.focus}</p>}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Badge>
              <Moon size={12} /> {ritual.sleepHours} h de sueño
            </Badge>
            <Badge>
              <Zap size={12} /> Energía {ritual.energyMorning}/5
            </Badge>
            {ritual.word && <Badge tone="primary">“{ritual.word}”</Badge>}
            <Link href="/ritual" className="btn-ghost px-2 py-1 text-xs">
              Editar ritual
            </Link>
          </div>
        </Card>
      ) : (
        <Card className="flex flex-col gap-4 border-primary/30 bg-primary-soft/40 p-5 sm:flex-row sm:items-center">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Sunrise size={18} />
          </span>
          <div className="flex-1">
            <p className="font-semibold">Empieza el día con intención</p>
            <p className="text-sm text-muted">Registra tu sueño y energía, elige tu foco y tu tarea más importante. Toma 2 minutos.</p>
          </div>
          <Link href="/ritual" className="btn-primary">
            Hacer ritual matutino
          </Link>
        </Card>
      )}

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Hábitos de hoy"
          icon={CheckCircle2}
          value={
            <>
              {doneToday}
              <span className="text-base font-medium text-subtle"> / {dailyHabits.length}</span>
            </>
          }
          hint={`${habitPct}% completado`}
        >
          <Progress value={habitPct} className="mt-3" label="Hábitos completados hoy" />
        </StatCard>
        <StatCard
          label="Balance del mes"
          icon={Wallet}
          value={formatMoney(balance)}
          tone={balance >= 0 ? 'default' : 'danger'}
          hint={
            <span className="flex flex-wrap gap-x-3">
              <span className="inline-flex items-center gap-0.5">
                <ArrowUpRight size={12} className="text-success" /> {formatMoney(income)}
              </span>
              <span className="inline-flex items-center gap-0.5">
                <ArrowDownRight size={12} className="text-danger" /> {formatMoney(expenses)}
              </span>
            </span>
          }
        />
        <StatCard
          label="Metas activas"
          icon={Target}
          value={activeGoals.length}
          hint={`Progreso medio: ${avgProgress}%`}
        />
        <StatCard
          label="Agenda de hoy"
          icon={CalendarDays}
          value={
            <>
              {todayEvents.length}
              <span className="text-base font-medium text-subtle"> bloques</span>
            </>
          }
          hint={nextEvent ? `Siguiente: ${blockRange(nextEvent).split(' – ')[0]} · ${nextEvent.title}` : 'No quedan bloques hoy'}
        />
      </div>

      {/* Fila 1: hábitos + agenda */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Hábitos de hoy"
            description="Marca lo que ya completaste"
            icon={CheckCircle2}
            action={<CardLink href="/habits">Ver todos</CardLink>}
          />
          {dailyHabits.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="Aún no tienes hábitos diarios"
              action={<Link href="/habits?nuevo" className="btn-primary">Crear hábito</Link>}
            />
          ) : (
            <ul className="divide-y">
              {dailyHabits.map((h) => {
                const done = h.completions.includes(today)
                const streak = habitStreak(h)
                return (
                  <li key={h.id}>
                    <button
                      onClick={() => toggleHabit(h.id)}
                      aria-pressed={done}
                      className="flex w-full items-center gap-4 px-5 py-3.5 text-left transition-colors hover:bg-surface-2/60"
                    >
                      <span
                        className={cn(
                          'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors',
                          done ? 'border-success bg-success text-white' : 'border-border',
                        )}
                      >
                        {done && <Check size={14} strokeWidth={3} />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={cn('block text-sm font-medium', done && 'text-subtle line-through')}>
                          {h.name}
                        </span>
                        <span className="block truncate text-xs text-subtle">{h.description}</span>
                      </span>
                      <span className="hidden text-xs text-subtle sm:inline">{h.category}</span>
                      <Badge tone={streak > 0 ? 'warning' : 'neutral'}>
                        <Flame size={12} /> {streak} {streak === 1 ? 'día' : 'días'}
                      </Badge>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Agenda de hoy"
            description={now.toLocaleDateString('es', { weekday: 'long' })}
            icon={Clock}
            action={<CardLink href="/schedule">Semana</CardLink>}
          />
          {todayEvents.length === 0 ? (
            <EmptyState icon={CalendarDays} title="Día libre" description="No hay bloques programados para hoy." action={<Link href="/schedule" className="btn-secondary">Planificar</Link>} />
          ) : (
            <ol className="space-y-1 p-3">
              {todayEvents.map((e) => {
                const past = e.start + e.span <= slotNow
                const live = e.start <= slotNow && e.start + e.span > slotNow
                const color = ROLE_COLOR_CLASS[roleById.get(e.roleId)?.color ?? 1]
                return (
                  <li
                    key={e.id}
                    className={cn(
                      'flex items-center gap-3 rounded-lg border-l-[3px] px-3 py-2.5',
                      color.bar,
                      live ? color.soft : 'bg-transparent',
                      past && 'opacity-60',
                    )}
                  >
                    <span className="tabular w-24 shrink-0 text-xs text-subtle">{blockRange(e)}</span>
                    <span className={cn('min-w-0 flex-1 truncate text-sm font-medium', e.done && 'text-subtle line-through')}>
                      {e.title}
                    </span>
                    {live && <Badge tone="primary">Ahora</Badge>}
                    {e.done && <Check size={14} className="text-success" aria-label="Cumplido" />}
                  </li>
                )
              })}
            </ol>
          )}
        </Card>
      </div>

      {/* Roles de la semana */}
      <Card>
        <CardHeader
          title="Rendimiento por rol · esta semana"
          description={weekPerf.pct === null ? 'Aún no planificaste esta semana' : `Global: ${weekPerf.pct}% · ${weekPerf.goalsDone}/${weekPerf.goalsTotal} metas cumplidas`}
          icon={Gauge}
          action={<CardLink href="/performance">Ver detalle</CardLink>}
        />
        <div className="p-5">
          <RolePerformanceList roles={roles} goals={weeklyGoals} blocks={blocks} weekStart={weekStart} columns={4} />
        </div>
      </Card>

      {/* Fila 2: metas + gastos */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Metas en curso"
            description={`${goals.length - activeGoals.length} de ${goals.length} completadas`}
            icon={Target}
            action={<CardLink href="/goals">Ver metas</CardLink>}
          />
          {topGoals.length === 0 ? (
            <EmptyState icon={Target} title="Sin metas activas" description="¡Todo completado! Define una nueva meta." />
          ) : (
            <ul className="grid gap-x-8 gap-y-5 p-5 sm:grid-cols-2">
              {topGoals.map((g) => (
                <li key={g.id}>
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{g.title}</p>
                      <p className="text-xs text-subtle">
                        {GOAL_TYPE_LABEL[g.type]} · vence {formatDate(g.dueDate)}
                      </p>
                    </div>
                    <span className="tabular text-sm font-semibold">{g.progress}%</span>
                  </div>
                  <Progress value={g.progress} label={`Progreso de ${g.title}`} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Gastos del mes"
            description="Por categoría"
            icon={Wallet}
            action={<CardLink href="/finances">Finanzas</CardLink>}
          />
          <div className="p-5">
            <ExpenseBreakdown transactions={monthTx} />
          </div>
        </Card>
      </div>

      {/* Fila 3: transacciones + frase */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Últimas transacciones"
            icon={Wallet}
            action={<CardLink href="/finances">Ver todas</CardLink>}
          />
          {recentTx.length === 0 ? (
            <EmptyState icon={Wallet} title="Sin transacciones" />
          ) : (
            <ul className="divide-y">
              {recentTx.map((t) => (
                <li key={t.id} className="flex items-center gap-4 px-5 py-3">
                  <span
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                      t.type === 'income' ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger',
                    )}
                    aria-label={t.type === 'income' ? 'Ingreso' : 'Gasto'}
                  >
                    {t.type === 'income' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{t.description}</span>
                    <span className="block text-xs text-subtle">
                      {t.category} · {formatDate(t.date)}
                    </span>
                  </span>
                  <span
                    className={cn(
                      'tabular text-sm font-semibold',
                      t.type === 'income' ? 'text-success' : 'text-foreground',
                    )}
                  >
                    {t.type === 'income' ? '+' : '−'}
                    {formatMoney(t.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="flex flex-col">
          <CardHeader title="Inspiración" icon={Quote} action={<CardLink href="/notes">Notas</CardLink>} />
          {featured ? (
            <figure className="flex flex-1 flex-col justify-center p-6">
              <Quote size={28} className="mb-3 text-primary/40" aria-hidden />
              <blockquote className="text-base leading-relaxed">{featured.content}</blockquote>
              <figcaption className="mt-3 text-xs text-subtle">{featured.title}</figcaption>
            </figure>
          ) : (
            <EmptyState icon={Quote} title="Fija una frase" description="Las notas fijadas aparecerán aquí." />
          )}
        </Card>
      </div>
    </div>
  )
}
