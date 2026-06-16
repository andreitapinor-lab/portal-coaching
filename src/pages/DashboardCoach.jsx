import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import SessionModal from '../components/SessionModal.jsx'
import PaymentModal from '../components/PaymentModal.jsx'

const NAV = [
  { id: 'dashboard', label: 'Inicio', icon: '🏠' },
  { id: 'sessions', label: 'Sesiones', icon: '📅' },
  { id: 'clients', label: 'Clientes', icon: '👥' },
  { id: 'payments', label: 'Pagos', icon: '💳' },
]

export default function DashboardCoach({ user }) {
  const [tab, setTab] = useState('dashboard')
  const [sessions, setSessions] = useState([])
  const [clients, setClients] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showSessionModal, setShowSessionModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedSession, setSelectedSession] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [{ data: sess }, { data: cli }, { data: pay }] = await Promise.all([
      supabase.from('sessions').select('*, client:client_id(full_name, email)').order('session_date', { ascending: false }),
      supabase.from('users').select('*').eq('role', 'client').order('created_at', { ascending: false }),
      supabase.from('payments').select('*, client:client_id(full_name), session:session_id(session_date)').order('created_at', { ascending: false }),
    ])
    setSessions(sess || [])
    setClients(cli || [])
    setPayments(pay || [])
    setLoading(false)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  const upcoming = sessions.filter(s => s.status === 'scheduled' && new Date(s.session_date) >= new Date())
  const completed = sessions.filter(s => s.status === 'completed')
  const pendingPay = payments.filter(p => p.status === 'pending')
  const totalPaid = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + Number(p.amount), 0)

  function formatDate(dt) {
    if (!dt) return '-'
    return new Date(dt).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  function statusBadge(s) {
    const map = { scheduled: 'badge-scheduled', completed: 'badge-completed', cancelled: 'badge-cancelled', pending: 'badge-pending' }
    const label = { scheduled: 'Programada', completed: 'Realizada', cancelled: 'Cancelada', pending: 'Pendiente' }
    return <span className={map[s] || 'badge-scheduled'}>{label[s] || s}</span>
  }

  async function markCompleted(sessionId) {
    await supabase.from('sessions').update({ status: 'completed' }).eq('id', sessionId)
    fetchAll()
  }

  async function markPaymentDone(paymentId) {
    await supabase.from('payments').update({ status: 'completed', transaction_date: new Date().toISOString() }).eq('id', paymentId)
    fetchAll()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-opv-purple text-white px-4 py-3 flex items-center justify-between shadow-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-sm font-bold">
            {user.full_name?.charAt(0) || 'A'}
          </div>
          <div>
            <p className="text-xs text-purple-200">Coach</p>
            <p className="text-sm font-semibold leading-tight">{user.full_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowSessionModal(true)} className="bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1.5 rounded-lg transition-colors">
            + Sesión
          </button>
          <button onClick={handleSignOut} className="text-white/60 hover:text-white text-xs px-2 py-1.5 rounded transition-colors">
            Salir
          </button>
        </div>
      </header>

      {/* Nav tabs */}
      <nav className="bg-white border-b border-gray-200 sticky top-14 z-30">
        <div className="flex overflow-x-auto">
          {NAV.map(n => (
            <button
              key={n.id}
              onClick={() => setTab(n.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === n.id ? 'border-opv-purple text-opv-purple' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span>{n.icon}</span> {n.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 px-4 py-5 max-w-2xl mx-auto w-full">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-opv-purple border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* INICIO */}
            {tab === 'dashboard' && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-gray-800">Resumen</h2>
                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="card text-center">
                    <p className="text-3xl font-bold text-opv-purple">{upcoming.length}</p>
                    <p className="text-xs text-gray-500 mt-1">Próximas sesiones</p>
                  </div>
                  <div className="card text-center">
                    <p className="text-3xl font-bold text-opv-green">{clients.length}</p>
                    <p className="text-xs text-gray-500 mt-1">Clientes activos</p>
                  </div>
                  <div className="card text-center">
                    <p className="text-3xl font-bold text-sagia-gold">{pendingPay.length}</p>
                    <p className="text-xs text-gray-500 mt-1">Pagos pendientes</p>
                  </div>
                  <div className="card text-center">
                    <p className="text-xl font-bold text-gray-700">${totalPaid.toLocaleString('es-CL')}</p>
                    <p className="text-xs text-gray-500 mt-1">Total cobrado</p>
                  </div>
                </div>

                {/* Próximas sesiones */}
                <div className="card">
                  <h3 className="font-semibold text-gray-700 mb-3">Próximas sesiones</h3>
                  {upcoming.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">Sin sesiones próximas</p>
                  ) : (
                    <div className="space-y-3">
                      {upcoming.slice(0, 3).map(s => (
                        <div key={s.id} className="flex items-start justify-between gap-2 border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                          <div>
                            <p className="text-sm font-medium text-gray-800">{s.client?.full_name || 'Cliente'}</p>
                            <p className="text-xs text-gray-500">{formatDate(s.session_date)}</p>
                            {s.description && <p className="text-xs text-gray-400 mt-0.5">{s.description}</p>}
                          </div>
                          <button onClick={() => markCompleted(s.id)} className="text-xs bg-green-50 text-opv-green hover:bg-green-100 px-2 py-1 rounded whitespace-nowrap">
                            ✓ Realizada
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pagos pendientes */}
                {pendingPay.length > 0 && (
                  <div className="card border-l-4 border-sagia-gold">
                    <h3 className="font-semibold text-gray-700 mb-3">⚠️ Pagos por confirmar</h3>
                    <div className="space-y-2">
                      {pendingPay.map(p => (
                        <div key={p.id} className="flex items-center justify-between text-sm">
                          <div>
                            <p className="font-medium">{p.client?.full_name}</p>
                            <p className="text-xs text-gray-500">${Number(p.amount).toLocaleString('es-CL')} · Transferencia BCI</p>
                          </div>
                          <button onClick={() => markPaymentDone(p.id)} className="btn-secondary text-xs py-1 px-2">
                            Confirmar
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SESIONES */}
            {tab === 'sessions' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-800">Sesiones</h2>
                  <button onClick={() => setShowSessionModal(true)} className="btn-primary text-sm py-1.5 px-3">
                    + Nueva
                  </button>
                </div>
                {sessions.length === 0 ? (
                  <div className="card text-center py-10">
                    <p className="text-gray-400 text-sm">Sin sesiones aún</p>
                    <button onClick={() => setShowSessionModal(true)} className="btn-primary text-sm mt-3 px-4 py-2">
                      Agendar primera sesión
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sessions.map(s => (
                      <div key={s.id} className="card">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-800">{s.client?.full_name || 'Cliente'}</p>
                            <p className="text-xs text-gray-500">{s.client?.email}</p>
                            <p className="text-sm text-gray-600 mt-1">{formatDate(s.session_date)}</p>
                            {s.description && <p className="text-xs text-gray-400 mt-1">{s.description}</p>}
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {statusBadge(s.status)}
                            {s.status === 'scheduled' && (
                              <button onClick={() => markCompleted(s.id)} className="text-xs text-opv-green hover:underline">
                                Marcar realizada
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* CLIENTES */}
            {tab === 'clients' && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-gray-800">Clientes ({clients.length})</h2>
                {clients.length === 0 ? (
                  <div className="card text-center py-10">
                    <p className="text-gray-400 text-sm">Sin clientes aún</p>
                    <p className="text-xs text-gray-400 mt-2">Comparte el link del portal con tus clientes</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {clients.map(c => {
                      const clientSessions = sessions.filter(s => s.client_id === c.id)
                      return (
                        <div key={c.id} className="card">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-opv-purple font-bold">
                              {c.full_name?.charAt(0)}
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-800">{c.full_name}</p>
                              <p className="text-xs text-gray-500">{c.email}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-opv-purple">{clientSessions.length}</p>
                              <p className="text-xs text-gray-400">sesiones</p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* PAGOS */}
            {tab === 'payments' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-800">Pagos</h2>
                  <button onClick={() => setShowPaymentModal(true)} className="btn-primary text-sm py-1.5 px-3">
                    + Registrar
                  </button>
                </div>
                {/* Resumen */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="card bg-green-50 border-green-200">
                    <p className="text-lg font-bold text-opv-green">${totalPaid.toLocaleString('es-CL')}</p>
                    <p className="text-xs text-gray-500">Cobrado total</p>
                  </div>
                  <div className="card bg-yellow-50 border-yellow-200">
                    <p className="text-lg font-bold text-sagia-gold">{pendingPay.length}</p>
                    <p className="text-xs text-gray-500">Por confirmar</p>
                  </div>
                </div>
                {payments.length === 0 ? (
                  <div className="card text-center py-10">
                    <p className="text-gray-400 text-sm">Sin pagos registrados</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {payments.map(p => (
                      <div key={p.id} className="card">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-gray-800">{p.client?.full_name}</p>
                            <p className="text-xs text-gray-500">Transferencia BCI · {p.reference_number || 'Sin referencia'}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{p.session?.session_date ? formatDate(p.session.session_date) : '-'}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-800">${Number(p.amount).toLocaleString('es-CL')}</p>
                            <div className="mt-1">{statusBadge(p.status)}</div>
                            {p.status === 'pending' && (
                              <button onClick={() => markPaymentDone(p.id)} className="text-xs text-opv-green hover:underline mt-1">
                                Confirmar
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Modals */}
      {showSessionModal && (
        <SessionModal
          coachId={user.id}
          clients={clients}
          onClose={() => setShowSessionModal(false)}
          onSaved={() => { setShowSessionModal(false); fetchAll() }}
        />
      )}
      {showPaymentModal && (
        <PaymentModal
          coachId={user.id}
          clients={clients}
          sessions={sessions}
          onClose={() => setShowPaymentModal(false)}
          onSaved={() => { setShowPaymentModal(false); fetchAll() }}
        />
      )}
    </div>
  )
}
