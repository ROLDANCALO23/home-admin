import { useState, useEffect } from 'react'
import GastoForm from '../components/GastoForm'
import GastoLista from '../components/GastoLista'
import FiltroRango from '../components/FiltroRango'
import ToastContainer from '../components/ToastContainer'
import ConfirmDialog from '../../../components/ConfirmDialog'
import GastoEditDialog from '../components/GastoEditDialog'
import { supabase } from '../../../lib/supabase'
import { useToast } from '../../../lib/useToast'
import './RegistroGastos.css'

function RegistroGastos() {
  const [gastos, setGastos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [categorias, setCategorias] = useState([])
  const hoy = new Date()
  const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0]
  const hoyStr = hoy.toISOString().split('T')[0]

  const [desde, setDesde] = useState(primerDiaMes)
  const [hasta, setHasta] = useState(hoyStr)
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('')
  const [filtroResponsable, setFiltroResponsable] = useState('todos')
  const { toasts, addToast } = useToast()
  const [confirmarId, setConfirmarId] = useState(null)
  const [gastoEditando, setGastoEditando] = useState(null)
  const [formAbierto, setFormAbierto] = useState(false)

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
        setCargando(false)
      })
  }, [])

  const agregarGasto = async (gasto) => {
    const nuevo = { ...gasto, id: Date.now() }
    const { error } = await supabase.from('gastos').insert(nuevo)
    if (error) {
      addToast('No se pudo guardar el gasto', 'error')
    } else {
      setGastos([nuevo, ...gastos])
      setFormAbierto(false)
      addToast('Gasto agregado correctamente', 'success')
      supabase.functions.invoke('notificar-gasto', {
        body: {
          descripcion: gasto.descripcion,
          monto: gasto.monto,
          categoria: gasto.categoria,
          responsable: gasto.responsable ?? null,
          fecha: gasto.fecha instanceof Date ? gasto.fecha.toISOString() : gasto.fecha,
        },
      })
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
        responsable: gasto.responsable ?? null,
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

  const responsables = ['todos', ...Array.from(
    new Set(gastos.map(g => g.responsable).filter(Boolean))
  )]

  const gastosFiltrados = gastos
    .filter((g) => {
      const fecha = new Date(g.fecha)
      if (desde && fecha < new Date(desde + 'T00:00:00')) return false
      if (hasta && fecha > new Date(hasta + 'T23:59:59')) return false
      if (filtroResponsable !== 'todos' && g.responsable !== filtroResponsable) return false
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
        <h1>Gastos</h1>
        <p>Controla tus gastos y organízalos por categoría</p>
      </div>

      {formAbierto && (
        <div className="form-overlay" onClick={() => setFormAbierto(false)}>
          <div className="form-dialog" onClick={e => e.stopPropagation()}>
            <button className="form-dialog-cerrar" onClick={() => setFormAbierto(false)}>✕</button>
            <GastoForm
              categorias={categorias}
              onAgregar={agregarGasto}
              onCategoriaChange={setCategoriaSeleccionada}
              onCambioCategorias={cargarCategorias}
            />
          </div>
        </div>
      )}

      <div className="layout">
        <div className="card card--gastos">
          <div className="gastos-header">
            {responsables.length > 1 && (
              <div className="responsable-filtro">
                {responsables.map(r => (
                  <button
                    key={r}
                    className={`resp-pill${filtroResponsable === r ? ' resp-pill--activo' : ''}`}
                    onClick={() => setFiltroResponsable(r)}
                  >
                    {r === 'todos' ? 'Todos' : r}
                  </button>
                ))}
              </div>
            )}
            <div className="fab-zone">
              <span className="fab-arrows">›  ›  ›</span>
              <div className="fab-btn-wrap">
                <button className="btn-fab" onClick={() => setFormAbierto(true)}>＋</button>
                <span className="fab-tooltip">Nuevo gasto</span>
              </div>
            </div>
          </div>
          <FiltroRango
            desde={desde}
            hasta={hasta}
            onChangeDe={setDesde}
            onChangeHasta={setHasta}
          />
          <div className="gastos-scroll">
            <GastoLista
              gastos={gastosFiltrados}
              cargando={cargando}
              categorias={categorias}
              onEliminar={setConfirmarId}
              onEditar={setGastoEditando}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegistroGastos
