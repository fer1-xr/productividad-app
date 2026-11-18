'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import {
  CalendarDays,
  CheckCircle2,
  CircleDot,
  Gauge,
  Grid2x2,
  LayoutDashboard,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  RotateCcw,
  StickyNote,
  Sunrise,
  Target,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useStore } from '@/lib/store'
import { useBlockReminders } from '@/lib/use-reminders'
import { cn } from '@/lib/utils'
import { ThemeSwitcher, ThemeToggleButton } from './theme-toggle'

interface NavItem {
  name: string
  path: string
  icon: LucideIcon
}

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: 'General',
    items: [
      { name: 'Resumen', path: '/', icon: LayoutDashboard },
      { name: 'Ritual matutino', path: '/ritual', icon: Sunrise },
    ],
  },
  {
    label: 'Seguimiento',
    items: [
      { name: 'Plan semanal', path: '/schedule', icon: CalendarDays },
      { name: 'Rendimiento por rol', path: '/performance', icon: Gauge },
      { name: 'Hábitos', path: '/habits', icon: CheckCircle2 },
      { name: 'Metas', path: '/goals', icon: Target },
      { name: 'Matriz Eisenhower', path: '/eisenhower', icon: Grid2x2 },
    ],
  },
  {
    label: 'Bienestar',
    items: [
      { name: 'Rueda de la vida', path: '/wheel', icon: CircleDot },
      { name: 'Sueño y energía', path: '/sleep', icon: Moon },
    ],
  },
  {
    label: 'Gestión',
    items: [
      { name: 'Finanzas', path: '/finances', icon: Wallet },
      { name: 'Notas', path: '/notes', icon: StickyNote },
    ],
  },
]

const allItems = navGroups.flatMap((g) => g.items)

function Brand({ collapsed }: { collapsed?: boolean }) {
  return (
    <Link href="/" className={cn('flex items-center gap-2.5', collapsed ? 'mx-auto' : 'px-2')} title="Productividad Pro">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
        P
      </span>
      {!collapsed && <span className="text-sm font-semibold tracking-tight">Productividad Pro</span>}
    </Link>
  )
}

