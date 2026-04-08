import { useState, useEffect } from 'react'
import GastoForm from '../components/GastoForm'
import GastoLista from '../components/GastoLista'
import ResumenCategorias from '../components/ResumenCategorias'
import FiltroMes from '../components/FiltroMes'
import { supabase } from '../../../lib/supabase'
import './RegistroGastos.css'

function RegistroGastos() {
  const [gastos, setGastos] = useState([])
  const [anioSeleccionado, setAnioSeleccionado] = useState(null)
  const [mesSeleccionado, setMesSeleccionado] = useState(null)

  useEffect(() => {
    supabase
      .from('gastos')
      .select('*')
      .order('fecha', { ascending: false })
      .then(({ data, error }) => {
        if (!error) setGastos(data.map((g) => ({ ...g, fecha: new Date(g.fecha) })))
      })
  }, [])

  const agregarGasto = async (gasto) => {
    const nuevo = { ...gasto, id: Date.now(), fecha: new Date() }
    const { error } = await supabase.from('gastos').insert(nuevo)
    if (!error) setGastos([...gastos, nuevo])
  }

  const eliminarGasto = async (id) => {
    const { error } = await supabase.from('gastos').delete().eq('id', id)
    if (!error) setGastos(gastos.filter((g) => g.id !== id))
  }

  const gastosFiltrados = gastos.filter((g) => {
    const fecha = new Date(g.fecha)
    if (anioSeleccionado && fecha.getFullYear() !== anioSeleccionado) return false
    if (mesSeleccionado !== null && fecha.getMonth() !== mesSeleccionado) return false
    return true
  })

  return (
    <div className="registro-gastos">
      <div className="app-header">
        <h1>Registro de Gastos</h1>
        <p>Controla tus gastos y organízalos por categoría</p>
      </div>
      <div className="layout">
        <div className="card">
          <GastoForm onAgregar={agregarGasto} />
        </div>
        <div className="columna-derecha">
          <div className="card">
            <FiltroMes
              gastos={gastos}
              anioSeleccionado={anioSeleccionado}
              mesSeleccionado={mesSeleccionado}
              onChangeAnio={setAnioSeleccionado}
              onChangeMes={setMesSeleccionado}
            />
          </div>
          <div className="card card--lista">
            <GastoLista gastos={gastosFiltrados} onEliminar={eliminarGasto} />
          </div>
          {gastosFiltrados.length > 0 && (
            <div className="card">
              <ResumenCategorias gastos={gastosFiltrados} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default RegistroGastos
