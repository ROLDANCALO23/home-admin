import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import './Sidebar.css'

const PAGES = [
  { id: 'gastos', label: 'Gastos', icon: '💸' },
  { id: 'tareas', label: 'Tareas', icon: '⏰' },
]

function Sidebar({ paginaActual, onChangePagina }) {
  const [abierto, setAbierto] = useState(false)

  const handleNavegar = (id) => {
    onChangePagina(id)
    setAbierto(false)
  }

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
          <button className="sidebar-logout" onClick={() => supabase.auth.signOut()}>
            <span className="sidebar-icon">🚪</span>
            <span className="sidebar-label">Salir</span>
          </button>
        </div>
      </nav>
    </>
  )
}

export default Sidebar
