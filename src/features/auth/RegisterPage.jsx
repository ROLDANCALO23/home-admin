import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import './auth.css'

const EyeOpen = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
)

const EyeClosed = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
)

function RegisterPage({ onVolver, onRegistrado }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [celular, setCelular] = useState('')
  const [codigoPais, setCodigoPais] = useState('')
  const [codigoGrupo, setCodigoGrupo] = useState('')
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [cargando, setCargando] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMensaje('')
    setCargando(true)

    let groupId = null
    if (codigoGrupo.trim()) {
      const code = parseInt(codigoGrupo.trim(), 10)
      if (isNaN(code) || code < 1) {
        setError('El código de grupo debe ser un número positivo.')
        setCargando(false)
        return
      }
      const { data: existe } = await supabase.rpc('grupo_existe', { p_group_id: code })
      if (!existe) {
        setError('Código de grupo no válido. Verifica con tu familia.')
        setCargando(false)
        return
      }
      groupId = code
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          celular: celular.trim(),
          pais: codigoPais.trim(),
          group_id: groupId,
        },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setCargando(false)
      return
    }

    if (!data.session) {
      setMensaje('Cuenta creada. Revisa tu email para confirmar tu cuenta y luego inicia sesión.')
      setCargando(false)
      return
    }

    const { data: perfil } = await supabase
      .from('perfiles')
      .select('group_id')
      .eq('id', data.user.id)
      .single()

    onRegistrado(perfil?.group_id ?? null, !groupId)
  }

  return (
    <div className="auth-wrap">
      <div className="pagina-fondo" />
      <div className="auth-card">
        <div className="auth-logo">💜</div>
        <h1 className="auth-titulo">Cosas de Casas</h1>
        <p className="auth-subtitulo">Crea tu cuenta para empezar</p>
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
            <div className="auth-password-wrap">
              <input
                type={mostrarPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
                minLength={6}
                required
              />
              <button
                type="button"
                className="auth-eye"
                onClick={() => setMostrarPassword(v => !v)}
                tabIndex={-1}
                aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {mostrarPassword ? <EyeClosed /> : <EyeOpen />}
              </button>
            </div>
          </div>
          <div className="auth-field">
            <label>Celular</label>
            <input
              type="text"
              value={celular}
              onChange={e => setCelular(e.target.value)}
              placeholder="300 000 0000"
              required
            />
          </div>
          <div className="auth-field">
            <label>Código de país</label>
            <input
              type="text"
              value={codigoPais}
              onChange={e => setCodigoPais(e.target.value)}
              placeholder="+57, +51, +54…"
              required
            />
          </div>
          <div className="auth-field">
            <label>
              Código de grupo{' '}
              <span className="auth-opcional">(opcional)</span>
            </label>
            <input
              type="text"
              value={codigoGrupo}
              onChange={e => setCodigoGrupo(e.target.value)}
              placeholder="Vacío para crear un grupo nuevo"
            />
          </div>
          {error && <p className="auth-error">{error}</p>}
          {mensaje && <p className="auth-mensaje">{mensaje}</p>}
          <button type="submit" className="auth-btn" disabled={cargando || !!mensaje}>
            {cargando ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>
        <p className="auth-link">
          ¿Ya tienes cuenta?{' '}
          <button type="button" onClick={onVolver} className="auth-link-btn">
            Inicia sesión
          </button>
        </p>
      </div>
    </div>
  )
}

export default RegisterPage
