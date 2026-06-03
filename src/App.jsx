import { useState, useEffect } from 'react'
import './styles/global.css'
import './features/auth/auth.css'
import Sidebar from './components/Sidebar'
import { RegistroGastos } from './features/gastos'
import { RegistroTareas } from './features/tareas'
import LoginPage from './features/auth/LoginPage'
import RegisterPage from './features/auth/RegisterPage'
import { supabase } from './lib/supabase'

function App() {
  const [pagina, setPagina] = useState(() => localStorage.getItem('pagina') ?? 'gastos')
  const [session, setSession] = useState(null)
  const [cargandoAuth, setCargandoAuth] = useState(true)
  const [authView, setAuthView] = useState('login')
  const [grupoNuevo, setGrupoNuevo] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setCargandoAuth(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  const cambiarPagina = (id) => {
    localStorage.setItem('pagina', id)
    setPagina(id)
  }

  const handleRegistrado = (groupId, esNuevo) => {
    if (esNuevo && groupId) setGrupoNuevo(groupId)
  }

  if (cargandoAuth) {
    return (
      <div className="auth-wrap">
        <div className="pagina-fondo" />
        <div className="spinner" />
      </div>
    )
  }

  if (!session) {
    return authView === 'login'
      ? <LoginPage onIrARegistro={() => setAuthView('register')} />
      : <RegisterPage onVolver={() => setAuthView('login')} onRegistrado={handleRegistrado} />
  }

  return (
    <div className="app-layout">
      <Sidebar paginaActual={pagina} onChangePagina={cambiarPagina} />
      <main className="app-main">
        {pagina === 'gastos' && <RegistroGastos />}
        {pagina === 'tareas' && <RegistroTareas />}
      </main>
      {grupoNuevo && (
        <div className="grupo-nuevo-overlay" onClick={() => setGrupoNuevo(null)}>
          <div className="grupo-nuevo-modal" onClick={e => e.stopPropagation()}>
            <div className="grupo-nuevo-icon">🏠</div>
            <h2>¡Bienvenido!</h2>
            <p>Tu nuevo grupo es el</p>
            <div className="grupo-nuevo-codigo">#{grupoNuevo}</div>
            <p className="grupo-nuevo-hint">Compártelo con tu familia para que se unan.</p>
            <button className="auth-btn" onClick={() => setGrupoNuevo(null)}>Entendido</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
