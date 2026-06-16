import React, { useState, useEffect } from 'react'
import { supabase } from './lib/supabase.js'
import Login from './pages/Login.jsx'
import DashboardCoach from './pages/DashboardCoach.jsx'
import DashboardClient from './pages/DashboardClient.jsx'

export default function App() {
  const [session, setSession] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else setLoading(false)
    })

    // Escuchar cambios de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else {
        setUserProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    setLoading(true)
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (data) setUserProfile(data)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-f8f7f9">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-opv-purple border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-500">Cargando tu portal...</p>
        </div>
      </div>
    )
  }

  if (!session) return <Login />

  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Error cargando perfil. <button onClick={() => supabase.auth.signOut()} className="text-opv-purple underline">Salir</button></p>
      </div>
    )
  }

  return userProfile.role === 'coach'
    ? <DashboardCoach user={userProfile} />
    : <DashboardClient user={userProfile} />
}
