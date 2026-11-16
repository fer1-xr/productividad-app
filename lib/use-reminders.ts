'use client'

import { useEffect } from 'react'
import { create } from 'zustand'
import { blockStart, REMINDER_MINUTES } from './calendar'
import { useStore } from './store'
import { mondayOf } from './utils'

const KEY = 'reminders-enabled'

interface ReminderState {
  enabled: boolean
  permission: NotificationPermission | 'unsupported'
  init: () => void
  enable: () => Promise<boolean>
  disable: () => void
}

export const useReminderSettings = create<ReminderState>((set) => ({
  enabled: false,
  permission: 'default',
  init: () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return set({ permission: 'unsupported' })
    set({ permission: Notification.permission, enabled: localStorage.getItem(KEY) === '1' && Notification.permission === 'granted' })
  },
  enable: async () => {
    if (!('Notification' in window)) return false
    const p = await Notification.requestPermission()
    set({ permission: p })
    if (p !== 'granted') return false
    localStorage.setItem(KEY, '1')
    set({ enabled: true })
    new Notification('Recordatorios activados', { body: `Te avisaremos ${REMINDER_MINUTES} minutos antes de cada bloque del plan semanal.` })
    return true
  },
  disable: () => {
    localStorage.setItem(KEY, '0')
    set({ enabled: false })
  },
}))

/** Revisa cada 30 s los bloques de esta semana y avisa 10 min antes (mientras la app esté abierta). */
export function useBlockReminders() {
  const { enabled, init } = useReminderSettings()
  useEffect(() => init(), [init])

  useEffect(() => {
    if (!enabled) return
    const check = () => {
      const { blocks, roles } = useStore.getState()
      const week = mondayOf()
      const now = Date.now()
      for (const b of blocks) {
        if (b.weekStart !== week || b.done) continue
        const diff = blockStart(b).getTime() - now
        const key = `notified-${b.id}`
        if (diff > 0 && diff <= REMINDER_MINUTES * 60_000 && !sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, '1')
          const role = roles.find((r) => r.id === b.roleId)
          new Notification(`En ${Math.max(1, Math.round(diff / 60_000))} min: ${b.title}`, {
            body: role ? `Rol: ${role.name}` : undefined,
            tag: b.id,
          })
        }
      }
    }
    check()
    const t = setInterval(check, 30_000)
    return () => clearInterval(t)
  }, [enabled])
}
