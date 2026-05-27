import { useState } from 'react'
import './styles/global.css'
import Sidebar from './components/Sidebar'
import { RegistroGastos } from './features/gastos'
import { RegistroTareas } from './features/tareas'

function App() {
  const [pagina, setPagina] = useState(() => localStorage.getItem('pagina') ?? 'gastos')

  const cambiarPagina = (id) => {
    localStorage.setItem('pagina', id)
    setPagina(id)
  }

  return (
    <div className="app-layout">
      <Sidebar paginaActual={pagina} onChangePagina={cambiarPagina} />
      <main className="app-main">
        {pagina === 'gastos' && <RegistroGastos />}
        {pagina === 'tareas' && <RegistroTareas />}
      </main>
    </div>
  )
}

export default App
