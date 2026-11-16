/**
 * Lectura de datos de sueño exportados desde el reloj.
 *  - Exportación de Xiaomi (Mi Fitness / Zepp Life): filas con columnas Key / Time / Value,
 *    donde Value es un JSON con la duración y la puntuación del sueño.
 *  - Cualquier CSV con una columna de fecha y otra de duración (minutos, horas o hh:mm).
 */
import type { ImportedNight } from './wellbeing'
import { toISODate } from './utils'

export function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  const delim = (text.split('\n')[0].match(/;/g)?.length ?? 0) > (text.split('\n')[0].match(/,/g)?.length ?? 0) ? ';' : ','
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"'
        i++
      } else if (ch === '"') quoted = false
      else cell += ch
    } else if (ch === '"') quoted = true
    else if (ch === delim) {
      row.push(cell)
      cell = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(cell)
      if (row.some((c) => c.trim())) rows.push(row)
      row = []
      cell = ''
    } else cell += ch
  }
  row.push(cell)
  if (row.some((c) => c.trim())) rows.push(row)
  return rows
}

export function toDate(v: string): string | null {
  const t = v.trim()
  if (!t) return null
  if (/^\d{9,13}$/.test(t)) {
    const n = Number(t)
    return toISODate(new Date(t.length > 10 ? n : n * 1000))
  }
  const m = t.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/) // dd/mm/aaaa
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  const d = new Date(t)
  return isNaN(d.getTime()) ? null : toISODate(d)
}

/** Devuelve horas a partir de minutos, horas o "hh:mm". */
export function toHours(v: string, unit: 'auto' | 'min' | 'h'): number | null {
  const t = v.trim().replace(',', '.')
  if (!t) return null
  const hm = t.match(/^(\d{1,2}):(\d{2})/)
  if (hm) return Number(hm[1]) + Number(hm[2]) / 60
  const n = parseFloat(t)
  if (isNaN(n) || n <= 0) return null
  if (unit === 'min' || (unit === 'auto' && n > 24)) return n / 60
  return n
}

export function scoreToQuality(score: number | null, hours: number) {
  if (score !== null && !isNaN(score)) return Math.max(1, Math.min(5, Math.ceil(score / 20)))
  // Sin puntuación: estimación por horas
  return hours >= 8 ? 4 : hours >= 7 ? 4 : hours >= 6 ? 3 : hours >= 5 ? 2 : 1
}

const round1 = (n: number) => Math.round(n * 10) / 10

/** Formato de exportación de Xiaomi (Key / Time / Value JSON). */
export function parseXiaomi(rows: string[][]): ImportedNight[] | null {
  const head = rows[0].map((h) => h.trim().toLowerCase())
  const iKey = head.indexOf('key')
  const iVal = head.indexOf('value')
  const iTime = head.indexOf('time')
  if (iKey < 0 || iVal < 0 || iTime < 0) return null
  const nights = new Map<string, ImportedNight>()
  for (const r of rows.slice(1)) {
    if (!/sleep/i.test(r[iKey] ?? '')) continue
    let v: Record<string, number>
    try {
      v = JSON.parse(r[iVal])
    } catch {
      continue
    }
    const minutes = v.total_duration ?? v.duration ?? v.sleep_duration ?? (v.sleep_deep_duration ?? 0) + (v.sleep_light_duration ?? 0) + (v.sleep_rem_duration ?? 0)
    if (!minutes) continue
    const wake = v.wake_up_time ?? v.sleep_end_time ?? Number(r[iTime])
    const date = toDate(String(wake))
    if (!date) continue
    const hours = minutes / 60
    const score = v.sleep_score ?? v.score ?? null
    nights.set(date, {
      date,
      hours: round1(hours),
      quality: scoreToQuality(score, hours),
      wakeUps: v.awake_count ?? v.wake_count,
      deepMinutes: v.sleep_deep_duration ?? v.deep_duration,
    })
  }
  return nights.size ? Array.from(nights.values()) : null
}

export function guessColumn(headers: string[], patterns: RegExp[]) {
  const i = headers.findIndex((h) => patterns.some((p) => p.test(h)))
  return i
}
