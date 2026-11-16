'use client'

import { useEffect } from 'react'
import { create } from 'zustand'
import { Monitor, Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'
import { THEME_STORAGE_KEY, type Theme } from '@/lib/theme'

const STORAGE_KEY = THEME_STORAGE_KEY

function applyTheme(theme: Theme) {
  const dark =
    theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark)
}

const useThemeStore = create<{ theme: Theme; ready: boolean; setTheme: (t: Theme) => void; init: () => void }>(
  (set, get) => ({
    theme: 'system',
    ready: false,
    setTheme: (t) => {
      localStorage.setItem(STORAGE_KEY, t)
      applyTheme(t)
      set({ theme: t })
    },
    init: () => {
      if (get().ready) return
      set({ theme: (localStorage.getItem(STORAGE_KEY) as Theme) || 'system', ready: true })
    },
  }),
)

export function useTheme() {
  const { theme, setTheme, init } = useThemeStore()

  useEffect(() => init(), [init])

  // Seguir los cambios del sistema operativo cuando el tema es "Sistema"
  useEffect(() => {
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyTheme('system')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [theme])

  return { theme, setTheme }
}

const options: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Oscuro', icon: Moon },
  { value: 'system', label: 'Sistema', icon: Monitor },
]

/** Selector de tema de tres opciones (para la barra lateral). */
export function ThemeSwitcher({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  return (
    <div role="radiogroup" aria-label="Tema" className={cn('grid grid-cols-3 rounded-lg border bg-surface-2 p-0.5', className)}>
      {options.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          role="radio"
          aria-checked={theme === value}
          title={label}
          onClick={() => setTheme(value)}
          className={cn(
            'flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors',
            theme === value ? 'bg-surface text-foreground shadow-card' : 'text-subtle hover:text-foreground',
          )}
        >
          <Icon size={14} aria-hidden />
          {label}
        </button>
      ))}
    </div>
  )
}

/** Botón rápido claro/oscuro (para la barra superior). */
export function ThemeToggleButton() {
  const { setTheme } = useTheme()
  const toggle = () => setTheme(document.documentElement.classList.contains('dark') ? 'light' : 'dark')
  return (
    <button onClick={toggle} className="btn-icon h-9 w-9" aria-label="Cambiar modo claro/oscuro" title="Cambiar tema">
      <Sun size={18} className="hidden dark:block" />
      <Moon size={18} className="dark:hidden" />
    </button>
  )
}