function SidebarContent({
  pathname,
  onNavigate,
  collapsed = false,
  onToggleCollapse,
}: {
  pathname: string
  onNavigate?: () => void
  collapsed?: boolean
  onToggleCollapse?: () => void
}) {
  const resetDemo = useStore((s) => s.resetDemo)
  const reset = () => {
    if (confirm('¿Restablecer todos los datos de ejemplo? Se perderán tus cambios.')) resetDemo()
  }

  return (
    <div className="flex h-full flex-col">
      <div className={cn('flex h-16 items-center', collapsed ? 'px-2' : 'px-3')}>
        <Brand collapsed={collapsed} />
      </div>

      <nav className={cn('flex-1 overflow-y-auto py-4', collapsed ? 'space-y-3 px-2' : 'space-y-6 px-3')} aria-label="Principal">
        {navGroups.map((group, gi) => (
          <div key={group.label}>
            {collapsed ? (
              gi > 0 && <div className="mx-2 mb-3 border-t" aria-hidden />
            ) : (
              <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-subtle">{group.label}</p>
            )}
            <ul className="space-y-0.5">
              {group.items.map(({ name, path, icon: Icon }) => {
                const active = pathname === path || (path !== '/' && pathname.startsWith(path + '/'))
                return (
                  <li key={path}>
                    <Link
                      href={path}
                      onClick={onNavigate}
                      aria-current={active ? 'page' : undefined}
                      aria-label={collapsed ? name : undefined}
                      title={collapsed ? name : undefined}
                      className={cn(
                        'flex items-center rounded-lg py-2 text-sm font-medium transition-colors',
                        collapsed ? 'justify-center px-0' : 'gap-3 px-3',
                        active ? 'bg-primary-soft text-primary' : 'text-muted hover:bg-surface-2 hover:text-foreground',
                      )}
                    >
                      <Icon size={18} aria-hidden />
                      {!collapsed && name}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className={cn('space-y-3 border-t', collapsed ? 'p-2' : 'p-3')}>
        {!collapsed && (
          <div>
            <p className="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-wider text-subtle">Apariencia</p>
            <ThemeSwitcher />
          </div>
        )}
        {collapsed ? (
          <button onClick={reset} className="btn-icon mx-auto flex h-9 w-9" title="Restablecer datos de ejemplo" aria-label="Restablecer datos de ejemplo">
            <RotateCcw size={16} />
          </button>
        ) : (
          <button onClick={reset} className="btn-ghost w-full justify-start px-2 text-xs">
            <RotateCcw size={14} /> Restablecer datos de ejemplo
          </button>
        )}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            aria-expanded={!collapsed}
            title={collapsed ? 'Fijar menú expandido' : 'Contraer menú'}
            className={cn('btn-ghost w-full text-xs', collapsed ? 'justify-center px-0' : 'justify-start px-2')}
          >
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={14} />}
            {!collapsed && 'Contraer menú'}
            <span className="sr-only">{collapsed ? 'Expandir menú' : ''}</span>
          </button>
        )}
      </div>
    </div>
  )
}

function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-6" aria-busy="true" aria-label="Cargando">
      <div className="h-8 w-48 rounded-lg bg-surface-2" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-surface-2" />
        ))}
      </div>
      <div className="h-72 rounded-xl bg-surface-2" />
    </div>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  useBlockReminders()

  // Preferencia del menú lateral (fijo o contraído), guardada en el navegador
  useEffect(() => {
    setCollapsed(localStorage.getItem('sidebar-collapsed') === '1')
  }, [])
  const toggleCollapsed = () =>
    setCollapsed((c) => {
      localStorage.setItem('sidebar-collapsed', c ? '0' : '1')
      return !c
    })
  const [hydrated, setHydrated] = useState(false)

  // Cargar datos guardados en el navegador (evita desajustes de hidratación SSR)
  useEffect(() => {
    Promise.resolve(useStore.persist.rehydrate()).finally(() => setHydrated(true))
  }, [])

  useEffect(() => setMobileOpen(false), [pathname])

  const current = allItems.find((i) => i.path === pathname) ?? allItems.find((i) => i.path !== '/' && pathname.startsWith(i.path))

  return (
    <div className="min-h-screen">
      {/* Sidebar escritorio */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 hidden border-r bg-surface transition-[width] duration-200 lg:block',
          collapsed ? 'w-16' : 'w-64',
        )}
      >
        <SidebarContent pathname={pathname} collapsed={collapsed} onToggleCollapse={toggleCollapsed} />
      </aside>

      {/* Sidebar móvil */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} aria-hidden />
          <aside className="absolute inset-y-0 left-0 w-72 border-r bg-surface shadow-pop">
            <button
              onClick={() => setMobileOpen(false)}
              className="btn-icon absolute right-3 top-4"
              aria-label="Cerrar menú"
            >
              <X size={18} />
            </button>
            <SidebarContent pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className={cn('transition-[padding] duration-200', collapsed ? 'lg:pl-16' : 'lg:pl-64')}>
        {/* Barra superior */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur sm:px-6 lg:px-8">
          <button
            onClick={() => setMobileOpen(true)}
            className="btn-icon h-9 w-9 lg:hidden"
            aria-label="Abrir menú"
          >
            <Menu size={20} />
          </button>
          <div className="flex min-w-0 items-center gap-2 text-sm">
            <span className="hidden text-subtle sm:inline">Productividad Pro</span>
            <span className="hidden text-subtle sm:inline">/</span>
            <span className="truncate font-medium">{current?.name ?? 'Inicio'}</span>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggleButton />
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {hydrated ? children : <PageSkeleton />}
        </main>
      </div>
    </div>
  )
}
