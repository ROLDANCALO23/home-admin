import { useState, useEffect } from 'react'
import GastoForm from '../components/GastoForm'
import GastoLista from '../components/GastoLista'
import ResumenCategorias from '../components/ResumenCategorias'
import FiltroMes from '../components/FiltroMes'
import ToastContainer from '../components/ToastContainer'
import { supabase } from '../../../lib/supabase'
import { useToast } from '../../../lib/useToast'
import imgComida from '../../../assets/categorias/comida.jpg'
import imgTransporte from '../../../assets/categorias/transporte.jpg'
import imgEntretenimiento from '../../../assets/categorias/entretenimiento.jpg'
import imgSalud from '../../../assets/categorias/salud.jpg'
import imgHogar from '../../../assets/categorias/hogar.jpg'
import imgPerros from '../../../assets/categorias/perros.jpg'
import './RegistroGastos.css'

const FONDOS = {
  comida: imgComida,
  transporte: imgTransporte,
  entretenimiento: imgEntretenimiento,
  salud: imgSalud,
  hogar: imgHogar,
  perros: imgPerros,
}

function RegistroGastos() {
  const [gastos, setGastos] = useState([])
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear())
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth())
  const [categoriaFondo, setCategoriaFondo] = useState('')
  const { toasts, addToast } = useToast()

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
    if (error) {
      addToast('No se pudo guardar el gasto', 'error')
    } else {
      setGastos([nuevo, ...gastos])
      addToast('Gasto agregado correctamente', 'success')
    }
  }

  const eliminarGasto = async (id) => {
    const { error } = await supabase.from('gastos').delete().eq('id', id)
    if (error) {
      addToast('No se pudo eliminar el gasto', 'error')
    } else {
      setGastos(gastos.filter((g) => g.id !== id))
      addToast('Gasto eliminado', 'success')
    }
  }

  const gastosFiltrados = gastos.filter((g) => {
    const fecha = new Date(g.fecha)
    if (anioSeleccionado && fecha.getFullYear() !== anioSeleccionado) return false
    if (mesSeleccionado !== null && fecha.getMonth() !== mesSeleccionado) return false
    return true
  })

  return (
    <div className="registro-gastos">
      <ToastContainer toasts={toasts} />
      <div
        className="pagina-fondo"
        style={FONDOS[categoriaFondo] ? { backgroundImage: `url(${FONDOS[categoriaFondo]})` } : undefined}
      />
      <div className="app-header">
        <h1>Registro de Gastos</h1>
        <p>Controla tus gastos y organízalos por categoría</p>
      </div>
      <div className="layout">
        <div className="card">
          <GastoForm onAgregar={agregarGasto} onCategoriaChange={setCategoriaFondo} />
        </div>
        <div className="card card--gastos">
          <div className="gastos-header">
            <div className="gastos-titulo-wrap">
              <span className="gastos-titulo">GASTOS</span>
              {gastosFiltrados.length > 0 && (
                <span className="gastos-badge">{gastosFiltrados.length}</span>
              )}
            </div>
            <FiltroMes
              gastos={gastos}
              anioSeleccionado={anioSeleccionado}
              mesSeleccionado={mesSeleccionado}
              onChangeAnio={setAnioSeleccionado}
              onChangeMes={setMesSeleccionado}
            />
          </div>
          <div className="gastos-scroll">
            <GastoLista gastos={gastosFiltrados} onEliminar={eliminarGasto} />
          </div>
          {gastosFiltrados.length > 0 && (
            <>
              <hr className="separador" />
              <ResumenCategorias gastos={gastosFiltrados} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default RegistroGastos
