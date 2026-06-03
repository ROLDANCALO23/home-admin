import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import './auth.css'

function LoginPage({ onIrARegistro }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setCargando(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Credenciales incorrectas. Verifica tu email y contraseña.')
      setCargando(false)
    }
  }

  return (
    <div className="auth-wrap">
      <div className="pagina-fondo" />
      <div className="auth-card">
        <div className="auth-logo">💜</div>
        <h1 className="auth-titulo">Cosas de Casas</h1>
        <p className="auth-subtitulo">Inicia sesión para continuar</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label>Email</label>
            <input
              type="text"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com"
              autoComplete="email"
              required
            />
          </div>
          <div className="auth-field">
            <label>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" className="auth-btn" disabled={cargando}>
            {cargando ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
        <p className="auth-link">
          ¿No tienes cuenta?{' '}
          <button type="button" onClick={onIrARegistro} className="auth-link-btn">
            Regístrate
          </button>
        </p>
      </div>
    </div>
  )
}

export default LoginPage
