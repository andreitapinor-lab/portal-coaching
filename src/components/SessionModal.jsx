import React, { useState } from 'react'
import { supabase } from '../lib/supabase.js'

export default function SessionModal({ coachId, clients, onClose, onSaved }) {
  const [clientId, setClientId] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    if (!clientId || !date || !time) { setError('Completa todos los campos requeridos'); return }
    setLoading(true)
    setError('')

    const sessionDate = new Date(`${date}T${time}:00`).toISOString()

    const { error: err } = await supabase.from('sessions').insert({
      coach_id: coachId,
      client_id: clientId,
      session_date: sessionDate,
      description,
      status: 'scheduled'
    })

    if (err) setError('Error al guardar: ' + err.message)
    else onSaved()
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center sm:items-center">
      <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-800">Nueva Sesión</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
            <select value={clientId} onChange={e => setClientId(e.target.value)} className="input-field">
              <option value="">Seleccionar cliente...</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.full_name} — {c.email}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora *</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)} className="input-field" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción / Tema</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ej: Sesión de seguimiento objetivos Q2..."
              rows={3}
              className="input-field resize-none"
            />
          </div>

          {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={loading} className="flex-1 btn-primary py-2.5 text-sm">
            {loading ? 'Guardando...' : 'Agendar Sesión'}
          </button>
        </div>
      </div>
    </div>
  )
}
