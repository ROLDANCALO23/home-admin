import { useState, useEffect } from 'react'
import GastoForm from '../components/GastoForm'
import GastoLista from '../components/GastoLista'
import ResumenCategorias from '../components/ResumenCategorias'
import FiltroRango from '../components/FiltroRango'
import ToastContainer from '../components/ToastContainer'
import ConfirmDialog from '../../../components/ConfirmDialog'
import GastoEditDialog from '../components/GastoEditDialog'
import CategoriasPage from '../components/CategoriasPage'
import { supabase } from '../../../lib/supabase'
import { useToast } from '../../../lib/useToast'
import './RegistroGastos.css'

function RegistroGastos() {
  const [gastos, setGastos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [tab, setTab] = useState('registro')
  const hoy = new Date()
  const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0]
  const hoyStr = hoy.toISOString().split('T')[0]

  const [desde, setDesde] = useState(primerDiaMes)
  const [hasta, setHasta] = useState(hoyStr)
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('')
  const { toasts, addToast } = useToast()
  const [confirmarId, setConfirmarId] = useState(null)
  const [gastoEditando, setGastoEditando] = useState(null)

  const cargarCategorias = async () => {
    const { data, error } = await supabase.from('categorias').select('*').order('orden')
    if (!error) setCategorias(data)
  }

  useEffect(() => {
    cargarCategorias()
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

  const gastosFiltrados = gastos
    .filter((g) => {
      const fecha = new Date(g.fecha)
      if (desde && fecha < new Date(desde + 'T00:00:00')) return false
      if (hasta && fecha > new Date(hasta + 'T23:59:59')) return false
      return true
    })
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))

  const categoriaColor = categorias.find((c) => c.valor === categoriaSeleccionada)?.color

  return (
    <div className="registro-gastos">
      <ToastContainer toasts={toasts} />
      {gastoEditando && (
        <GastoEditDialog
          gasto={gastoEditando}
          categorias={categorias}
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
        style={
          categoriaColor
            ? { backgroundImage: `radial-gradient(ellipse at top, ${categoriaColor}33 0%, transparent 60%)` }
            : {}
        }
      />
      <div className="app-header">
        <h1>Registro de Gastos</h1>
        <p>Controla tus gastos y organízalos por categoría</p>
      </div>

      <div className="gastos-tabs">
        <button
          className={`gastos-tab ${tab === 'registro' ? 'activo' : ''}`}
          onClick={() => setTab('registro')}
        >
          Registro
        </button>
        <button
          className={`gastos-tab ${tab === 'categorias' ? 'activo' : ''}`}
          onClick={() => setTab('categorias')}
        >
          Categorías
        </button>
      </div>

      {tab === 'registro' ? (
        <div className="layout">
          <div className="card">
            <GastoForm
              categorias={categorias}
              onAgregar={agregarGasto}
              onCategoriaChange={setCategoriaSeleccionada}
            />
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
              <GastoLista
                gastos={gastosFiltrados}
                categorias={categorias}
                onEliminar={setConfirmarId}
                onEditar={setGastoEditando}
              />
            </div>
            {gastosFiltrados.length > 0 && (
              <>
                <hr className="separador" />
                <ResumenCategorias gastos={gastosFiltrados} categorias={categorias} />
              </>
            )}
          </div>
        </div>
      ) : (
        <CategoriasPage categorias={categorias} onCambio={cargarCategorias} />
      )}
    </div>
  )
}

export default RegistroGastos
