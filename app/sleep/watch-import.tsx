'use client'

import { useState, type ChangeEvent } from 'react'
import { Check, FileUp, Watch } from 'lucide-react'
import { Field, Modal } from '../components/ui'
import { useStore } from '@/lib/store'
import { guessColumn, parseCSV, parseXiaomi, scoreToQuality, toDate, toHours } from '@/lib/sleep-import'
import type { ImportedNight } from '@/lib/wellbeing'
import { formatDate } from '@/lib/utils'

type Unit = 'auto' | 'min' | 'h'

export function WatchImportModal({ onClose }: { onClose: () => void }) {
  const importSleep = useStore((s) => s.importSleep)
  const [rows, setRows] = useState<string[][] | null>(null)
  const [fileName, setFileName] = useState('')
  const [xiaomi, setXiaomi] = useState<ImportedNight[] | null>(null)
  const [dateCol, setDateCol] = useState(-1)
  const [durCol, setDurCol] = useState(-1)
  const [scoreCol, setScoreCol] = useState(-1)
  const [unit, setUnit] = useState<Unit>('auto')
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setResult(null)
    setFileName(file.name)
    const parsed = parseCSV(await file.text())
    if (parsed.length < 2) {
      setError('El archivo no tiene filas de datos.')
      setRows(null)
      return
    }
    setRows(parsed)
    const xi = parseXiaomi(parsed)
    setXiaomi(xi)
    const head = parsed[0].map((h) => h.trim().toLowerCase())
    setDateCol(guessColumn(head, [/fecha|date|day|día|dia/, /time|hora/]))
    setDurCol(guessColumn(head, [/total.*(sleep|sueño)|(sleep|sueño).*(dur|total|time|tiempo)/, /dur|horas|hours|minutes|minutos|sleep|sueño/]))
    setScoreCol(guessColumn(head, [/score|puntua|calidad|quality/]))
  }

  const nights: ImportedNight[] = xiaomi
    ? xiaomi
    : rows && dateCol >= 0 && durCol >= 0
      ? rows
          .slice(1)
          .map((r) => {
            const date = toDate(r[dateCol] ?? '')
            const hours = toHours(r[durCol] ?? '', unit)
            if (!date || !hours || hours > 16) return null
            const score = scoreCol >= 0 ? parseFloat((r[scoreCol] ?? '').replace(',', '.')) : null
            return { date, hours: Math.round(hours * 10) / 10, quality: scoreToQuality(score !== null && !isNaN(score) ? score : null, hours) }
          })
          .filter((n): n is ImportedNight => !!n)
      : []

  const doImport = () => {
    const r = importSleep(nights)
    setResult(`Listo: ${r.created} noches nuevas y ${r.updated} actualizadas.`)
  }

  const headers = rows?.[0] ?? []

  return (
    <Modal open onClose={onClose} title="Importar datos del reloj" description="Xiaomi Redmi Watch / Smart Band (Mi Fitness o Zepp Life) u otro reloj">
      <div className="space-y-4">
        <ol className="list-decimal space-y-1 pl-5 text-sm text-muted">
          <li>
            Pide la exportación de tus datos en{' '}
            <a href="https://account.xiaomi.com" target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
              account.xiaomi.com
            </a>{' '}
            → Privacidad → Gestionar tus datos → Exportar (Mi Fitness). En Zepp Life: Perfil → Configuración → Exportar datos.
          </li>
          <li>Descomprime el archivo que te llega por correo y elige el CSV de sueño (o el de datos de salud).</li>
        </ol>

        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center hover:border-primary/50 hover:bg-primary-soft/30">
          <FileUp size={22} className="text-primary" />
          <span className="text-sm font-medium">{fileName || 'Elegir archivo CSV'}</span>
          <span className="text-xs text-subtle">Se procesa en tu navegador; no se sube a ningún servidor.</span>
          <input type="file" accept=".csv,text/csv" className="sr-only" onChange={onFile} />
        </label>

        {error && <p className="text-sm text-danger">{error}</p>}

        {rows && !xiaomi && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Columna de fecha">
              <select className="input" value={dateCol} onChange={(e) => setDateCol(Number(e.target.value))}>
                <option value={-1}>— Elegir —</option>
                {headers.map((h, i) => (
                  <option key={i} value={i}>{h || `Columna ${i + 1}`}</option>
                ))}
              </select>
            </Field>
            <Field label="Columna de duración del sueño">
              <select className="input" value={durCol} onChange={(e) => setDurCol(Number(e.target.value))}>
                <option value={-1}>— Elegir —</option>
                {headers.map((h, i) => (
                  <option key={i} value={i}>{h || `Columna ${i + 1}`}</option>
                ))}
              </select>
            </Field>
            <Field label="Unidad de la duración">
              <select className="input" value={unit} onChange={(e) => setUnit(e.target.value as Unit)}>
                <option value="auto">Detectar automáticamente</option>
                <option value="min">Minutos</option>
                <option value="h">Horas</option>
              </select>
            </Field>
            <Field label="Puntuación de sueño (opcional)">
              <select className="input" value={scoreCol} onChange={(e) => setScoreCol(Number(e.target.value))}>
                <option value={-1}>— Ninguna —</option>
                {headers.map((h, i) => (
                  <option key={i} value={i}>{h || `Columna ${i + 1}`}</option>
                ))}
              </select>
            </Field>
          </div>
        )}

        {xiaomi && (
          <p className="flex items-center gap-2 text-sm text-success">
            <Watch size={16} /> Formato de Xiaomi detectado automáticamente.
          </p>
        )}

        {rows && (
          <div className="rounded-lg border">
            <p className="border-b px-3 py-2 text-xs font-medium text-muted">Vista previa · {nights.length} noches encontradas</p>
            {nights.length === 0 ? (
              <p className="px-3 py-3 text-sm text-subtle">Elige las columnas de fecha y duración para ver las noches.</p>
            ) : (
              <ul className="divide-y text-sm">
                {[...nights].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5).map((n) => (
                  <li key={n.date} className="flex justify-between px-3 py-1.5">
                    <span className="first-letter:uppercase">{formatDate(n.date, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                    <span className="tabular text-muted">
                      {n.hours} h · calidad {n.quality}/5
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {result && (
          <p className="flex items-center gap-2 text-sm font-medium text-success">
            <Check size={16} /> {result}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="btn-secondary">{result ? 'Cerrar' : 'Cancelar'}</button>
          {!result && (
            <button onClick={doImport} disabled={!nights.length} className="btn-primary">
              Importar {nights.length || ''} noches
            </button>
          )}
        </div>
      </div>
    </Modal>
  )
}
