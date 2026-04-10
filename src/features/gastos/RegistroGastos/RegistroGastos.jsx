import { useState, useEffect } from 'react'
import GastoForm from '../components/GastoForm'
import GastoLista from '../components/GastoLista'
import ResumenCategorias from '../components/ResumenCategorias'
import FiltroRango from '../components/FiltroRango'
import ToastContainer from '../components/ToastContainer'
import ConfirmDialog from '../../../components/ConfirmDialog'
import GastoEditDialog from '../components/GastoEditDialog'
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
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [categoriaFondo, setCategoriaFondo] = useState('')
  const { toasts, addToast } = useToast()
  const [confirmarId, setConfirmarId] = useState(null)
  const [gastoEditando, setGastoEditando] = useState(null)

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
    const nuevo = { ...gasto, id: Date.now() }
    const { error } = await supabase.from('gastos').insert(nuevo)
    if (error) {
      addToast('No se pudo guardar el gasto', 'error')
    } else {
      setGastos([nuevo, ...gastos])
      addToast('Gasto agregado correctamente', 'success')
    }
  }

  const editarGasto = async (gasto) => {
    const { error } = await supabase
      .from('gastos')
      .update({
        descripcion: gasto.descripcion,
        monto: gasto.monto,
        categoria: gasto.categoria,
        fecha: gasto.fecha,
      })
      .eq('id', gasto.id)
    if (error) {
      addToast('No se pudo actualizar el gasto', 'error')
    } else {
      setGastos(gastos.map((g) => (g.id === gasto.id ? gasto : g)))
      setGastoEditando(null)
      addToast('Gasto actualizado', 'success')
    }
  }

  const eliminarGasto = async () => {
    const id = confirmarId
    setConfirmarId(null)
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
    if (desde && fecha < new Date(desde + 'T00:00:00')) return false
    if (hasta && fecha > new Date(hasta + 'T23:59:59')) return false
    return true
  })

  return (
    <div className="registro-gastos">
      <ToastContainer toasts={toasts} />
      {gastoEditando && (
        <GastoEditDialog
          gasto={gastoEditando}
          onGuardar={editarGasto}
          onCancelar={() => setGastoEditando(null)}
        />
      )}
      {confirmarId && (
        <ConfirmDialog
          mensaje="¿Estás seguro de que deseas eliminar este gasto?"
          onConfirmar={eliminarGasto}
          onCancelar={() => setConfirmarId(null)}
        />
      )}
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
            <FiltroRango
              desde={desde}
              hasta={hasta}
              onChangeDe={setDesde}
              onChangeHasta={setHasta}
            />
          </div>
          <div className="gastos-scroll">
            <GastoLista gastos={gastosFiltrados} onEliminar={setConfirmarId} onEditar={setGastoEditando} />
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
