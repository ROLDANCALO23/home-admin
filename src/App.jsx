import { useState } from 'react'
import './styles/global.css'
import Sidebar from './components/Sidebar'
import { RegistroGastos } from './features/gastos'
import { RegistroTareas } from './features/tareas'

function App() {
  const [pagina, setPagina] = useState('gastos')

  return (
    <div className="app-layout">
      <Sidebar paginaActual={pagina} onChangePagina={setPagina} />
      <main className="app-main">
        {pagina === 'gastos' && <RegistroGastos />}
        {pagina === 'tareas' && <RegistroTareas />}
      </main>
    </div>
  )
}

export default App
