import { useState } from 'react'
import { usePushNotifications } from '../../lib/usePushNotifications'
import './Sidebar.css'

const PAGES = [
  { id: 'gastos', label: 'Gastos', icon: '💸' },
  { id: 'tareas', label: 'Tareas', icon: '📋' },
]

const BELL_LABELS = {
  idle: { icon: '🔔', label: 'Activar' },
  solicitando: { icon: '🔔', label: '...' },
  activo: { icon: '🔔', label: 'Activo' },
  denegado: { icon: '🔕', label: 'Bloqueado' },
  'no-soportado': { icon: '🔕', label: 'N/D' },
}

function Sidebar({ paginaActual, onChangePagina }) {
  const [abierto, setAbierto] = useState(false)
  const { estado, activar } = usePushNotifications()

  const handleNavegar = (id) => {
    onChangePagina(id)
    setAbierto(false)
  }

  const bell = BELL_LABELS[estado] ?? BELL_LABELS.idle

  return (
    <>
      <button className="hamburger" onClick={() => setAbierto(true)}>
        <span /><span /><span />
      </button>

      {abierto && <div className="sidebar-overlay" onClick={() => setAbierto(false)} />}

      <nav className={`sidebar ${abierto ? 'sidebar--abierto' : ''}`}>
        <div className="sidebar-logo">💜</div>
        <ul className="sidebar-nav">
          {PAGES.map((page) => (
            <li key={page.id}>
              <button
                className={`sidebar-item ${paginaActual === page.id ? 'activo' : ''}`}
                onClick={() => handleNavegar(page.id)}
              >
                <span className="sidebar-icon">{page.icon}</span>
                <span className="sidebar-label">{page.label}</span>
              </button>
            </li>
          ))}
        </ul>

        <div className="sidebar-bottom">
          <button
            className={`sidebar-item sidebar-bell ${estado === 'activo' ? 'activo' : ''}`}
            onClick={activar}
            disabled={estado === 'activo' || estado === 'denegado' || estado === 'no-soportado'}
            title={estado === 'denegado' ? 'Notificaciones bloqueadas en el navegador' : ''}
          >
            <span className="sidebar-icon">{bell.icon}</span>
            <span className="sidebar-label">{bell.label}</span>
          </button>
        </div>
      </nav>
    </>
  )
}

export default Sidebar
