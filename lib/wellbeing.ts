/** Ritual matutino, sueño/energía y rueda de la vida. */
import { daysAgo, toISODate, uid } from './utils'

/* ---------------------------- Ritual diario ---------------------------- */

export interface DailyRitual {
  id: string
  /** YYYY-MM-DD */
  date: string
  sleepHours: number
  /** 1–5 */
  sleepQuality: number
  /** Veces que te despertaste en la noche */
  wakeUps: number
  /** 1–5 al empezar el día (null si la noche vino importada del reloj) */
  energyMorning: number | null
  /** 1–5 al cerrar el día (opcional) */
  energyEvening: number | null
  focus: string
  mit: string
  mitDone: boolean
  gratitude: string[]
  word: string
  /** De dónde vienen los datos de sueño */
  source?: 'manual' | 'watch'
  /** Minutos de sueño profundo (si el reloj lo informa) */
  deepMinutes?: number
}

export const SCALE_LABEL = ['', 'Muy baja', 'Baja', 'Normal', 'Buena', 'Excelente']

/* ---------------------------- Rueda de la vida ---------------------------- */

export const WHEEL_AREAS = [
  'Salud',
  'Familia',
  'Pareja',
  'Trabajo / Carrera',
  'Finanzas',
  'Desarrollo personal',
  'Amistades',
  'Ocio y diversión',
  'Espiritualidad',
  'Entorno / Hogar',
] as const

export interface WheelEntry {
  /** YYYY-MM */
  month: string
  /** Puntaje 1–10 por área (mismo orden que WHEEL_AREAS) */
  scores: number[]
}

export function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function shiftMonth(key: string, delta: number) {
  const [y, m] = key.split('-').map(Number)
  return monthKey(new Date(y, m - 1 + delta, 1))
}

export function monthLabel(key: string, opts: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' }) {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('es', opts)
}

/* ---------------------------- Ideas de hábitos ---------------------------- */

export const HABIT_IDEAS: Record<string, { name: string; description: string }[]> = {
  Salud: [
    { name: 'Tomar 2 litros de agua', description: 'Hidratación a lo largo del día' },
    { name: 'Caminar 8.000 pasos', description: 'Movimiento diario' },
    { name: 'Dormir antes de las 23:00', description: 'Proteger tu descanso' },
    { name: 'Estirar 10 minutos', description: 'Movilidad al despertar' },
  ],
  Productividad: [
    { name: 'Planificar el día', description: 'Definir la tarea más importante' },
    { name: '90 minutos de trabajo profundo', description: 'Sin notificaciones' },
    { name: 'Inbox cero', description: 'Procesar correos al final del día' },
  ],
  Finanzas: [
    { name: 'Registrar gastos', description: 'Anotar cada gasto del día' },
    { name: 'Sin compras impulsivas', description: 'Esperar 24 h antes de comprar' },
  ],
  Aprendizaje: [
    { name: 'Leer 20 páginas', description: 'Lectura diaria' },
    { name: 'Practicar un idioma', description: '15 minutos de práctica' },
    { name: 'Escuchar un podcast educativo', description: 'Aprender en traslados' },
  ],
  Relaciones: [
    { name: 'Llamar a un ser querido', description: 'Mantener el vínculo' },
    { name: 'Cena sin pantallas', description: 'Tiempo de calidad en familia' },
    { name: 'Agradecer a alguien', description: 'Un mensaje de gratitud' },
  ],
  Espiritualidad: [
    { name: 'Rezar el Rosario', description: 'Los misterios del día' },
    { name: 'Examen de conciencia', description: 'Unos minutos antes de dormir' },
    { name: 'Rezar por tres intenciones', description: 'Un Padre Nuestro y un Ave María por cada una' },
  ],
}

/* ---------------------------- Datos de ejemplo ---------------------------- */

const FOCUS = ['Propuesta del proyecto', 'Curso de inglés', 'Plan trimestral', 'Presupuesto familiar']
const MITS = [
  'Terminar el borrador de la propuesta',
  'Preparar la reunión del equipo',
  'Estudiar la unidad 3 de inglés',
  'Revisar el presupuesto semanal',
  'Enviar el informe mensual',
  'Definir los objetivos del trimestre',
]
const GRATITUDE = ['Mi familia', 'Mi salud', 'Un buen café', 'Mi trabajo', 'Un amigo que me escuchó', 'El sol de la mañana', 'Aprender algo nuevo']
const WORDS = ['Enfoque', 'Calma', 'Gratitud', 'Disciplina', 'Presencia', 'Constancia', 'Coraje']

export function seedWellbeing() {
  const rituals: DailyRitual[] = []
  // 21 días de registros (algunos días sin completar, como en la vida real)
  for (let i = 21; i >= 1; i--) {
    if (i % 6 === 4) continue
    const hours = [6, 6.5, 7, 7.5, 8, 5.5, 7, 8, 6.5][i % 9]
    const quality = Math.max(1, Math.min(5, Math.round(hours - 3.5 + ((i * 7) % 3) - 1)))
    const energyMorning = Math.max(1, Math.min(5, quality + ((i % 4) === 0 ? -1 : 0)))
    rituals.push({
      id: uid(),
      date: daysAgo(i),
      sleepHours: hours,
      sleepQuality: quality,
      wakeUps: hours < 6.5 ? 2 : hours < 7.5 ? 1 : 0,
      energyMorning,
      energyEvening: Math.max(1, energyMorning - (i % 2)),
      focus: FOCUS[i % FOCUS.length],
      mit: MITS[i % MITS.length],
      mitDone: i % 5 !== 2,
      gratitude: [GRATITUDE[i % 7], GRATITUDE[(i + 3) % 7], GRATITUDE[(i + 5) % 7]],
      word: WORDS[i % WORDS.length],
    })
  }

  const current = monthKey()
  const wheel: WheelEntry[] = [
    { month: shiftMonth(current, -3), scores: [5, 7, 6, 7, 4, 6, 5, 4, 5, 6] },
    { month: shiftMonth(current, -2), scores: [6, 7, 6, 8, 4, 6, 5, 5, 5, 6] },
    { month: shiftMonth(current, -1), scores: [6, 8, 7, 7, 5, 7, 6, 5, 6, 7] },
  ]
  return { rituals, wheel }
}

export function todayKey() {
  return toISODate()
}

/* ---------------------------- Importación desde el reloj ---------------------------- */

export interface ImportedNight {
  date: string
  hours: number
  quality: number
  wakeUps?: number
  deepMinutes?: number
}
