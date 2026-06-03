import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import './auth.css'

const PAISES = [
  'Colombia', 'México', 'Argentina', 'España', 'Chile', 'Perú', 'Venezuela',
  'Ecuador', 'Bolivia', 'Uruguay', 'Paraguay', 'Costa Rica', 'Panamá',
  'Guatemala', 'Honduras', 'El Salvador', 'Nicaragua', 'Cuba',
  'República Dominicana', 'Puerto Rico', 'Estados Unidos', 'Otro',
]

function RegisterPage({ onVolver, onRegistrado }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [celular, setCelular] = useState('')
  const [pais, setPais] = useState('')
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
          pais,
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
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>
          <div className="auth-field">
            <label>Celular</label>
            <input
              type="text"
              value={celular}
              onChange={e => setCelular(e.target.value)}
              placeholder="+57 300 000 0000"
              required
            />
          </div>
          <div className="auth-field">
            <label>País</label>
            <select
              value={pais}
              onChange={e => setPais(e.target.value)}
              className="auth-select"
              required
            >
              <option value="">Selecciona tu país</option>
              {PAISES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
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
