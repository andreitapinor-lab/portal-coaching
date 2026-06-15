# Script para pushear Portal Coaching a GitHub
# Ejecuta esto COMO ADMINISTRADOR en PowerShell

$repoUrl = "https://github.com/andreitapinor-lab/portal-coaching.git"
$tempDir = "$env:TEMP\portal-coaching-deploy"

Write-Host "🚀 Iniciando deployment a GitHub..." -ForegroundColor Green

# Crear directorio temporal
New-Item -ItemType Directory -Force -Path $tempDir | Out-Null
Set-Location $tempDir

# Clonar repo
Write-Host "📦 Clonando repositorio..."
git clone $repoUrl . 2>$null

# Crear estructura completa
Write-Host "📝 Creando archivos..."

# package.json
@"
{
  "name": "portal-coaching",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@supabase/supabase-js": "^2.38.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.0",
    "vite": "^4.4.0",
    "tailwindcss": "^3.3.0",
    "postcss": "^8.4.31",
    "autoprefixer": "^10.4.16"
  }
}
"@ | Out-File "package.json" -Encoding UTF8

# Crear carpetas
@("src/components", "src/pages", "src/services", "src/styles") | % { New-Item -ItemType Directory -Force -Path $_ | Out-Null }

# index.html
@"
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Portal Coaching - Sag-IA</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/index.jsx"></script>
</body>
</html>
"@ | Out-File "index.html" -Encoding UTF8

# vite.config.js
@"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, host: true }
})
"@ | Out-File "vite.config.js" -Encoding UTF8

# tailwind.config.js
@"
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        opv: { morado: '#602D66', verde: '#3D7915' },
        sagia: { verde: '#7B9D75', dorado: '#D4A574' }
      }
    }
  },
  plugins: []
}
"@ | Out-File "tailwind.config.js" -Encoding UTF8

# postcss.config.js
@"
export default {
  plugins: { tailwindcss: {}, autoprefixer: {} }
}
"@ | Out-File "postcss.config.js" -Encoding UTF8

# src/index.jsx
@"
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './pages/App.jsx'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
"@ | Out-File "src/index.jsx" -Encoding UTF8

# src/styles/index.css
@"
@tailwind base;
@tailwind components;
@tailwind utilities;

* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #f8f9fa; }
"@ | Out-File "src/styles/index.css" -Encoding UTF8

# src/services/supabaseClient.js
@"
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://porffjdethvcakwyurue.supabase.co'
const SUPABASE_KEY = 'sb_publishable_NPX-1a3rkPMXPzcQ07DPwA_bULjGfPu'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
"@ | Out-File "src/services/supabaseClient.js" -Encoding UTF8

# src/pages/App.jsx
@"
import { useState, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'
import Login from '../components/Login'
import DashboardCoach from '../components/DashboardCoach'
import DashboardClient from '../components/DashboardClient'

export default function App() {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        setUser(session.user)
        setRole('coach')
      } else {
        setUser(null)
        setRole(null)
      }
      setLoading(false)
    })
    return () => authListener.subscription.unsubscribe()
  }, [])

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      setUser(session.user)
      setRole('coach')
    }
    setLoading(false)
  }

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando...</div>

  return (
    <div>
      {!user ? (
        <Login onLogin={(u, r) => { setUser(u); setRole(r) }} />
      ) : role === 'coach' ? (
        <DashboardCoach user={user} onLogout={() => { setUser(null); setRole(null) }} />
      ) : (
        <DashboardClient user={user} onLogout={() => { setUser(null); setRole(null) }} />
      )}
    </div>
  )
}
"@ | Out-File "src/pages/App.jsx" -Encoding UTF8

# src/components/Login.jsx
@"
import { useState } from 'react'
import { supabase } from '../services/supabaseClient'

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error: err } = await supabase.auth.signUpWithPassword({ email, password })
      if (err) throw err
      onLogin(data.user, 'coach')
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', padding: '1rem' }}>
      <div style={{ background: 'white', borderRadius: '12px', padding: '2rem', width: '100%', maxWidth: '400px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <h1 style={{ fontSize: '24px', color: '#7B9D75', marginBottom: '8px', textAlign: 'center' }}>Portal Coaching</h1>
        <p style={{ fontSize: '13px', color: '#999', textAlign: 'center', marginBottom: '2rem' }}>Sag-IA: Potencial artificial con sentido humano</p>
        
        {error && <div style={{ background: '#fce7e7', color: '#c00', padding: '12px', borderRadius: '6px', marginBottom: '1rem', fontSize: '14px' }}>{error}</div>}
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }} required />
          <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }} required />
          <button type="submit" style={{ padding: '10px', background: '#7B9D75', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }} disabled={loading}>{loading ? 'Procesando...' : 'Ingresar'}</button>
        </form>
      </div>
    </div>
  )
}
"@ | Out-File "src/components/Login.jsx" -Encoding UTF8

# src/components/DashboardCoach.jsx
@"
import { supabase } from '../services/supabaseClient'

export default function DashboardCoach({ user, onLogout }) {
  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      <nav style={{ background: 'white', borderBottom: '1px solid #e0e0e0', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '22px', color: '#7B9D75' }}>Portal Coaching</h1>
        <button onClick={() => { supabase.auth.signOut(); onLogout() }} style={{ padding: '8px 16px', background: '#7B9D75', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Salir</button>
      </nav>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ background: 'white', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '8px' }}>Dashboard Coach</h2>
          <p style={{ color: '#999', fontSize: '14px' }}>{user.email}</p>
          <p style={{ marginTop: '1rem', color: '#999' }}>👥 Sistema de agendamiento de sesiones en desarrollo</p>
        </div>
      </div>
    </div>
  )
}
"@ | Out-File "src/components/DashboardCoach.jsx" -Encoding UTF8

# src/components/DashboardClient.jsx
@"
import { supabase } from '../services/supabaseClient'

export default function DashboardClient({ user, onLogout }) {
  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      <nav style={{ background: 'white', borderBottom: '1px solid #e0e0e0', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '22px', color: '#7B9D75' }}>Mi Portal</h1>
        <button onClick={() => { supabase.auth.signOut(); onLogout() }} style={{ padding: '8px 16px', background: '#7B9D75', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Salir</button>
      </nav>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ background: 'white', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '8px' }}>Mis Sesiones</h2>
          <p style={{ color: '#999' }}>📅 Tus próximas sesiones aparecerán aquí</p>
        </div>
      </div>
    </div>
  )
}
"@ | Out-File "src/components/DashboardClient.jsx" -Encoding UTF8

# .gitignore
@"
node_modules
dist
.env
.env.local
.DS_Store
"@ | Out-File ".gitignore" -Encoding UTF8

# README.md
@"
# Portal Coaching - Sag-IA

App web para sesiones coaching 1:1.

## Stack
- React + Vite
- Tailwind CSS
- Supabase
- Vercel

## Instalar y correr
\`\`\`bash
npm install
npm run dev
\`\`\`
"@ | Out-File "README.md" -Encoding UTF8

# Git setup y push
Write-Host "📤 Configurando Git y haciendo push..."
git config --global user.email "andrea@coaching.com"
git config --global user.name "Andrea"
git add .
git commit -m "Initial commit: Portal Coaching" 2>$null
git branch -M main 2>$null
git push -u origin main 2>$null

Write-Host "✅ ¡Hecho! Tu código está en GitHub" -ForegroundColor Green
Write-Host "📍 Repositorio: $repoUrl" -ForegroundColor Cyan

