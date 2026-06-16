import React, { useState } from 'react'
import { supabase } from '../lib/supabase.js'

export default function PaymentModal({ coachId, clientId, clients, sessions, onClose, onSaved }) {
  const [selectedClient, setSelectedClient] = useState(clientId || '')
  const [selectedSession, setSelectedSession] = useState('')
  const [amount, setAmount] = useState('')
  const [reference, setReference] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Si es coach, puede seleccionar cliente; si es client, usa su propio id
  const isCoach = !!coachId

  async function handleSave() {
    if (!selectedClient || !selectedSession || !amount) {
      setError('Completa todos los campos requeridos')
      return
    }
    setLoading(true)
    setError('')

    const { error: err } = await supabase.from('payments').insert({
      session_id: selectedSession,
      client_id: selectedClient || clientId,
      amount: Number(amount),
      currency: 'CLP',
      payment_method: 'transferencia_bci',
      status: 'pending',
      reference_number: reference,
    })

    if (err) setError('Error al guardar: ' + err.message)
    else onSaved()
    setLoading(false)
  }

  const filteredSessions = sessions?.filter(s =>
    selectedClient ? s.client_id === selectedClient : s.client_id === clientId
  ) || []

  function formatDate(dt) {
    if (!dt) return '-'
    return new Date(dt).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center sm:items-center">
      <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-800">Registrar Pago</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <div className="space-y-4">
          {isCoach && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
              <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)} className="input-field">
                <option value="">Seleccionar cliente...</option>
                {clients?.map(c => (
                  <option key={c.id} value={c.id}>{c.full_name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sesión *</label>
            <select value={selectedSession} onChange={e => setSelectedSession(e.target.value)} className="input-field">
              <option value="">Seleccionar sesión...</option>
              {filteredSessions.map(s => (
                <option key={s.id} value={s.id}>{formatDate(s.session_date)} — {s.description || 'Sesión'}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monto (CLP) *</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="Ej: 50000"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">N° de referencia / comprobante</label>
            <input
              type="text"
              value={reference}
              onChange={e => setReference(e.target.value)}
              placeholder="Ej: 1234567890"
              className="input-field"
            />
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-700">
            🏦 El pago quedará en estado "Pendiente" hasta que Andrea confirme la transferencia BCI.
          </div>

          {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={loading} className="flex-1 btn-primary py-2.5 text-sm">
            {loading ? 'Guardando...' : 'Registrar Pago'}
          </button>
        </div>
      </div>
    </div>
  )
}
