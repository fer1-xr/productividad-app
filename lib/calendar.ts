/**
 * Integración con calendarios sin servidor:
 *  - Enlace "Añadir a Google Calendar" por bloque (plantilla de evento).
 *  - Exportación .ics de la semana con recordatorio (Google Calendar, Outlook, Apple).
 * Google Calendar envía luego las notificaciones al teléfono.
 */
import { slotTime, type Role, type TimeBlock, type WeeklyGoal } from './planner'
import { addDaysISO } from './utils'

export const REMINDER_MINUTES = 10

function stamp(dateISO: string, time: string) {
  return `${dateISO.replace(/-/g, '')}T${time.replace(':', '')}00`
}

export function blockStart(b: TimeBlock) {
  const date = addDaysISO(b.weekStart, b.day)
  const [y, m, d] = date.split('-').map(Number)
  const [hh, mm] = slotTime(b.start).split(':').map(Number)
  return new Date(y, m - 1, d, hh, mm)
}

function eventTimes(b: TimeBlock) {
  const date = addDaysISO(b.weekStart, b.day)
  const endSlot = b.start + b.span
  // 23:00 es el final del día del planificador
  return { start: stamp(date, slotTime(b.start)), end: stamp(date, endSlot >= 32 ? '23:00' : slotTime(endSlot)) }
}

function details(b: TimeBlock, role?: Role, goal?: WeeklyGoal) {
  return [role && `Rol: ${role.name}`, goal && `Meta: ${goal.title}`, 'Plan semanal · Productividad Pro'].filter(Boolean).join('\n')
}

export function googleCalendarUrl(b: TimeBlock, role?: Role, goal?: WeeklyGoal) {
  const { start, end } = eventTimes(b)
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: b.title,
    dates: `${start}/${end}`,
    details: details(b, role, goal),
    ctz: Intl.DateTimeFormat().resolvedOptions().timeZone,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

const esc = (t: string) => t.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')

export function buildICS(blocks: TimeBlock[], roles: Role[], goals: WeeklyGoal[]) {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
  const now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '')
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Productividad Pro//Plan semanal//ES', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', `X-WR-TIMEZONE:${tz}`, 'X-WR-CALNAME:Plan semanal']
  for (const b of blocks) {
    const { start, end } = eventTimes(b)
    const role = roles.find((r) => r.id === b.roleId)
    const goal = goals.find((g) => g.id === b.goalId)
    lines.push(
      'BEGIN:VEVENT',
      `UID:${b.id}@productividad-pro`,
      `DTSTAMP:${now}`,
      `DTSTART;TZID=${tz}:${start}`,
      `DTEND;TZID=${tz}:${end}`,
      `SUMMARY:${esc(b.title)}`,
      `DESCRIPTION:${esc(details(b, role, goal))}`,
      role ? `CATEGORIES:${esc(role.name)}` : '',
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${esc(b.title)}`,
      `TRIGGER:-PT${REMINDER_MINUTES}M`,
      'END:VALARM',
      'END:VEVENT',
    )
  }
  lines.push('END:VCALENDAR')
  return lines.filter(Boolean).join('\r\n')
}

export function downloadFile(name: string, content: string, type = 'text/calendar;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
