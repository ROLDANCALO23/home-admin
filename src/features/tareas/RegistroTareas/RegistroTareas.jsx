import { useState, useEffect } from 'react'
import TareaForm from '../components/TareaForm'
import TareaLista from '../components/TareaLista'
import ToastContainer from '../../gastos/components/ToastContainer'
import { supabase } from '../../../lib/supabase'
import { useToast } from '../../../lib/useToast'
import './RegistroTareas.css'

function RegistroTareas() {
  const [tareas, setTareas] = useState([])
  const { toasts, addToast } = useToast()

  useEffect(() => {
    supabase
      .from('tareas')
      .select('*')
      .order('orden', { ascending: true })
      .then(({ data, error }) => {
        if (!error) setTareas(data)
      })
  }, [])

  const agregarTarea = async (tarea) => {
    const nueva = {
      ...tarea,
      id: Date.now(),
      fecha_registro: new Date().toISOString(),
      orden: tareas.length,
    }
    const { error } = await supabase.from('tareas').insert(nueva)
    if (error) {
      addToast('No se pudo guardar la tarea', 'error')
    } else {
      setTareas([...tareas, nueva])
      addToast('Tarea agregada', 'success')
    }
  }

  const eliminarTarea = async (id) => {
    const { error } = await supabase.from('tareas').delete().eq('id', id)
    if (error) {
      addToast('No se pudo eliminar la tarea', 'error')
    } else {
      setTareas(tareas.filter((t) => t.id !== id))
      addToast('Tarea eliminada', 'success')
    }
  }

  const reordenarTareas = async (desde, hasta) => {
    const nuevas = [...tareas]
    const [movida] = nuevas.splice(desde, 1)
    nuevas.splice(hasta, 0, movida)
    const conOrden = nuevas.map((t, i) => ({ ...t, orden: i }))
    setTareas(conOrden)

    const updates = conOrden.map((t) =>
      supabase.from('tareas').update({ orden: t.orden }).eq('id', t.id)
    )
    await Promise.all(updates)
  }

  return (
    <div className="registro-tareas">
      <div className="pagina-fondo" />
      <ToastContainer toasts={toasts} />
      <div className="app-header">
        <h1>Lista de Tareas</h1>
        <p>Organiza y prioriza tus pendientes</p>
      </div>
      <div className="layout">
        <div className="card">
          <TareaForm onAgregar={agregarTarea} />
        </div>
        <div className="card card--tareas">
          <div className="tareas-header">
            <div className="gastos-titulo-wrap">
              <span className="gastos-titulo">TAREAS</span>
              {tareas.length > 0 && (
                <span className="gastos-badge">{tareas.length}</span>
              )}
            </div>
          </div>
          <TareaLista
            tareas={tareas}
            onEliminar={eliminarTarea}
            onReordenar={reordenarTareas}
          />
        </div>
      </div>
    </div>
  )
}

export default RegistroTareas
