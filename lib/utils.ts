export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

/** Fecha local en formato YYYY-MM-DD */
export function toISODate(date: Date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return toISODate(d)
}

export function parseISODate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** 0 = Lunes … 6 = Domingo */
export function weekdayIndex(date: Date = new Date()) {
  return (date.getDay() + 6) % 7
}

export const WEEKDAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
export const WEEKDAYS_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

/** $1.234,56 — punto para miles y coma para decimales */
export function formatMoney(value: number) {
  const sign = value < 0 ? '-' : ''
  const [int, dec] = Math.abs(value).toFixed(2).split('.')
  return `${sign}$${int.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${dec}`
}

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }) {
  return parseISODate(iso).toLocaleDateString('es', opts)
}

export function isSameMonth(iso: string, ref: Date = new Date()) {
  const d = parseISODate(iso)
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth()
}

export function greeting(date: Date = new Date()) {
  const h = date.getHours()
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}
