'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import {
  CalendarDays,
  CheckCircle2,
  Gauge,
  LayoutDashboard,
  Menu,
  RotateCcw,
  StickyNote,
  Target,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useStore } from '@/lib/store'
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
    items: [{ name: 'Resumen', path: '/', icon: LayoutDashboard }],
  },
  {
    label: 'Seguimiento',
    items: [
      { name: 'Plan semanal', path: '/schedule', icon: CalendarDays },
      { name: 'Rendimiento por rol', path: '/performance', icon: Gauge },
      { name: 'Hábitos', path: '/habits', icon: CheckCircle2 },
      { name: 'Metas', path: '/goals', icon: Target },
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

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5 px-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
        P
      </span>
      <span className="text-sm font-semibold tracking-tight">Productividad Pro</span>
    </Link>
  )
}

function SidebarContent({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const resetDemo = useStore((s) => s.resetDemo)

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-3">
        <Brand />
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4" aria-label="Principal">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-subtle">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map(({ name, path, icon: Icon }) => {
                const active = pathname === path
                return (
                  <li key={path}>
                    <Link
                      href={path}
                      onClick={onNavigate}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        active
                          ? 'bg-primary-soft text-primary'
                          : 'text-muted hover:bg-surface-2 hover:text-foreground',
                      )}
                    >
                      <Icon size={18} aria-hidden />
                      {name}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="space-y-3 border-t p-3">
        <div>
          <p className="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-wider text-subtle">Apariencia</p>
          <ThemeSwitcher />
        </div>
        <button
          onClick={() => {
            if (confirm('¿Restablecer todos los datos de ejemplo? Se perderán tus cambios.')) resetDemo()
          }}
          className="btn-ghost w-full justify-start px-2 text-xs"
        >
          <RotateCcw size={14} /> Restablecer datos de ejemplo
        </button>
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
  const [hydrated, setHydrated] = useState(false)

  // Cargar datos guardados en el navegador (evita desajustes de hidratación SSR)
  useEffect(() => {
    Promise.resolve(useStore.persist.rehydrate()).finally(() => setHydrated(true))
  }, [])

  useEffect(() => setMobileOpen(false), [pathname])

  const current = allItems.find((i) => i.path === pathname)

  return (
    <div className="min-h-screen">
      {/* Sidebar escritorio */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-surface lg:block">
        <SidebarContent pathname={pathname} />
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

      <div className="lg:pl-64">
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
