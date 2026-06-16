import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import PaymentModal from '../components/PaymentModal.jsx'

const NAV = [
  { id: 'dashboard', label: 'Inicio', icon: '🏠' },
  { id: 'sessions', label: 'Mis Sesiones', icon: '📅' },
  { id: 'payments', label: 'Mis Pagos', icon: '💳' },
  { id: 'transfer', label: 'Transferir', icon: '🏦' },
]

export default function DashboardClient({ user }) {
  const [tab, setTab] = useState('dashboard')
  const [sessions, setSessions] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [{ data: sess }, { data: pay }] = await Promise.all([
      supabase.from('sessions').select('*').eq('client_id', user.id).order('session_date', { ascending: false }),
      supabase.from('payments').select('*, session:session_id(session_date)').eq('client_id', user.id).order('created_at', { ascending: false }),
    ])
    setSessions(sess || [])
    setPayments(pay || [])
    setLoading(false)
  }

  function formatDate(dt) {
    if (!dt) return '-'
    return new Date(dt).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  function statusBadge(s) {
    const map = { scheduled: 'badge-scheduled', completed: 'badge-completed', cancelled: 'badge-cancelled', pending: 'badge-pending' }
    const label = { scheduled: 'Programada', completed: 'Realizada', cancelled: 'Cancelada', pending: 'Pendiente pago' }
    return <span className={map[s] || 'badge-scheduled'}>{label[s] || s}</span>
  }

  const upcoming = sessions.filter(s => s.status === 'scheduled' && new Date(s.session_date) >= new Date())
  const completed = sessions.filter(s => s.status === 'completed')
  const pendingPay = payments.filter(p => p.status === 'pending')

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-sagia-green text-white px-4 py-3 flex items-center justify-between shadow-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-sm font-bold">
            {user.full_name?.charAt(0) || 'C'}
          </div>
          <div>
            <p className="text-xs text-green-100">Mi Portal</p>
            <p className="text-sm font-semibold leading-tight">{user.full_name}</p>
          </div>
        </div>
        <button onClick={() => supabase.auth.signOut()} className="text-white/70 hover:text-white text-xs px-2 py-1.5 rounded transition-colors">
          Salir
        </button>
      </header>

      {/* Nav */}
      <nav className="bg-white border-b border-gray-200 sticky top-14 z-30">
        <div className="flex overflow-x-auto">
          {NAV.map(n => (
            <button
              key={n.id}
              onClick={() => setTab(n.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === n.id ? 'border-sagia-green text-sagia-green' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span>{n.icon}</span> {n.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="flex-1 px-4 py-5 max-w-2xl mx-auto w-full">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-sagia-green border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* INICIO */}
            {tab === 'dashboard' && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-gray-800">Hola, {user.full_name?.split(' ')[0]} 👋</h2>

                <div className="grid grid-cols-3 gap-3">
                  <div className="card text-center">
                    <p className="text-2xl font-bold text-sagia-green">{upcoming.length}</p>
                    <p className="text-xs text-gray-500 mt-1">Próximas</p>
                  </div>
                  <div className="card text-center">
                    <p className="text-2xl font-bold text-opv-purple">{completed.length}</p>
                    <p className="text-xs text-gray-500 mt-1">Realizadas</p>
                  </div>
                  <div className="card text-center">
                    <p className="text-2xl font-bold text-sagia-gold">{pendingPay.length}</p>
                    <p className="text-xs text-gray-500 mt-1">Por pagar</p>
                  </div>
                </div>

                {/* Próximas sesiones */}
                {upcoming.length > 0 && (
                  <div className="card border-l-4 border-sagia-green">
                    <h3 className="font-semibold text-gray-700 mb-3">📅 Próximas sesiones</h3>
                    <div className="space-y-2">
                      {upcoming.map(s => (
                        <div key={s.id}>
                          <p className="text-sm font-medium text-gray-800">{formatDate(s.session_date)}</p>
                          {s.description && <p className="text-xs text-gray-500">{s.description}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pagos pendientes */}
                {pendingPay.length > 0 && (
                  <div className="card border-l-4 border-sagia-gold">
                    <h3 className="font-semibold text-gray-700 mb-2">⚠️ Tienes pagos pendientes</h3>
                    {pendingPay.map(p => (
                      <div key={p.id} className="text-sm">
                        <p className="text-gray-700">${Number(p.amount).toLocaleString('es-CL')} por sesión</p>
                      </div>
                    ))}
                    <button onClick={() => setTab('transfer')} className="btn-gold text-xs mt-3 py-1.5 px-3">
                      Ver datos para transferir →
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* MIS SESIONES */}
            {tab === 'sessions' && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-gray-800">Mis Sesiones</h2>
                {sessions.length === 0 ? (
                  <div className="card text-center py-10">
                    <p className="text-gray-400 text-sm">Sin sesiones aún</p>
                    <p className="text-xs text-gray-400 mt-2">Tu coach agendará sesiones contigo</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sessions.map(s => (
                      <div key={s.id} className="card">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-gray-800">{formatDate(s.session_date)}</p>
                            {s.description && <p className="text-sm text-gray-600 mt-1">{s.description}</p>}
                            {s.notes && <p className="text-xs text-gray-400 mt-1 bg-gray-50 rounded p-2">{s.notes}</p>}
                          </div>
                          <div>{statusBadge(s.status)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* MIS PAGOS */}
            {tab === 'payments' && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-gray-800">Historial de Pagos</h2>
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
                            <p className="font-semibold text-gray-800">${Number(p.amount).toLocaleString('es-CL')}</p>
                            <p className="text-xs text-gray-500">Transferencia BCI</p>
                            {p.reference_number && <p className="text-xs text-gray-400">Ref: {p.reference_number}</p>}
                            {p.transaction_date && <p className="text-xs text-gray-400">{formatDate(p.transaction_date)}</p>}
                          </div>
                          <div>{statusBadge(p.status)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TRANSFERENCIA BCI */}
            {tab === 'transfer' && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-gray-800">Datos para Transferir</h2>
                <div className="card border-2 border-sagia-gold bg-amber-50">
                  <h3 className="font-bold text-gray-800 mb-4 text-center">🏦 Cuenta BCI Andrea Pino</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Banco', value: 'BCI' },
                      { label: 'Titular', value: 'Andrea Pino' },
                      { label: 'Tipo de cuenta', value: 'Cuenta Corriente' },
                      { label: 'N° de cuenta', value: '— Solicitar a tu coach —' },
                      { label: 'RUT', value: '— Solicitar a tu coach —' },
                      { label: 'Email', value: 'andrea@otropuntodevista.cl' },
                    ].map(item => (
                      <div key={item.label} className="flex justify-between items-center border-b border-amber-100 pb-2 last:border-0">
                        <span className="text-xs text-gray-500 font-medium">{item.label}</span>
                        <span className="text-sm font-semibold text-gray-800">{item.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 bg-amber-100 rounded-lg p-3 text-xs text-amber-800">
                    💬 Después de transferir, envía el comprobante por WhatsApp o email para confirmar tu pago.
                  </div>
                </div>

                {pendingPay.length > 0 && (
                  <div className="card">
                    <h3 className="font-semibold text-gray-700 mb-2">Tus pagos pendientes:</h3>
                    {pendingPay.map(p => (
                      <p key={p.id} className="text-sm text-gray-700">• ${Number(p.amount).toLocaleString('es-CL')}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {showPaymentModal && (
        <PaymentModal
          clientId={user.id}
          sessions={sessions}
          onClose={() => setShowPaymentModal(false)}
          onSaved={() => { setShowPaymentModal(false); fetchAll() }}
        />
      )}
    </div>
  )
}
