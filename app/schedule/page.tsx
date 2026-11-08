'use client'

import { useState } from 'react'
import { Plus, Clock, Trash2, Calendar } from 'lucide-react'

interface ScheduleItem {
  id: string
  title: string
  startTime: string
  endTime: string
  day: string
  color: string
}

const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

const mockSchedule: ScheduleItem[] = [
  {
    id: '1',
    title: 'Meditación',
    startTime: '06:00',
    endTime: '06:30',
    day: 'Lunes',
    color: 'bg-blue-100 border-blue-400',
  },
  {
    id: '2',
    title: 'Ejercicio',
    startTime: '06:30',
    endTime: '07:30',
    day: 'Lunes',
    color: 'bg-green-100 border-green-400',
  },
  {
    id: '3',
    title: 'Trabajo',
    startTime: '09:00',
    endTime: '17:00',
    day: 'Lunes',
    color: 'bg-purple-100 border-purple-400',
  },
]

export default function SchedulePage() {
  const [schedule, setSchedule] = useState<ScheduleItem[]>(mockSchedule)
  const [showForm, setShowForm] = useState(false)

  const deleteItem = (id: string) => {
    setSchedule(schedule.filter((item) => item.id !== id))
  }

  const getItemsByDay = (day: string) => {
    return schedule
      .filter((item) => item.day === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-4xl font-bold mb-2">Mi Cronograma</h1>
          <p className="text-gray-600">Organiza tu tiempo de forma efectiva</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={20} /> Nuevo Evento
        </button>
      </div>

      {showForm && (
        <div className="card mb-8">
          <h2 className="text-2xl font-bold mb-6">Crear Evento</h2>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Título del Evento</label>
              <input
                type="text"
                placeholder="Ej: Reunión importante"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Día</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600">
                  {daysOfWeek.map((day) => (
                    <option key={day}>{day}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Hora Inicio</label>
                <input
                  type="time"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Hora Fin</label>
                <input
                  type="time"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <button type="submit" className="btn btn-primary">
                Crear Evento
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-12">
        {daysOfWeek.map((day) => {
          const dayItems = getItemsByDay(day)
          return (
            <div key={day}>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Calendar size={24} /> {day}
              </h2>
              {dayItems.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Sin eventos programados</p>
              ) : (
                <div className="space-y-2">
                  {dayItems.map((item) => (
                    <div key={item.id} className={`border-l-4 p-4 rounded-lg ${item.color}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-lg">{item.title}</h3>
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <Clock size={16} /> {item.startTime} - {item.endTime}
                          </p>
                        </div>
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
